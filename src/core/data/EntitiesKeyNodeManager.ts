import { Point } from '../utils/math/ComputGeometry'
import { DataManager, DataManagerEvent, IEntity, IShape, MetaEntityType } from './DataManager'
import { SnapType } from '../interaction/Snaps'
import { IAABB } from '../helper/BoundingBox'
import { RectangleCalculator } from '../utils/math/RectangleCalculator'
import { LineCalculator } from '../utils/math/LineCalculator'
import { CircleCalculator } from '../utils/math/CircleCalculator'
import { LRUCache } from '../helper/LRUCache'
import { inject, injectable, postConstruct } from 'inversify'

type SnapKeyNodeResult = {
  [snapType in SnapType]?: Point[]
}

// 关键节点信息
export interface IKeyNodeInfo {
  entity: IEntity //entity
  shapeIndex: number //shapes下索引
  keyNode: SnapType //关键节点类型
  pointIndex: number //第几个点，例如象限有4个点
  coordinate: Point // 关键节点坐标
}

@injectable()
export class EntitiesKeyNodeManager {
  @inject(DataManager) private dataManager!: DataManager
  private entitiesKeyNodesCache: LRUCache = new LRUCache(20) // 图形关键节点数据缓存列表

  constructor() {}

  //获取多个图形本身关键点
  public getEntitiesKeyNodes(mouseRectangle: IAABB, entityArr: Array<IEntity>, openSnapType?: SnapType[]): Array<IKeyNodeInfo> {
    // 求图形关键节点
    this.getEntitiesArrKeyNode(entityArr)
    // 判断光标是否与关键点相交
    const rectangleCalculator = new RectangleCalculator(mouseRectangle[0], mouseRectangle[1])
    const keyNodeArrResult: Array<IKeyNodeInfo> = []
    entityArr.forEach((entity) => {
      const entityNodes = this.entitiesKeyNodesCache.get(entity.id) as Array<SnapKeyNodeResult>
      if (!entityNodes) {
        return null
      }
      // 多shape的SnapKeyNodeResult
      entityNodes.forEach((snapKeyNodeResult, index) => {
        // 单SnapKeyNodeResult
        Object.entries(snapKeyNodeResult).forEach(([snapType, keyPointArr]) => {
          const itemSnapType = Number(snapType) as SnapType
          const itemKeyPointArr = keyPointArr as Point[]
          itemKeyPointArr.forEach((keyPoint, pointIndex) => {
            if (!openSnapType || (Array.isArray(openSnapType) && openSnapType.includes(itemSnapType))) {
              if (rectangleCalculator.isPointInside(keyPoint)) {
                keyNodeArrResult.push({
                  entity: entity,
                  shapeIndex: index,
                  keyNode: itemSnapType,
                  pointIndex,
                  coordinate: keyPoint,
                })
              }
            }
          })
        })
      })
    })
    return keyNodeArrResult
  }

  // 获取实体数组的图像自身关键节点
  private getEntitiesArrKeyNode(entityArr: IEntity[]): void {
    entityArr.forEach((entity) => {
      const entitiesKeyNodesCache = this.entitiesKeyNodesCache.get(entity.id)
      if (entitiesKeyNodesCache) {
        this.entitiesKeyNodesCache.put(entity.id, entitiesKeyNodesCache)
      } else {
        const keyNodeResult = [] as Array<SnapKeyNodeResult>
        entity.shape.forEach((shapeMeta, index) => {
          keyNodeResult[index] = this.getSnapKeyNode(shapeMeta)
        })
        this.entitiesKeyNodesCache.put(entity.id, keyNodeResult)
      }
    })
  }

  /**
   * 求meta图形自身所有关键点
   * (线段：端点(起点)、中点、端点(终点))
   * (多行文本：端点(左上点)、端点(右上点)、端点(右下点)、端点(左下点))
   * (圆：圆心、象限点)
   * (圆弧：圆心、端点(起点)、端点(终点)、中点)
   * @param shapeMeta 单个图形
   * @returns 单个图形的关键节点
   */
  private getSnapKeyNode(shapeMeta: IShape): SnapKeyNodeResult {
    const result: SnapKeyNodeResult = {}
    switch (shapeMeta.type) {
      case MetaEntityType.LINE: {
        if (Array.isArray(shapeMeta.points)) {
          result[SnapType.Endpoint] = [shapeMeta.points[0] as Point, shapeMeta.points[1] as Point]
        } else {
          console.error('异常数据')
        }
        if (shapeMeta.points && shapeMeta.points.length >= 2) {
          const centerPoint = new LineCalculator(shapeMeta.points[0] as Point, shapeMeta.points[1] as Point).getMidPoint()
          result[SnapType.Midpoint] = [centerPoint]
        } else {
          console.error('异常数据')
        }
        break
      }
      case MetaEntityType.MTEXT: {
        if (Array.isArray(shapeMeta.points)) {
          const pointStart = shapeMeta.points[0] as Point
          const pointEnd = shapeMeta.points[1] as Point
          // 左上点为起点，逆时针旋转
          result[SnapType.Endpoint] = [pointStart, [pointEnd[0], pointStart[1]], pointEnd, [pointStart[0], pointEnd[1]]]
        } else {
          console.error('异常数据')
        }
        break
      }
      case MetaEntityType.CIRCLE: {
        result[SnapType.Center] = [(shapeMeta.points as number[][])[0] as Point]
        if (shapeMeta.points && shapeMeta.r) {
          const centerPoint = shapeMeta.points[0] as Point
          result[SnapType.Quadrant] = new CircleCalculator(centerPoint, shapeMeta.r).getQuadrantPoints()
        } else {
          console.error('异常数据')
        }
        break
      }
      case MetaEntityType.ARC: {
        result[SnapType.Center] = [[]]
        result[SnapType.Endpoint] = [[], []]
        result[SnapType.Midpoint] = [[]]
      }
    }
    return result
  }

  @postConstruct()
  private dataManagerListenerInit(): void {
    this.dataManager.addEventListener(DataManagerEvent.EDIT, (entityArr: IEntity[], options) => {
      this.deleteEntityKeyNodesCache(entityArr)
    })
    this.dataManager.addEventListener(DataManagerEvent.DELETE, (entityArr: IEntity[], options) => {
      this.deleteEntityKeyNodesCache(entityArr)
    })
  }

  // 监听到图形数据被编辑或删除时删除相关关键节点缓存
  private deleteEntityKeyNodesCache(entityArr: IEntity[]): void {
    entityArr.forEach((entity) => {
      if (this.entitiesKeyNodesCache.has(entity.id)) {
        this.entitiesKeyNodesCache.remove(entity.id)
      }
    })
  }
}
