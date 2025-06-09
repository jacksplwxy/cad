import { type IAABB } from '../helper/BoundingBox'
import { type IEntity } from './DataManager'

interface IOptions {
  bounds: IAABB
  maxObjects?: number
  maxLevels?: number
  level?: number
  objects?: any[]
  nodes?: any[]
}

export class Quadtree {
  private readonly maxObjects: number
  private readonly maxLevels: number
  private readonly level: number
  private entities: Record<string, IEntity>
  public bounds: IAABB
  public nodes: Quadtree[]

  constructor(opt: IOptions) {
    if (!opt.bounds) {
      throw new Error('bounds必填！')
    }
    this.bounds = opt.bounds
    this.maxObjects = opt.maxObjects ?? 20
    this.maxLevels = opt.maxLevels ?? 4
    this.level = opt.level ?? 0
    this.entities = {}
    this.nodes = []
  }

  /**
   * 当前节点分割为4个子节点
   */
  private split(): void {
    const nextLevel = this.level + 1
    const [startX, startY] = this.bounds[0]
    const [endX, endY] = this.bounds[1]
    const subWidth = (endX - startX) / 2
    const subHeight = (endY - startY) / 2

    // Top right node
    this.nodes[0] = new Quadtree({
      bounds: [
        [startX + subWidth, startY],
        [endX, startY + subHeight],
      ],
      maxObjects: this.maxObjects,
      maxLevels: this.maxLevels,
      level: nextLevel,
    })

    // Top left node
    this.nodes[1] = new Quadtree({
      bounds: [
        [startX, startY],
        [startX + subWidth, startY + subHeight],
      ],
      maxObjects: this.maxObjects,
      maxLevels: this.maxLevels,
      level: nextLevel,
    })

    // Bottom left node
    this.nodes[2] = new Quadtree({
      bounds: [
        [startX, startY + subHeight],
        [startX + subWidth, endY],
      ],
      maxObjects: this.maxObjects,
      maxLevels: this.maxLevels,
      level: nextLevel,
    })

    // Bottom right node
    this.nodes[3] = new Quadtree({
      bounds: [
        [startX + subWidth, startY + subHeight],
        [endX, endY],
      ],
      maxObjects: this.maxObjects,
      maxLevels: this.maxLevels,
      level: nextLevel,
    })
  }

  /**
   * 决定数据被分配到哪些节点中
   */
  private getIndex(pEntity: IEntity): number[] {
    const indexes: number[] = []
    const [startX, startY] = this.bounds[0]
    const [endX, endY] = this.bounds[1]
    const verticalMidpoint = startX + (endX - startX) / 2
    const horizontalMidpoint = startY + (endY - startY) / 2

    const startIsNorth = (pEntity.AABB as IAABB)[0][1] < horizontalMidpoint
    const startIsWest = (pEntity.AABB as IAABB)[0][0] < verticalMidpoint
    const endIsEast = (pEntity.AABB as IAABB)[1][0] > verticalMidpoint
    const endIsSouth = (pEntity.AABB as IAABB)[1][1] > horizontalMidpoint

    // Top-right quad
    if (startIsNorth && endIsEast) {
      indexes.push(0)
    }

    // Top-left quad
    if (startIsWest && startIsNorth) {
      indexes.push(1)
    }

    // Bottom-left quad
    if (startIsWest && endIsSouth) {
      indexes.push(2)
    }

    // Bottom-right quad
    if (endIsEast && endIsSouth) {
      indexes.push(3)
    }

    return indexes
  }

  /**
   * 插入数据
   */
  public insert(pEntity: IEntity): void {
    let i = 0
    let indexes: number[]
    // If we have subnodes, call insert on matching subnodes
    if (this.nodes.length) {
      indexes = this.getIndex(pEntity)
      for (i = 0; i < indexes.length; i++) {
        this.nodes[indexes[i]].insert(pEntity)
      }
      return
    }
    // Otherwise, store entity here
    this.entities[pEntity.id] = pEntity
    // @wxy：自动拓展
    // Check if the entity exceeds the bounds of the quadtree
    // if (!this.boundsContainEntity(pEntity)) {
    //   this.adjustBoundsToFitEntity(pEntity)
    // }

    // Max_objects reached
    if (Object.keys(this.entities).length > this.maxObjects && this.level < this.maxLevels) {
      // Split if we don't already have subnodes
      if (!this.nodes.length) {
        this.split()
      }

      // Add all entities to their corresponding subnode
      for (const entityId in this.entities) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.entities.hasOwnProperty(entityId)) {
          indexes = this.getIndex(this.entities[entityId])
          for (let k = 0; k < indexes.length; k++) {
            this.nodes[indexes[k]].insert(this.entities[entityId])
          }
        }
      }

