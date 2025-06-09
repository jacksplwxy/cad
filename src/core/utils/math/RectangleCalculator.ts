import { Point } from '@/core/utils/math/ComputGeometry'
import { LineCalculator } from './LineCalculator'

export class RectangleCalculator {
  private points: [Point, Point]

  constructor(leftTopPoint: Point, rightBottomPoint: Point) {
    this.points = [leftTopPoint, rightBottomPoint]
  }

  // 判断一个点是否在矩形内部
  public isPointInside(point: Point): boolean {
    const [leftTop, rightBottom] = this.points
    const [px, py] = point
    const isInside = px >= leftTop[0] && px <= rightBottom[0] && py >= leftTop[1] && py <= rightBottom[1]
    return isInside
  }

  // 判断矩形与线段是否相交（已验证）
  public isIntersectSegment(startpPoint: Point, endPoint: Point): boolean {
    const [topLeft, bottomRight] = this.points
    // 矩形的四个边
    const edges: Array<[Point, Point]> = [
      [topLeft, [bottomRight[0], topLeft[1]]],
      [topLeft, [topLeft[0], bottomRight[1]]],
      [bottomRight, [topLeft[0], bottomRight[1]]],
      [bottomRight, [bottomRight[0], topLeft[1]]],
    ]
    let lineCalculator = new LineCalculator(startpPoint, endPoint)
    for (const edge of edges) {
      if (lineCalculator.isIntersectSegment(edge[0], edge[1])) {
        return true
      }
    }
    return false
  }

  // 判断矩形与矩形的四条边是否相交（不包括在矩形内部的情况）
  public isIntersectRectangleEdge(leftTopPoint: Point, rightBottomPoint: Point): boolean {
    const topLeftB = leftTopPoint
    const bottomRightB = rightBottomPoint
    const edges: Array<[Point, Point]> = [
      [topLeftB, [bottomRightB[0], topLeftB[1]]], // 上边
      [topLeftB, [topLeftB[0], bottomRightB[1]]], // 左边
      [bottomRightB, [topLeftB[0], bottomRightB[1]]], // 下边
      [bottomRightB, [bottomRightB[0], topLeftB[1]]], // 右边
    ]
    for (const edgeB of edges) {
      if (this.isIntersectSegment(edgeB[0], edgeB[1])) {
        return true
      }
    }
    return false
  }

  // 判断矩形与矩形是否相交（包括在矩形内部的情况）
  public isIntersectRectangle(leftTopPoint: Point, rightBottomPoint: Point): boolean {
    const [topLeftA, bottomRightA] = this.points
    const [topLeftB, bottomRightB] = [leftTopPoint, rightBottomPoint]

    // 两个矩形不相交的情况
    const isNotIntersecting =
      topLeftA[0] > bottomRightB[0] || // 矩形A在矩形B的右边
      bottomRightA[0] < topLeftB[0] || // 矩形A在矩形B的左边
      topLeftA[1] > bottomRightB[1] || // 矩形A在矩形B的下边
      bottomRightA[1] < topLeftB[1] // 矩形A在矩形B的上边

    // 如果不满足不相交的情况，则两个矩形相交
    return !isNotIntersecting
  }

