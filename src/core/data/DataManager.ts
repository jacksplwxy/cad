import { BoundingBox, type IAABB } from '../helper/BoundingBox'
import { LayerContainer } from '../layer/LayerContainer'
import { RTree, type BBox, type Node } from './RTree'
import { type ILayer } from '../layer/Layer'
import { RectangleCalculator } from '../utils/math/RectangleCalculator'
import { Point } from '../utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { BaseEventBus } from '../helper/BaseEventBus'

// 元图形类型（不包括矩形，矩形属于多段线组成的衍生图形类型）
export enum MetaEntityType {
  LINE = 'LINE', // 直线
  CONSTRUCTION = 'CONSTRUCTION', // 构造线
  PLINE = 'PLINE', // 多段线
  ARC = 'ARC', // 圆弧
  CIRCLE = 'CIRCLE', // 圆
  SPLINE = 'SPLINE', // B样条曲线
  ELLIPSE = 'ELLIPSE', // 椭圆
  BLOCK = 'BLOCK', // 块
  POINT = 'POINT', // 点
  HELIX = 'HELIX', // 螺旋
  HATCH = 'HATCH', // 图案填充
  REGION = 'REGION', // 面域
  TABLE = 'TABLE', // 表格
  MTEXT = 'MTEXT', // 多行文本
}

// 图形形状数据
export interface IShape {
  type: MetaEntityType // 图元类型
  points?: number[][] // 坐标信息
  r?: number // 半径
  startAngle?: number //圆弧开始的角度，单位是弧度
  endAngle?: number //圆弧结束的角度，单位是弧度
  anticlockwise?: boolean // 弧度的开始到结束的绘制是按照逆时针来算，默认为false。如何设置为true，则表示按照逆时针方向从startAngle绘制到endAngle。
  color?: string | CanvasGradient | CanvasPattern // 颜色
  lineWidth?: number // 线宽
  lineDash?: number[] // 线形
}

// 图形实体数据
export interface IEntity {
  id: string
  layer: ILayer
  type: MetaEntityType
  shape: IShape[]
  AABB?: IAABB | []
  other?: {
    closed?: boolean // 是否闭合
    collisioned?: boolean // 是否光标碰撞
    boxSelected?: boolean // 被框选
  }
}

// 临时图形实体数据（不包含id和layer）
export type IEntityTemp = Omit<IEntity, 'id' | 'layer'>

enum DerivedDataUpdatedType {
  ADD,
  EDIT,
  DELETE,
}

export const DataManagerEvent = {
  ADD: 'ADD',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
}

@injectable()
export class DataManager extends BaseEventBus {
  @inject(LayerContainer) private layerComtainer!: LayerContainer
  @inject(BoundingBox) private boundingBox!: BoundingBox
  private entityRTree!: EntityRTree
  private readonly _derivedData = {
    selectionBoxEntities: [] as IEntity[], // 被选中的实体
    collisionEntity: null as IEntity | null | undefined, // 光标触碰到的实体
  }
  // private readonly cache: IEntity[] =
  // [
  //   {
  //     id: 'line1',
  //     layer: '',
  //     type: MetaEntityType.LINE,
  //     shape: [
  //       {
  //         type: MetaEntityType.LINE,
  //         points: [
  //           [0, 0, 0],
  //           [10, 10, 0],
  //         ],
  //         color: '#fff',
  //       },
  //     ],
  //   },
  //   {
  //     id: 'circle1',
  //     layer: '',
  //     type: MetaEntityType.CIRCLE,
  //     shape: [
  //       {
  //         type: MetaEntityType.CIRCLE,
  //         points: [[0, 0, 0]],
  //         r: 10,
  //         color: '#fff',
  //       },
  //     ],
  //   },
  //   {
  //     id: 'arc1',
  //     layer: '',
  //     type: MetaEntityType.ARC,
  //     shape: [
  //       {
  //         type: MetaEntityType.ARC,
  //         points: [[0, 0, 0]],
  //         r: 10,
  //         startAngle: 0,
  //         endAngle: Math.PI / 2,
  //         anticlockwise: true,
  //         color: '#fff',
  //       },
  //     ],
  //   },
  //   {
  //     id: 'construction1',
  //     layer: '',
  //     type: MetaEntityType.CONSTRUCTION,
  //     shape: [
  //       {
  //         type: MetaEntityType.CONSTRUCTION,
  //         points: [
  //           [0, 0, 0],
  //           [10, 20, 0],
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     id: 'polyline1', // 注意，矩形属于polyline中的一种
  //     layer: '',
  //     type: MetaEntityType.PLINE,
  //     shape: [
  //       {
  //         type: MetaEntityType.LINE,
  //         points: [
  //           [0, 0, 0],
  //           [20, 0, 0],
  //         ],
  //       },
  //       {
  //         type: MetaEntityType.LINE,
  //         points: [
  //           [20, 0, 0],
  //           [20, 20, 0],
  //         ],
  //       },
  //       {
  //         type: MetaEntityType.ARC,
  //         points: [ [0, 0, 0] ],
  //         r: 10,
  //         startAngle: 0,
  //         endAngle: Math.PI / 2,
  //       },
  //     ],
  //     other: {
  //       closed: true, // 闭合为true时表示data数组中最后一个元素会自动以直线的方式连接到一个元素上
  //     },
  //   },
  // ]

