import { DataManager, MetaEntityType, type IEntity } from '../data/DataManager'
import { ComputGeometry, Point } from '../utils/math/ComputGeometry'
import { LineCalculator } from '../utils/math/LineCalculator'
import { RectangleCalculator } from '../utils/math/RectangleCalculator'
import { IAABB } from '../helper/BoundingBox'
import { PointCalculator } from '../utils/math/PointCalculator'
import { EntitiesKeyNodeManager, IKeyNodeInfo } from '../data/EntitiesKeyNodeManager'
import { inject, injectable } from 'inversify'
import { Mouse } from './Mouse'
import { SystemConfig } from '../store/system/SystemConfig'
import { CursorState, InteractionVisual } from '../visual/InteractionVisual'

export enum SnapType {
  Endpoint, // 端点
  Midpoint, // 中点
  Center, // 圆心
  Node, // 节点
  Quadrant, // 象限点
  Intersection, // 交点
  Extension, // 延伸
  InsertionPoint, // 插入点(插入点通常是块或文字等对象的位置)
  Perpendicular, // 垂足
  Tangent, // 切点
  Nearest, // 最近点
  ApparentIntersection, // 外观交点
  Parallel, // 平行
}

@injectable()
export class Snap {
  @inject(SystemConfig) private systemConfig!: SystemConfig
  @inject(DataManager) private dataManager!: DataManager
  @inject(EntitiesKeyNodeManager) private entitiesKeyNodeManager!: EntitiesKeyNodeManager
  @inject(Mouse) private mouse!: Mouse
  @inject(ComputGeometry) private computGeometry!: ComputGeometry
  @inject(InteractionVisual) private interactionVisual!: InteractionVisual
  private readonly openSnap: boolean = true
  private openSnapType: SnapType[] = [] // 要检测哪些捕捉模式
  private lastIntersectionShapeCoordinate: Point | null = null
  private closestKeyNodeArr: IKeyNodeInfo[] = [] // 距离最近的且相等的关键点集

  public init() {
    this.setOpenSnapType([
      SnapType.Endpoint, // 端点
      SnapType.Midpoint, // 中点
      SnapType.Center, // 圆心
      SnapType.Node, // 节点
      SnapType.Quadrant, // 象限点
      SnapType.Intersection, // 交点
      SnapType.Extension, // 延伸
      SnapType.InsertionPoint, // 插入点
      SnapType.Perpendicular, // 垂足
      SnapType.Tangent, // 切点
      SnapType.Nearest, // 最近点
      SnapType.ApparentIntersection, // 外观交点
      SnapType.Parallel, // 平行
    ])
  }

  // 获取捕捉坐标
  public getSnapBaseCoordinate(cursorState: CursorState | null): Point | null {
    this.closestKeyNodeArr = []
    if (this.canSnap()) {
      if (cursorState === CursorState.CROSS) {
        const snapCoordinate = this.snap()
        return snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
      } else {
        return this.getSnapBaseCoordinateWithoutCommanding(cursorState)
      }
    } else {
      return null
    }
  }

  // 活得距离最近的且相等的关键点集
  public getClosestKeyNodeArr(): IKeyNodeInfo[] {
    console.warn('closestKeyNodeArr数据对外需进一步优化，此为临时方案！')
    return this.closestKeyNodeArr
  }

  // 光标状态是否可以捕捉
  private canSnap(): boolean {
    if (this.openSnap) {
      return true
    } else {
      return false
    }
  }

  // 只允许捕捉被选中的图形的关键节点
  private canOnlySnapselectionBoxEntities(cursorState: CursorState | null): boolean {
    const selectionBoxEntitiesLen = this.dataManager.selectionBoxEntities.length
    if (cursorState === CursorState.CROSSWITHSQUARE && selectionBoxEntitiesLen > 0 && selectionBoxEntitiesLen < this.systemConfig.maxNodeEntityShowNum) {
      return true
    } else {
      return false
    }
  }