      // Clean up this node
      this.entities = {}
    }
  }

  /**
   * 返回范围内所有数据
   */
  public retrieve(pEntity: IEntity): IEntity[] {
    const indexes = this.getIndex(pEntity)
    let returnEntities: IEntity[] = []

    // If we have subnodes, retrieve their entities
    if (this.nodes.length) {
      for (let i = 0; i < indexes.length; i++) {
        returnEntities = returnEntities.concat(this.nodes[indexes[i]].retrieve(pEntity))
      }
    }

    // Remove duplicates
    if (this.level === 0) {
      returnEntities = Array.from(new Set(returnEntities))
    }

    return returnEntities
  }

  /**
   * 更新数据
   * @param pEntity 数据
   */
  update(pEntity: IEntity): void {
    this.remove(pEntity)
    this.insert(pEntity)
  }

  /**
   * 递归清除各级树
   */
  public clear(): void {
    this.entities = {}
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].nodes.length) {
        this.nodes[i].clear()
      }
    }
    this.nodes = []
  }

  /**
   * Check if the quadtree bounds contain the given entity
   */
  private boundsContainEntity(pEntity: IEntity): boolean {
    const [startX, startY] = this.bounds[0]
    const [endX, endY] = this.bounds[1]
    const entityStartX = pEntity.AABB?.[0]?.[0] ?? 0
    const entityStartY = pEntity.AABB?.[0]?.[1] ?? 0
    const entityEndX = pEntity.AABB?.[1]?.[0] ?? 0
    const entityEndY = pEntity.AABB?.[1]?.[1] ?? 0

    return entityStartX >= startX && entityEndX <= endX && entityStartY >= startY && entityEndY <= endY
  }

  /**
   * Adjust the quadtree bounds to fit the given entity
   */
  private adjustBoundsToFitEntity(pEntity: IEntity): void {
    const [startX, startY] = this.bounds[0]
    const [endX, endY] = this.bounds[1]
    const entityStartX = pEntity.AABB?.[0]?.[0] ?? 0
    const entityStartY = pEntity.AABB?.[0]?.[1] ?? 0
    const entityEndX = pEntity.AABB?.[1]?.[0] ?? 0
    const entityEndY = pEntity.AABB?.[1]?.[1] ?? 0

    const minX = Math.min(entityStartX, startX)
    const minY = Math.min(entityStartY, startY)
    const maxX = Math.max(entityEndX, endX)
    const maxY = Math.max(entityEndY, endY)

    this.bounds = [
      [minX, minY],
      [maxX, maxY],
    ]
  }

  /**
   * 删除数据
   * @param pEntity 待删数据
   * @param fast 是否快速删除，为true时则还要去尝试合并子节点
   * @returns
   */
  public remove(pEntity: IEntity, fast = false): boolean {
    let removed = false
    if (this.entities[pEntity.id]) {
      delete this.entities[pEntity.id]
      removed = true
    }
    // remove from all subnodes
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].remove(pEntity)
    }
    if (this.level === 0 && !fast) {
      this.join()
    }
    return removed
  }

  /**
   * 递归检查少于maxObjects则合并子节点
   */
  public join(): Record<string, IEntity> {
    let allEntities = Object.assign({}, this.entities)
    for (let i = 0; i < this.nodes.length; i++) {
      const bla = this.nodes[i].join()
      allEntities = Object.assign(allEntities, bla)
    }

    if (Object.keys(allEntities).length <= this.maxObjects) {
      this.entities = allEntities
      for (let i = 0; i < this.nodes.length; i++) {
        this.nodes[i].entities = {}
      }
      this.nodes = []
    }

    return allEntities
  }
}