  // 设置构造函数private，防止new实例化
  public constructor() {
    super()
    this.EntityRTreeInit()
  }

  // 只允许get取值，不允许set改值。
  get selectionBoxEntities(): IEntity[] {
    return this._derivedData.selectionBoxEntities
  }

  // 只允许get取值，不允许set改值。
  get collisionEntity(): IEntity | null | undefined {
    return this._derivedData.collisionEntity
  }

  // 只允许get取值，不允许set改值。Readonly保证_data内部对象不允许被修改
  public all(): IEntity[] {
    return this.entityRTree.all()
  }

  public toJSON(): Node {
    return this.entityRTree.toJSON()
  }

  // 根据id获取实体
  public getEntityById(id: string): IEntity | undefined {
    return this.entityRTree.all().find((item) => {
      if (item.id === id) {
        return true
      } else {
        return false
      }
    })
  }

  // 光标碰撞探测
  public cursorCollisionDetect(AABB: IAABB): IEntity | null {
    return this.entityRTree.collides({
      minX: AABB[0][0],
      minY: AABB[0][1],
      maxX: AABB[1][0],
      maxY: AABB[1][1],
    })
  }

  // 根据范围获取范围内所有实体（向左框选）
  public getEntityByAABB(AABB: IAABB, accurateCollision = false): IEntity[] {
    return this.entityRTree.search(
      {
        minX: AABB[0][0],
        minY: AABB[0][1],
        maxX: AABB[1][0],
        maxY: AABB[1][1],
      },
      accurateCollision,
    )
  }

  // 根据范围获取范围内所有实体（向右框选）
  public getEntityByAABBAllIn(AABB: IAABB): IEntity[] {
    return this.entityRTree.searchAllIn({
      minX: AABB[0][0],
      minY: AABB[0][1],
      maxX: AABB[1][0],
      maxY: AABB[1][1],
    })
  }

  // 添加数据集
  public addEntityData(entityArr: IEntity[]): void {
    entityArr = entityArr.map((entity) => {
      entity.AABB = this.boundingBox.getAABB(entity)
      entity.layer = this.layerComtainer.getCurrentLayer()
      return entity
    })
    this.entityRTree.load(entityArr)
    this.updateDerivedData(DerivedDataUpdatedType.ADD, entityArr)
    this.dispatchEvent(DataManagerEvent.ADD, entityArr)
  }

  // 编辑数据集
  public editEntitiesData(entityArr: IEntity[]): void {
    // 获取包含所有entity的范围
    const oldEntityArrAABB = this.boundingBox.getEntitiesAABB(entityArr, false)
    console.time('纯数据更新')
    entityArr.forEach((entity) => {
      const oldAABB = entity.AABB as IAABB
      const newAABB = this.boundingBox.getAABB(entity) as IAABB
      // 编辑的引用数据:对比新旧包围盒大小，如果AABB范围没有变化，则应该直接修改数据，而无需再执行remove和insert
      if (!oldAABB || oldAABB[0][0] !== newAABB[0][0] || oldAABB[0][1] !== newAABB[0][1] || oldAABB[1][0] !== newAABB[1][0] || oldAABB[1][1] !== newAABB[1][1]) {
        this.entityRTree.remove(entity)
        entity.AABB = newAABB
        this.entityRTree.insert(entity)
      }
    })
    console.timeEnd('纯数据更新')
    console.log(`更新数量：${entityArr.length}`)

    this.updateDerivedData(DerivedDataUpdatedType.EDIT, entityArr)
    this.dispatchEvent(DataManagerEvent.EDIT, entityArr, {
      oldAABB: oldEntityArrAABB,
    })
  }

  // 删除数据集
  public delEntityData(entityArr: IEntity[]): void {
    // 获取包含所有entity的范围
    const oldEntityArrAABB = this.boundingBox.getEntitiesAABB(entityArr, false)
    entityArr.forEach((entity) => {
      this.entityRTree.remove(entity)
    })
    this.updateDerivedData(DerivedDataUpdatedType.DELETE, entityArr)
    this.dispatchEvent(DataManagerEvent.DELETE, entityArr, {
      oldAABB: oldEntityArrAABB,
    })
  }