  // 获取非命令阶段的捕捉坐标
  private getSnapBaseCoordinateWithoutCommanding(cursorState: CursorState | null): Point | null {
    if (this.canOnlySnapselectionBoxEntities(cursorState)) {
      let snapCoordinate: Point | null = null
      const snapSize = this.systemConfig.snapSize / 2 / this.mouse.visualWorkerView.a
      const mouseRectangle = [
        [this.mouse.mouseX - snapSize / 2, this.mouse.mouseY - snapSize / 2],
        [this.mouse.mouseX + snapSize / 2, this.mouse.mouseY + snapSize / 2],
      ] as IAABB
      let entityArr = this.dataManager.getEntityByAABB(mouseRectangle, true)
      // 只捕捉选中的图形
      entityArr = this.dataManager.selectionBoxEntities.filter((item) => {
        return entityArr.includes(item)
      })
      if (entityArr.length === 0) {
        return null
      } else {
        const keyNodeArrResult = this.entitiesKeyNodeManager.getEntitiesKeyNodes(mouseRectangle, entityArr)
        // 从众多最近点中求得最最近的那个点
        let closestPointInfo: IKeyNodeInfo | null = null
        let minDistance = Number.MAX_VALUE
        const pointCalculator = new PointCalculator([this.mouse.mouseX, this.mouse.mouseY])
        let closestKeyNodeArr: IKeyNodeInfo[] = [] // 距离最近的且相等的点集
        keyNodeArrResult.forEach((item) => {
          const distance = pointCalculator.getToPointDistance(item.coordinate)
          if (closestPointInfo) {
            if (distance < minDistance) {
              minDistance = distance
              closestPointInfo = item
              closestKeyNodeArr = [item]
            } else if (this.computGeometry.numEqual(distance, minDistance)) {
              closestKeyNodeArr.push(item)
            }
          } else {
            minDistance = distance
            closestPointInfo = item
            closestKeyNodeArr.push(item)
          }
        })
        this.closestKeyNodeArr = closestKeyNodeArr

        if (closestPointInfo) {
          snapCoordinate = (closestPointInfo as IKeyNodeInfo).coordinate
          const timer = setTimeout(() => {
            this.drawEndpoint(this.mouse.affineTransformPoint(snapCoordinate as Point), '#26DA6F')
            clearTimeout(timer)
          }, 0)
        }
        return snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
      }
    } else {
      return null
    }
  }

  // 设置要检测哪些捕捉模式
  private setOpenSnapType(snapTypeArr: SnapType[]): void {
    this.openSnapType = snapTypeArr
  }

