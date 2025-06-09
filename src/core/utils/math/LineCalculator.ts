import { Point } from '@/core/utils/math/ComputGeometry'
import { Vector2D } from './Vector'

// 注意区别线段和直线的差异

export class LineCalculator {
  private points: [Point, Point]

  constructor(startpPoint: Point, endPoint: Point) {
    this.points = [startpPoint, endPoint]
  }

  // 计算线段的中点
  public getMidPoint(): Point {
    const [start, end] = this.points
    const [sx, sy] = start
    const [ex, ey] = end
    // 计算中点坐标
    const midPoint: Point = [(sx + ex) / 2, (sy + ey) / 2]
    return midPoint
  }

  // 计算点在线段上垂直点（如果垂足不在线段上，则返回null）
  public getPerpendicularPoint(point: Point): Point | null {
    const [start, end] = this.points
    const [px, py] = point
    const [sx, sy] = start
    const [ex, ey] = end
    // 线段方向向量
    const dx = ex - sx
    const dy = ey - sy
    // 线段长度的平方
    const lengthSquared = dx * dx + dy * dy
    // 计算投影比例t
    const t = ((px - sx) * dx + (py - sy) * dy) / lengthSquared
    // 投影点的坐标
    const perpendicularPoint: Point = [sx + t * dx, sy + t * dy]
    // 检查垂足是否在线段上
    if (t < 0 || t > 1) {
      return null
    }
    return perpendicularPoint
  }

  // 计算点到直线之间的垂直距离
  public getPointToLineDistance(point: Point): number {
    const [start, end] = this.points
    const [px, py] = point
    const [sx, sy] = start
    const [ex, ey] = end
    // 直线的标准方程 Ax + By + C = 0
    const A = ey - sy
    const B = sx - ex
    const C = ex * sy - sx * ey
    // 点到直线的距离公式
    const distance = Math.abs(A * px + B * py + C) / Math.sqrt(A * A + B * B)
    return distance
  }

  // 计算线段上距离指定点的最近位置（该位置是线段上的某个点）
  public getPointToSegmentNearest(point: Point): Point {
    const [start, end] = this.points
    const [px, py] = point
    const [sx, sy] = start
    const [ex, ey] = end
    // 线段方向向量
    const dx = ex - sx
    const dy = ey - sy
    // 线段长度的平方
    const lengthSquared = dx * dx + dy * dy
    // 计算投影比例t
    let t = ((px - sx) * dx + (py - sy) * dy) / lengthSquared
    // 确保t在[0, 1]范围内
    t = Math.max(0, Math.min(1, t))
    // 计算最近点的坐标
    const nearestPoint: Point = [sx + t * dx, sy + t * dy]
    return nearestPoint
  }

  /**
   * 判断线段与线段是否相交（已验证）
   * 线段相交的公式是： 两线段(p1,p2)与(p3,p4)相交当且仅当方向向量(p2−p1)与(p3−p1)和(p4−p1)的叉积异号，且(p4−p3)与(p1−p3)和(p2−p3)的叉积异号
   * @param line
   * @returns
   */
  public isIntersectSegment(startPoint: Point, endPoint: Point): boolean {
    const v1 = Vector2D.fromArray(this.points[0])
    const v2 = Vector2D.fromArray(this.points[1])
    const v3 = Vector2D.fromArray(startPoint)
    const v4 = Vector2D.fromArray(endPoint)
    const direction1 = v3.subtract(v1).crossProduct(v2.subtract(v1))
    const direction2 = v4.subtract(v1).crossProduct(v2.subtract(v1))
    const direction3 = v1.subtract(v3).crossProduct(v4.subtract(v3))
    const direction4 = v2.subtract(v3).crossProduct(v4.subtract(v3))
    return direction1 * direction2 < 0 && direction3 * direction4 < 0
  }

  // 求线段与线段之间的交点（没有则返回null）（重合时也返回null）
  public getIntersectSegment(startPoint: Point, endPoint: Point): Point | null {
    const [start1, end1] = this.points
    const [start2, end2] = [startPoint, endPoint]
    const [x1, y1] = start1
    const [x2, y2] = end1
    const [x3, y3] = start2
    const [x4, y4] = end2
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    // 检查 denom 是否为 0 以确定线段是否平行或重合
    if (denom === 0) return null // 平行或重合
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
    // 检查 ua 和 ub 是否在 [0, 1] 范围内以确定是否在线段内相交
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null // 不相交
    const x = x1 + ua * (x2 - x1)
    const y = y1 + ua * (y2 - y1)
    return [x, y]
  }

  // 求线段与圆之间的交点（没有则返回null）
  public getIntersectCircle(centerPoint: Point, radius: number): Point[] | null {
    const [start, end] = this.points
    const [cx, cy] = centerPoint
    const [sx, sy] = start
    const [ex, ey] = end
    const dx = ex - sx
    const dy = ey - sy
    const a = dx * dx + dy * dy
    const b = 2 * (dx * (sx - cx) + dy(sy - cy))
    const c = cx * cx + cy * cy + sx * sx + sy * sy - 2 * (cx * sx + cy * sy) - radius * radius
    const discriminant = b * b - 4 * a * c
    if (discriminant < 0) return null // 无交点
    const sqrtDiscriminant = Math.sqrt(discriminant)
    const t1 = (-b + sqrtDiscriminant) / (2 * a)
    const t2 = (-b - sqrtDiscriminant) / (2 * a)
    const points: Point[] = []
    if (t1 >= 0 && t1 <= 1) {
      points.push([sx + t1 * dx, sy + t1 * dy])
    }
    if (t2 >= 0 && t2 <= 1) {
      points.push([sx + t2 * dx, sy + t2 * dy])
    }
    return points.length ? points : null
  }

  // 求线段与圆弧之间的交点（没有则返回null）
  public getIntersectArc(center: Point, r: number, startAngle: number, endAngle: number, anticlockwise: boolean = false): Point[] | null {
    const points = this.getIntersectCircle(center, r)
    if (!points) return null
    const [cx, cy] = center
    const angleRange = endAngle - startAngle
    const angles = points.map(([px, py]) => Math.atan2(py - cy, px - cx))
    const inArc = (angle: number) => {
      let adjAngle = angle
      if (angle < startAngle) adjAngle += 2 * Math.PI
      if (anticlockwise) {
        return adjAngle <= startAngle && adjAngle >= endAngle
      } else {
        return adjAngle >= startAngle && adjAngle <= endAngle
      }
    }
    const arcPoints = angles.map((angle, idx) => (inArc(angle) ? points[idx] : null)).filter((p) => p !== null)
    return arcPoints.length ? (arcPoints as Point[]) : null
  }
}