  // 判断矩形与圆周长是否相交（已验证）
  public isIntersectCircle(center: Point, radius: number): boolean {
    const [centerX, centerY] = center
    const [[x1, y1], [x2, y2]] = this.points
    // Helper function to check if a point is exactly on the circle edge
    const isPointOnCircleEdge = (px: number, py: number, cx: number, cy: number, r: number): boolean => {
      const distanceSquared = (px - cx) ** 2 + (py - cy) ** 2
      return Math.abs(distanceSquared - r * r) < 1e-6 // Allowing for some floating point precision error
    }
    // Helper function to check if a point is inside the rectangle
    const isPointInsideRectangle = (px: number, py: number, rx1: number, ry1: number, rx2: number, ry2: number): boolean => {
      return px >= rx1 && px <= rx2 && py >= ry1 && py <= ry2
    }
    // Helper function to check if a line segment intersects the circle
    const doesLineSegmentIntersectCircle = (cx: number, cy: number, r: number, x1: number, y1: number, x2: number, y2: number): boolean => {
      const dx = x2 - x1
      const dy = y2 - y1
      const fx = x1 - cx
      const fy = y1 - cy
      const a = dx * dx + dy * dy
      const b = 2 * (fx * dx + fy * dy)
      const c = fx * fx + fy * fy - r * r
      let discriminant = b * b - 4 * a * c
      if (discriminant < 0) {
        return false
      }
      discriminant = Math.sqrt(discriminant)
      const t1 = (-b - discriminant) / (2 * a)
      const t2 = (-b + discriminant) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        return true
      }
      if (t2 >= 0 && t2 <= 1) {
        return true
      }
      return false
    }
    // Quick exclusion: if the distance from the center to the rectangle's closest edge is greater than the radius
    const closestX = Math.max(x1, Math.min(centerX, x2))
    const closestY = Math.max(y1, Math.min(centerY, y2))
    const distanceX = centerX - closestX
    const distanceY = centerY - closestY
    if (distanceX * distanceX + distanceY * distanceY > radius * radius) {
      return false
    }
    // Check if any of the rectangle's edges intersect the circle
    const vertices: Point[] = [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ]
    const edges = [
      [vertices[0], vertices[1]],
      [vertices[1], vertices[2]],
      [vertices[2], vertices[3]],
      [vertices[3], vertices[0]],
    ]
    for (const [[x1, y1], [x2, y2]] of edges) {
      if (doesLineSegmentIntersectCircle(centerX, centerY, radius, x1, y1, x2, y2)) {
        return true
      }
    }
    // Check if any point of the rectangle is on the circle edge
    for (const [vx, vy] of vertices) {
      if (isPointOnCircleEdge(vx, vy, centerX, centerY, radius)) {
        return true
      }
    }
    // Check if any part of the circle's edge is within the rectangle
    const boundaryPoints: Point[] = [
      [centerX + radius, centerY], // Right
      [centerX - radius, centerY], // Left
      [centerX, centerY + radius], // Bottom
      [centerX, centerY - radius], // Top
    ]
    for (const [px, py] of boundaryPoints) {
      if (isPointInsideRectangle(px, py, x1, y1, x2, y2)) {
        return true
      }
    }
    return false
  }

  // 判断矩形与圆周长或者圆心是否相交（已验证）
  public isIntersectCircleAndCenter(center: Point, radius: number): boolean {
    return this.isIntersectCircle(center, radius) || this.isPointInside(center)
  }

  /**
   * 判断矩形（的边）与圆弧（的边）是否相交（不包括包含关系，只考虑相交关系）（待验证）
   * @param center 圆弧中点
   * @param radius 圆弧半径
   * @param startAngle 圆弧开始的角度，单位是弧度
   * @param endAngle 圆弧结束的角度，单位是弧度
   * @param anticlockwise 是否逆时针
   */
  public isIntersectArc(center: Point, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean | undefined): boolean {
    const [centerX, centerY] = center
    const [[x1, y1], [x2, y2]] = this.points
    // Normalize angles
    function normalizeAngle(angle: number): number {
      while (angle < 0) angle += 2 * Math.PI
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
      return angle
    }
    startAngle = normalizeAngle(startAngle)
    endAngle = normalizeAngle(endAngle)
    if (anticlockwise) {
      const temp = startAngle
      startAngle = endAngle
      endAngle = temp
    }
    // Helper function to check if angle is within the arc range
    function isAngleInArcRange(angle: number, startAngle: number, endAngle: number): boolean {
      if (startAngle < endAngle) {
        return angle >= startAngle && angle <= endAngle
      } else {
        return angle >= startAngle || angle <= endAngle
      }
    }
    // Check if any rectangle edge intersects with the arc
    const vertices: Point[] = [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ]
    const edges: [Point, Point][] = [
      [vertices[0], vertices[1]],
      [vertices[1], vertices[2]],
      [vertices[2], vertices[3]],
      [vertices[3], vertices[0]],
    ]
    // Helper function to check if a line segment intersects the arc
    const doesLineSegmentIntersectArc = (x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number, startAngle: number, endAngle: number): boolean => {
      const dx = x2 - x1
      const dy = y2 - y1
      const fx = x1 - cx
      const fy = y1 - cy
      const a = dx * dx + dy * dy
      const b = 2 * (fx * dx + fy * dy)
      const c = fx * fx + fy * fy - r * r
      let discriminant = b * b - 4 * a * c
      if (discriminant < 0) {
        return false
      }
      discriminant = Math.sqrt(discriminant)
      const t1 = (-b - discriminant) / (2 * a)
      const t2 = (-b + discriminant) / (2 * a)
      if (t1 >= 0 && t1 <= 1) {
        const intersectX = x1 + t1 * dx
        const intersectY = y1 + t1 * dy
        const angle = normalizeAngle(Math.atan2(intersectY - cy, intersectX - cx))
        if (isAngleInArcRange(angle, startAngle, endAngle)) {
          return true
        }
      }
      if (t2 >= 0 && t2 <= 1) {
        const intersectX = x1 + t2 * dx
        const intersectY = y1 + t2 * dy
        const angle = normalizeAngle(Math.atan2(intersectY - cy, intersectX - cx))
        if (isAngleInArcRange(angle, startAngle, endAngle)) {
          return true
        }
      }
      return false
    }
    for (const [[x1, y1], [x2, y2]] of edges) {
      if (doesLineSegmentIntersectArc(x1, y1, x2, y2, centerX, centerY, radius, startAngle, endAngle)) {
        return true
      }
    }
    return false
  }
}
