import { type IEntity, type IEntityTemp, type IShape, MetaEntityType } from '../data/DataManager'
import { ArcCalculator } from '@/core/utils/math/ArcCalculator'
import { Point } from '../utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { EnvConfig } from '../store/env/EnvConfig'
export type IAABB = [Point, Point]

@injectable()
export class BoundingBox {
  @inject(EnvConfig) protected envConfig!: EnvConfig
  // 获取单个实体的AABB范围
  public getAABB(entity: IEntity | IEntityTemp): IAABB | [] {
    let AABB: IAABB | [] = []
    switch (entity.type) {
      case MetaEntityType.LINE: {
        AABB = this.getLineAABB(entity.shape[0])
        break
      }
      case MetaEntityType.MTEXT: {
        AABB = this.getMTextAABB(entity.shape[0])
        break
      }
      case MetaEntityType.CIRCLE: {
        AABB = this.getCircleAABB(entity.shape[0])
        break
      }
      case MetaEntityType.ARC: {
        AABB = this.getArcAABB(entity.shape[0])
        break
      }
      case MetaEntityType.PLINE: {
        AABB = this.getPlineAABB(entity.shape)
        break
      }
    }
    if (AABB.length) {
      const ghostClearCompensation = this.envConfig.ghostClearCompensation
      return [
        [AABB[0][0] - ghostClearCompensation, AABB[0][1] - ghostClearCompensation],
        [AABB[1][0] + ghostClearCompensation, AABB[1][1] + ghostClearCompensation],
      ]
    } else {
      return AABB
    }
  }

  // 获取多个实体的AABB范围
  public getEntitiesAABB(entities: Array<IEntity | IEntityTemp>, refreshAABB = true): IAABB {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    entities.forEach((entity) => {
      const AABB = refreshAABB ? this.getAABB(entity) : entity.AABB ?? this.getAABB(entity)
      if (AABB.length === 2) {
        const [thisMinX, thisMinY] = AABB[0]
        const [thisMaxX, thisMaxY] = AABB[1]
        minX = Math.min(minX, thisMinX)
        minY = Math.min(minY, thisMinY)
        maxX = Math.max(maxX, thisMaxX)
        maxY = Math.max(maxY, thisMaxY)
      }
    })
    return [
      [minX, minY],
      [maxX, maxY],
    ]
  }

  // 获取线段的AABB
  private getLineAABB(shape: IShape): IAABB | [] {
    try {
      const points = shape.points as number[][]
      const x1: number = points[0][0]
      const y1: number = points[0][1]
      const x2: number = points[1][0]
      const y2: number = points[1][1]
      const minX = Math.min(x1, x2)
      const minY = Math.min(y1, y2)
      const maxX = Math.max(x1, x2)
      const maxY = Math.max(y1, y2)
      return [
        [minX, minY],
        [maxX, maxY],
      ]
    } catch (error) {
      return []
    }
  }
  // 获文本的AABB
  private getMTextAABB(shape: IShape): IAABB | [] {
    try {
      const points = shape.points as IAABB
      return points
    } catch (error) {
      return []
    }
  }

  // 获取圆的AABB
  private getCircleAABB(shape: IShape): IAABB | [] {
    try {
      const points = shape.points as number[][]
      const x: number = points[0][0]
      const y: number = points[0][1]
      const radius: number = shape.r as number
      const minX = x - radius
      const minY = y - radius
      const maxX = x + radius
      const maxY = y + radius
      return [
        [minX, minY],
        [maxX, maxY],
      ]
    } catch (error) {
      return []
    }
  }
  // 获取圆弧的AABB
  private getArcAABB(shape: IShape): IAABB | [] {
    return ArcCalculator.fromShape(shape).getArcAABB()
  }

  // 获取多段线的AABB
  private getPlineAABB(data: IShape[]): IAABB | [] {
    try {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      data.forEach((shape: IShape) => {
        const points = shape.points as number[][]
        switch (shape.type) {
          case MetaEntityType.LINE:
            points.forEach(([x, y]: number[]) => {
              minX = Math.min(minX, x)
              minY = Math.min(minY, y)
              maxX = Math.max(maxX, x)
              maxY = Math.max(maxY, y)
            })
            break
          case MetaEntityType.ARC:
            // @wxy
            // Calculate AABB for arc (code implementation needed)
            // Handle calculation for arc control points and update min/max values accordingly
            // 计算圆弧的控制点，根据这些点更新min/max值
            // Implementation for ARC AABB calculation is needed here
            break
          // Add other cases for different entity types if necessary
          default:
            break
        }
      })
      return [
        [minX, minY],
        [maxX, maxY],
      ]
    } catch (error) {
      return []
    }
  }

  // 判断某个矩形整体完全处在包围盒中
  public isRectInsideBoundingBox(boundingBox: IAABB, rect: IAABB): boolean {
    // 重塑起始点
    const x1: number = boundingBox[0][0]
    const y1: number = boundingBox[0][1]
    const x2: number = boundingBox[1][0]
    const y2: number = boundingBox[1][1]
    const minX = Math.min(x1, x2)
    const minY = Math.min(y1, y2)
    const maxX = Math.max(x1, x2)
    const maxY = Math.max(y1, y2)
    boundingBox = [
      [minX, minY],
      [maxX, maxY],
    ]
    const [rectStart, rectEnd] = rect
    const [boxStart, boxEnd] = boundingBox
    return rectStart[0] >= boxStart[0] && rectStart[1] >= boxStart[1] && rectEnd[0] <= boxEnd[0] && rectEnd[1] <= boxEnd[1]
  }

  // 判断某个矩形的整体或局部是否处在包围盒中
  public isRectPartiallyInsideBoundingBox(boundingBox: IAABB, rect: IAABB): boolean {
    // 重塑起始点
    const x1: number = boundingBox[0][0]
    const y1: number = boundingBox[0][1]
    const x2: number = boundingBox[1][0]
    const y2: number = boundingBox[1][1]
    const minX = Math.min(x1, x2)
    const minY = Math.min(y1, y2)
    const maxX = Math.max(x1, x2)
    const maxY = Math.max(y1, y2)
    boundingBox = [
      [minX, minY],
      [maxX, maxY],
    ]
    const [rectStart, rectEnd] = rect
    const [boxStart, boxEnd] = boundingBox
    const isCompletelyOutside = rectEnd[0] < boxStart[0] || rectStart[0] > boxEnd[0] || rectEnd[1] < boxStart[1] || rectStart[1] > boxEnd[1]
    return !isCompletelyOutside
  }
}