  /**
   * 捕捉图形关键点和交互关键点
   * @returns 节点或null
   */
  private snap(): Point | null {
    let snapCoordinate = null
    const snapSize = this.systemConfig.snapSize / 2 / this.mouse.visualWorkerView.a
    const mouseRectangle = [
      [this.mouse.mouseX - snapSize / 2, this.mouse.mouseY - snapSize / 2],
      [this.mouse.mouseX + snapSize / 2, this.mouse.mouseY + snapSize / 2],
    ] as IAABB
    const entityArr = this.dataManager.getEntityByAABB(mouseRectangle, true)
    if (entityArr.length === 0) {
      return null
    } else {
      const keyNodeArrResult = this.entitiesKeyNodeManager.getEntitiesKeyNodes(mouseRectangle, entityArr, this.openSnapType)
      // 从众多最近点中求得最最近的那个点
      let closestPointInfo: IKeyNodeInfo | null = null
      let minDistance = Number.MAX_VALUE
      const pointCalculator = new PointCalculator([this.mouse.mouseX, this.mouse.mouseY])
      keyNodeArrResult.forEach((item) => {
        const distance = pointCalculator.getToPointDistance(item.coordinate)
        if (closestPointInfo) {
          if (distance < minDistance) {
            minDistance = distance
            closestPointInfo = item
          }
        } else {
          closestPointInfo = item
        }
      })
      if (closestPointInfo) {
        snapCoordinate = (closestPointInfo as IKeyNodeInfo).coordinate
        this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
        // 绘制图形自身关键节点交互图形
        switch ((closestPointInfo as IKeyNodeInfo).keyNode) {
          case SnapType.Endpoint: {
            if (this.lastIntersectionShapeCoordinate) {
              // 绘制交互图标
              const timer = setTimeout(() => {
                this.drawEndpoint(this.lastIntersectionShapeCoordinate as Point)
                clearTimeout(timer)
              }, 0)
            }
            break
          }
          case SnapType.Midpoint: {
            if (this.lastIntersectionShapeCoordinate) {
              const timer = setTimeout(() => {
                this.drawMidpoint(this.lastIntersectionShapeCoordinate as Point)
                clearTimeout(timer)
              }, 0)
            }
            break
          }
          case SnapType.Quadrant: {
            if (this.lastIntersectionShapeCoordinate) {
              const timer = setTimeout(() => {
                this.drawQuadrant(this.lastIntersectionShapeCoordinate as Point)
                clearTimeout(timer)
              }, 0)
            }
            break
          }
          case SnapType.Tangent: {
            if (this.lastIntersectionShapeCoordinate) {
              const timer = setTimeout(() => {
                this.drawTangency(this.lastIntersectionShapeCoordinate as Point)
                clearTimeout(timer)
              }, 0)
            }
            break
          }
        }
      } else {
        snapCoordinate = null
      }

      if (snapCoordinate) {
        // 返回与光标最近的关键点坐标（结束）
        return snapCoordinate
      } else {
        //是否与单个图形相交
        if (entityArr.length === 1) {
          /**
           * 是否是图形特殊点
           * (线段：垂足)
           * (多行文本：插入点)
           * (圆：切点)
           * （圆弧：切点）
           */
          let isSpecNode = null
          const rectangleCalculator = new RectangleCalculator(mouseRectangle[0], mouseRectangle[1])
          if (this.mouse.mouseRecords.length >= 1) {
            const pointCalculator = new PointCalculator(this.mouse.mouseRecords[this.mouse.mouseRecords.length - 1] as Point)
            isSpecNode = entityArr.some((entity) => {
              return entity.shape.some((shapeItem) => {
                switch (shapeItem.type) {
                  case MetaEntityType.LINE: {
                    const perpendicular = pointCalculator.getSegmentPerpendicular((shapeItem.points as Point[])[0], (shapeItem.points as Point[])[1])
                    if (perpendicular && rectangleCalculator.isPointInside(perpendicular)) {
                      snapCoordinate = perpendicular
                      this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                      if (this.lastIntersectionShapeCoordinate) {
                        // 绘制垂足交互图形
                        const timer = setTimeout(() => {
                          this.drawPerpendicular(this.lastIntersectionShapeCoordinate as Point)
                          clearTimeout(timer)
                        }, 0)
                      }
                      return true
                    }
                    break
                  }
                  case MetaEntityType.MTEXT: {
                    if (shapeItem.points) {
                      snapCoordinate = (shapeItem.points as Point[])[0]
                      this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                      if (this.lastIntersectionShapeCoordinate) {
                        // 绘制插入点交互图形
                        const timer = setTimeout(() => {
                          this.drawInsertionPoint(this.lastIntersectionShapeCoordinate as Point)
                          clearTimeout(timer)
                        }, 0)
                      }
                      return true
                    }
                    break
                  }
                  case MetaEntityType.CIRCLE: {
                    const tangencyArr = pointCalculator.getCircleTangency((shapeItem.points as Point[])[0], shapeItem.r as number)
                    return tangencyArr?.some((tangency) => {
                      if (new RectangleCalculator(mouseRectangle[0], mouseRectangle[1]).isPointInside(tangency)) {
                        snapCoordinate = tangency
                        this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                        if (this.lastIntersectionShapeCoordinate) {
                          // 绘制切点交互图形
                          const timer = setTimeout(() => {
                            this.drawTangency(this.lastIntersectionShapeCoordinate as Point)
                            clearTimeout(timer)
                          }, 0)
                        }
                        return true
                      }
                    })
                    break
                  }
                }
              })
            })
          }
          if (isSpecNode) {
            //返回特殊点（结束）
            return snapCoordinate
          } else {
            //求最近点并返回（结束）
            const pointCalculator = new PointCalculator([this.mouse.mouseX, this.mouse.mouseY])
            entityArr.some((entity) => {
              return entity.shape.some((shapeItem) => {
                switch (shapeItem.type) {
                  case MetaEntityType.LINE: {
                    snapCoordinate = pointCalculator.getSegmentClosest((shapeItem.points as Point[])[0], (shapeItem.points as Point[])[1])
                    this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                    if (this.lastIntersectionShapeCoordinate) {
                      const timer = setTimeout(() => {
                        this.drawClosest(this.lastIntersectionShapeCoordinate as Point)
                        clearTimeout(timer)
                      }, 0)
                      return true
                    }
                    break
                  }
                  case MetaEntityType.MTEXT: {
                    // 无最近点
                    break
                  }
                  case MetaEntityType.CIRCLE: {
                    snapCoordinate = pointCalculator.getCircleClosest((shapeItem.points as Point[])[0], shapeItem.r as number)
                    this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                    if (this.lastIntersectionShapeCoordinate) {
                      const timer = setTimeout(() => {
                        this.drawClosest(this.lastIntersectionShapeCoordinate as Point)
                        clearTimeout(timer)
                      }, 0)
                      return true
                    }
                    break
                  }
                  case MetaEntityType.ARC: {
                    snapCoordinate = pointCalculator.getArcClosest(
                      (shapeItem.points as Point[])[0],
                      shapeItem.r as number,
                      shapeItem.startAngle as number,
                      shapeItem.endAngle as number,
                      shapeItem.anticlockwise as boolean,
                    )
                    this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
                    if (this.lastIntersectionShapeCoordinate) {
                      const timer = setTimeout(() => {
                        this.drawClosest(this.lastIntersectionShapeCoordinate as Point)
                        clearTimeout(timer)
                      }, 0)
                      return true
                    }
                    break
                  }
                }
              })
            })
            return snapCoordinate
          }
        } else {
          // 计算图形间的交点
          snapCoordinate = this.getEntityArrIntersection(entityArr)
          this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
          //求图形之间是否相交（存在一个交点即下一步）
          if (this.lastIntersectionShapeCoordinate) {
            const timer = setTimeout(() => {
              this.drawIntersection(this.lastIntersectionShapeCoordinate as Point)
              clearTimeout(timer)
            }, 0)
            //返回交点（结束）
            return snapCoordinate
          } else {
            //返回与光标最近的最近点坐标（结束）
            const closestPoints: Array<{
              point: Point
              distance: number
            }> = []
            const pointCalculator = new PointCalculator([this.mouse.mouseX, this.mouse.mouseY])
            entityArr.forEach((entity) => {
              return entity.shape.forEach((shapeItem) => {
                switch (shapeItem.type) {
                  case MetaEntityType.LINE: {
                    closestPoints.push(pointCalculator.getSegmentClosestPointAndDistance((shapeItem.points as Point[])[0], (shapeItem.points as Point[])[1]))
                    break
                  }
                  case MetaEntityType.MTEXT: {
                    // 无最近点
                    break
                  }
                }
              })
            })
            // 从众多最近点中求得最最近的那个点
            let closestPoint: { distance: number; point: Point } | null = null
            closestPoints.forEach((item) => {
              if (closestPoint) {
                if (item.distance < closestPoint.distance) {
                  closestPoint = item
                }
              } else {
                closestPoint = item
              }
            })
            snapCoordinate = closestPoint ? (closestPoint as { distance: number; point: Point }).point : null
            this.lastIntersectionShapeCoordinate = snapCoordinate ? this.mouse.affineTransformPoint(snapCoordinate) : null
            if (this.lastIntersectionShapeCoordinate) {
              const timer = setTimeout(() => {
                this.drawClosest(this.lastIntersectionShapeCoordinate as Point)
                clearTimeout(timer)
              }, 0)
            }
            return snapCoordinate
          }
        }
      }
    }
  }