  // R树初始化
  private EntityRTreeInit(): void {
    this.entityRTree = new EntityRTree(9)
  }

  // 更新衍生数据
  private updateDerivedData(type: DerivedDataUpdatedType, entityArr: IEntity[]): void {
    console.time('DerivedDataUpdatedType.EDIT')
    this.updateSelectionBoxEntities(type, entityArr)
    this.updateCollisionEntity(type, entityArr)
    console.timeEnd('DerivedDataUpdatedType.EDIT')
  }

  // 更新选中实体 @wxy：低性能算法
  private updateSelectionBoxEntities(type: DerivedDataUpdatedType, entityArr: IEntity[]): void {
    if (entityArr.length > 10 || this._derivedData.selectionBoxEntities.length > 10) {
      this._derivedData.selectionBoxEntities = this.entityRTree.all().filter((entity) => {
        return entity.other?.boxSelected
      })
    } else {
      switch (type) {
        case DerivedDataUpdatedType.DELETE: {
          // delete this._derivedData.selectionBoxEntities[entity.id]
          this._derivedData.selectionBoxEntities = this._derivedData.selectionBoxEntities.filter((item) => {
            if (
              entityArr.findIndex((entity) => {
                return entity.id === item.id
              }) > -1
            ) {
              return false
            } else {
              return true
            }
          })
          break
        }
        default: {
          entityArr.forEach((entity) => {
            if (entity.other?.boxSelected) {
              const index = this._derivedData.selectionBoxEntities.findIndex((item) => {
                return entity.id === item.id
              })
              if (index > -1) {
                this._derivedData.selectionBoxEntities[index] = entity
              } else {
                this._derivedData.selectionBoxEntities.push(entity)
              }
            } else {
              this._derivedData.selectionBoxEntities = this._derivedData.selectionBoxEntities.filter((item) => {
                return item.id !== entity.id
              })
            }
          })
        }
      }
    }
  }

  // 更新光标触碰实体
  private updateCollisionEntity(type: DerivedDataUpdatedType, entityArr: IEntity[]): void {
    this._derivedData.collisionEntity = entityArr.find((entity) => {
      return entity.other?.collisioned
    })
  }
}

class EntityRTree extends RTree {
  @inject(BoundingBox) private boundingBox!: BoundingBox
  protected toBBox(entity: IEntity): BBox {
    let AABB = entity.AABB as IAABB
    if (!AABB) {
      AABB = this.boundingBox.getAABB(entity) as IAABB
      entity.AABB = AABB
    }
    return {
      ...entity,
      minX: AABB[0][0],
      minY: AABB[0][1],
      maxX: AABB[1][0],
      maxY: AABB[1][1],
    }
  }

  // x方向排序规则
  protected compareMinX(entity1: IEntity, entity2: IEntity): number {
    return (entity1.AABB as IAABB)[0][0] - (entity2.AABB as IAABB)[0][0]
  }

  // y方向排序规则
  protected compareMinY(entity1: IEntity, entity2: IEntity): number {
    return (entity1.AABB as IAABB)[0][1] - (entity2.AABB as IAABB)[0][1]
  }

  // 精准碰撞方法
  protected accurateCollisionFn(bbox: BBox, entity: IEntity): boolean {
    const AABB: IAABB = [
      [bbox.minX, bbox.minY],
      [bbox.maxX, bbox.maxY],
    ]
    return entity.shape.some((metaShape) => {
      switch (metaShape.type) {
        case MetaEntityType.LINE: {
          return new RectangleCalculator(AABB[0], AABB[1]).isIntersectSegment((metaShape.points as Point[])[0], (metaShape.points as Point[])[1])
        }
        case MetaEntityType.MTEXT: {
          return new RectangleCalculator(AABB[0], AABB[1]).isIntersectRectangleEdge((metaShape.points as Point[])[0], (metaShape.points as Point[])[1])
        }
        case MetaEntityType.CIRCLE: {
          if (Array.isArray(metaShape.points) && metaShape.r) {
            return new RectangleCalculator(AABB[0], AABB[1]).isIntersectCircleAndCenter(metaShape.points[0] as Point, metaShape.r)
          }
          break
        }
        case MetaEntityType.ARC: {
          if (Array.isArray(metaShape.points) && metaShape.r && metaShape.startAngle && metaShape.endAngle) {
            return new RectangleCalculator(AABB[0], AABB[1]).isIntersectArc(metaShape.points[0] as Point, metaShape.r, metaShape.startAngle, metaShape.endAngle, metaShape.anticlockwise)
          }
          break
        }
        // @wxy 待完善判定
      }
      return false
    })
  }
}
