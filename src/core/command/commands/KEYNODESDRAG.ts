import { BaseCommand, MetaCommandWorkflowType, type ICommandRule, IMetaCommandRunResult } from '../BaseCommand'
import { MetaEntityType, IEntity } from '@/core/data/DataManager'
import { deepCopy, isNumArray, isNumeric } from '@/core/utils/utils'
import { IKeyNodeInfo } from '@/core/data/EntitiesKeyNodeManager'
import { SnapType } from '@/core/interaction/Snaps'
import { PointCalculator } from '@/core/utils/math/PointCalculator'
import { Point } from '@/core/utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class KEYNODESDRAG extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '拖拽关键节点'
  private currentCommandStateStr = '' // 命令状态
  private interactionDataArr: {
    commandStateStr: string
    data: any
  }[] = []
  private queue = new MessageQueue(new ExecuteLatestStrategy())
  private addTask = () => {
    this.queue.addTask(this.drawInteractionShape)
  }
  private keyNodeInfo: IKeyNodeInfo[] = []
  protected rule: ICommandRule = {
    action: (param: IKeyNodeInfo[]) => {
      if (this.dataManager.selectionBoxEntities.length <= 0) {
        return {
          data: { event: 'CommandSelect' },
          metaCommandWorkflowType: MetaCommandWorkflowType.Over,
        }
      }

      this.currentCommandStateStr = ''
      this.interactionDataArr = []
      this.mouse.addEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
      this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)

      this.keyNodeInfo = param
      this.interactionDataArr[0] = {
        commandStateStr: 'POINT1',
        data: {
          point: (this.mouse.mouseRecords[this.mouse.mouseRecords.length - 1] as Point) || [0, 0],
        },
      }
    },
    msg: '移动',
    next: ['POINT2'],
    // end: false,
    subCommand: {
      POINT2: {
        action: (params: any) => {
          this.currentCommandStateStr = 'POINT2'
          return this.setFinalPoint(params)
        },
        msg: '指定第二个点',
        next: [],
        // end: true
      },
    },
  }

  // 设置最终的位置
  private setFinalPoint(params?: any): void | IMetaCommandRunResult {
    const selectionBoxEntitiesNum = this.dataManager.selectionBoxEntities.length
    if (selectionBoxEntitiesNum > 0) {
      if (isNumArray(params)) {
        this.interactionDataArr[1] = {
          commandStateStr: 'POINT2',
          data: {
            point: params as Point,
          },
        }
      } else if (isNumeric(params)) {
        this.interactionDataArr[1] = {
          commandStateStr: 'POINT2',
          data: {
            point: [0, 0] as Point,
          },
        }
        const point0 = this.interactionDataArr[0].data.point
        const finalPointPosition = this.movePoint(point0, [this.mouse.mouseX - point0[0], this.mouse.mouseY - point0[1]], Number(params))
        this.interactionDataArr[1].data.point = finalPointPosition
      } else {
        console.log('请选择坐标点')
        return {
          metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
        }
      }
      // 基于最原始数据多次复制
      this.shapeEdit(this.getNewEntitiesByVector())
      console.info(`移动了${selectionBoxEntitiesNum}个对象`)
    }
  }

  // 点point沿向量方向vector移动距离distance后的位置
  private movePoint(point: number[], vector: number[], distance: number): number[] {
    const [x, y] = point
    const [a, b] = vector
    // 计算单位向量
    const length = Math.sqrt(a * a + b * b)
    const unitVector = [a / length, b / length]
    return [x + distance * unitVector[0], y + distance * unitVector[1]]
  }

  // 绘制临时交互图形
  private drawInteractionShape = (): void => {
    if (this.interactionDataArr[0]) {
      const interactionEnties = []
      // 绘制线段
      const refline = {
        type: MetaEntityType.LINE,
        shape: [
          {
            type: MetaEntityType.LINE,
            points: [this.interactionDataArr[0].data.point, [this.mouse.mouseX, this.mouse.mouseY]],
          },
        ],
      }
      interactionEnties.push(refline)
      interactionEnties.push(...this.getNewEntitiesByVector())

      this.clearInteractionShape()
      this.guide.render(interactionEnties).then(() => {
        if (!this.isRunning) {
          this.clearInteractionShape()
        }
      })
    }
  }

  // 根据位移向量获取新图形数据
  private getNewEntitiesByVector(): IEntity[] {
    if (this.interactionDataArr[0]) {
      const vector = [this.mouse.mouseX - this.interactionDataArr[0].data.point[0], this.mouse.mouseY - this.interactionDataArr[0].data.point[1]]
      return this.keyNodeInfo.map((keyNodeInfo) => {
        const entity = deepCopy(keyNodeInfo.entity)
        switch (entity.shape[keyNodeInfo.shapeIndex].type) {
          case MetaEntityType.LINE: {
            switch (keyNodeInfo.keyNode) {
              case SnapType.Endpoint: {
                switch (keyNodeInfo.pointIndex) {
                  // 起点移动
                  case 0:
                  case 1: {
                    const point = entity.shape[keyNodeInfo.shapeIndex].points?.[keyNodeInfo.pointIndex]
                    if (point) {
                      point[0] = point[0] + vector[0]
                      point[1] = point[1] + vector[1]
                    }
                    break
                  }
                }
                if (entity.other?.boxSelected) {
                  entity.other.boxSelected = false
                }
                break
              }
              // 线段平移
              case SnapType.Midpoint: {
                entity.shape.forEach((item) => {
                  item.points?.forEach((numArr) => {
                    numArr.forEach((num, index) => {
                      if (vector[index]) {
                        numArr[index] = num + vector[index]
                      }
                    })
                  })
                })
                if (entity.other?.boxSelected) {
                  entity.other.boxSelected = false
                }
                break
              }
            }
            break
          }
          case MetaEntityType.MTEXT: {
            switch (keyNodeInfo.keyNode) {
              case SnapType.Endpoint: {
                switch (keyNodeInfo.pointIndex) {
                  case 0:
                  case 1:
                  case 2:
                  case 3: {
                    const point = entity.shape[keyNodeInfo.shapeIndex].points?.[keyNodeInfo.pointIndex]
                    if (point) {
                      point[0] = point[0] + vector[0]
                      point[1] = point[1] + vector[1]
                    }
                    break
                  }
                }
                if (entity.other?.boxSelected) {
                  entity.other.boxSelected = false
                }
                break
              }
            }
            break
          }
          case MetaEntityType.CIRCLE: {
            switch (keyNodeInfo.keyNode) {
              // 圆心则平移
              case SnapType.Center: {
                const center = entity.shape[keyNodeInfo.shapeIndex].points?.[0]
                if (center) {
                  center[0] = center[0] + vector[0]
                  center[1] = center[1] + vector[1]
                }
                if (entity.other?.boxSelected) {
                  entity.other.boxSelected = false
                }
                break
              }
              //象限点则缩放
              case SnapType.Quadrant: {
                const center = entity.shape[keyNodeInfo.shapeIndex].points?.[0] as Point
                const centerCal = new PointCalculator(center)
                const r = centerCal.getToPointDistance([this.mouse.mouseX, this.mouse.mouseY] as Point)
                entity.shape[keyNodeInfo.shapeIndex].r = r
                if (entity.other?.boxSelected) {
                  entity.other.boxSelected = false
                }
              }
            }
            break
          }
          case MetaEntityType.ARC: {
            switch (keyNodeInfo.keyNode) {
              case SnapType.Center: {
                // 弧心则平移
                break
              }
              case SnapType.Midpoint: {
                //中点则缩放
                break
              }
              case SnapType.Endpoint: {
                //端点则缩放
                break
              }
            }
            break
          }
        }
        return entity
      })
    } else {
      return []
    }
  }

  // 清除临时交互图形
  private clearInteractionShape(): void {
    this.guide.clearAll()
  }

  protected dispose() {
    this.clearInteractionShape()
    this.mouse.removeEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
    this.mouse.removeEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
  }
}