  // 计算图形间的交点
  private getEntityArrIntersection(entityArr: IEntity[]): Point | null {
    let result = null
    entityArr.some((entity, index) => {
      // 拿当前图形与其他图形进行交点计算
      const otherEntityArr = entityArr.slice(index + 1)
      return entity.shape.some((shapeMeta) => {
        switch (shapeMeta.type) {
          // 当前图形的图形类型为线段时
          case MetaEntityType.LINE: {
            const lineCalculator = new LineCalculator((shapeMeta.points as Point[])[0], (shapeMeta.points as Point[])[1])
            return otherEntityArr.some((otherEntity) => {
              return otherEntity.shape.some((otherShapeMeta) => {
                switch (otherShapeMeta.type) {
                  // 其他图形的图形类型为线段时
                  case MetaEntityType.LINE: {
                    const intersect = lineCalculator.getIntersectSegment((otherShapeMeta.points as Point[])[0], (otherShapeMeta.points as Point[])[1])
                    if (intersect) {
                      result = intersect
                      return true
                    }
                    break
                  }
                  case MetaEntityType.MTEXT: {
                    // 无交点
                    break
                  }
                }
              })
            })
            break
          }
          case MetaEntityType.MTEXT: {
            // 无交点
            break
          }
        }
      })
    })
    return result
  }

  // 绘制端点
  private drawEndpoint(coordinate: Point, strokeStyle = '#F2D378'): void {
    this.interactionVisual.drawEndpoint(coordinate, strokeStyle)
  }

  // 绘制中点
  private drawMidpoint(coordinate: Point): void {
    this.interactionVisual.drawMidpoint(coordinate)
  }

  // 绘制垂足
  private drawPerpendicular(coordinate: Point): void {
    this.interactionVisual.drawPerpendicular(coordinate)
  }
  // 绘制插入点
  private drawInsertionPoint(coordinate: Point): void {
    this.interactionVisual.drawInsertionPoint(coordinate)
  }

  // 绘制切点
  private drawTangency(coordinate: Point): void {
    this.interactionVisual.drawTangency(coordinate)
  }
  // 绘制象限点
  private drawQuadrant(coordinate: Point): void {
    this.interactionVisual.drawQuadrant(coordinate)
  }

  // 绘制最近点
  private drawClosest(coordinate: Point): void {
    this.interactionVisual.drawClosest(coordinate)
  }

  // 绘制交点
  private drawIntersection(coordinate: Point): void {
    this.interactionVisual.drawIntersection(coordinate)
  }
}
