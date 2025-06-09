import { Point } from '@/core/utils/math/ComputGeometry'

export class PointCalculator {
  private points: [Point]

  constructor(point: Point) {
    this.points = [point]
  }

  // 计算点到点的最小距离
  public getToPointDistance(p: Point): number {
    const dx = p[0] - this.points[0][0]
    const dy = p[1] - this.points[0][1]
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance
  }

  // 计算点到线段（注意：是线段，而不是直线）的最近距离
  public getToSegmentDistance(startPoint: Point, endPoint: Point): number {
    const [px, py] = this.points[0]
    const [sx, sy] = startPoint
    const [ex, ey] = endPoint
    const dx = ex - sx
    const dy = ey - sy
    // 当起点和终点重合时，直接计算点到起点的距离
    if (dx === 0 && dy === 0) {
      return Math.sqrt((px - sx) ** 2 + (py - sy) ** 2)
    }
    // 计算投影参数 t
    const t = ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)
    // 当 t < 0 时，最近点是起点
    if (t < 0) {
      return Math.sqrt((px - sx) ** 2 + (py - sy) ** 2)
    }
    // 当 t > 1 时，最近点是终点
    else if (t > 1) {
      return Math.sqrt((px - ex) ** 2 + (py - ey) ** 2)
    }
    // 当 0 <= t <= 1 时，计算最近点在线段上的投影点
    const closestX = sx + t * dx
    const closestY = sy + t * dy
    // 返回点到投影点的距离
    return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2)
  }

  // 计算点到圆（注意：是圆的周长，即圆的外边）的最近距离
  public getToCircleDistance(centerPoint: Point, radius: number): number {
    const [px, py] = this.points[0]
    const [cx, cy] = centerPoint
    const distanceToCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    return Math.abs(distanceToCenter - radius)
  }

  // 计算点到圆弧（注意：是圆弧的弧边，即弧的外边）的最近距离
  public getToArcDistance(center: Point, r: number, startAngle: number, endAngle: number, anticlockwise = false): number {
    const [px, py] = this.points[0]
    const [cx, cy] = center
    const angle = Math.atan2(py - cy, px - cx)
    const angleInRange = anticlockwise ? angle <= startAngle && angle >= endAngle : angle >= startAngle && angle <= endAngle
    const distanceToCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    const distanceToArc = Math.abs(distanceToCenter - r)
    if (angleInRange) {
      return distanceToArc
    } else {
      const startX = cx + r * Math.cos(startAngle)
      const startY = cy + r * Math.sin(startAngle)
      const endX = cx + r * Math.cos(endAngle)
      const endY = cy + r * Math.sin(endAngle)
      const distToStart = Math.sqrt((px - startX) ** 2 + (py - startY) ** 2)
      const distToEnd = Math.sqrt((px - endX) ** 2 + (py - endY) ** 2)
      return Math.min(distToStart, distToEnd)
    }
  }

  // 求点在线段上的最近点：计算线段（注意：是线段，而不是直线）上的那个距离该点最近的点坐标
  public getSegmentClosest(startPoint: Point, endPoint: Point): Point {
    const [px, py] = this.points[0]
    const [sx, sy] = startPoint
    const [ex, ey] = endPoint
    const dx = ex - sx
    const dy = ey - sy
    if (dx === 0 && dy === 0) {
      // 起点和终点重合，返回起点或终点
      return [sx, sy]
    }
    // 计算 t 值
    const t = ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)
    if (t <= 0) {
      // 最近点是起点
      return [sx, sy]
    } else if (t >= 1) {
      // 最近点是终点
      return [ex, ey]
    } else {
      // 最近点在线段内部
      const closestX = sx + t * dx
      const closestY = sy + t * dy
      return [closestX, closestY]
    }
  }

  // 求点在圆上的最近点
  public getCircleClosest(centerPoint: Point, radius: number): Point {
    const [px, py] = this.points[0]
    const [cx, cy] = centerPoint

    // 计算点到圆心的距离
    const dx = px - cx
    const dy = py - cy
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy)

    // 如果点在圆心上，直接返回圆上任意一点（这里取与x轴正方向的交点）
    if (distanceToCenter === 0) {
      return [cx + radius, cy]
    }

    // 计算单位向量并乘以半径得到圆上的最近点
    const ratio = radius / distanceToCenter
    const closestX = cx + dx * ratio
    const closestY = cy + dy * ratio

    return [closestX, closestY]
  }

  // 求点在圆弧上的最近点
  public getArcClosest(center: Point, r: number, startAngle: number, endAngle: number, anticlockwise = false): Point {
    const [px, py] = this.points[0]
    const [cx, cy] = center

    // 计算点相对于圆心的角度
    let angle = Math.atan2(py - cy, px - cx)

    // 规范化角度到 [0, 2π)
    if (angle < 0) angle += 2 * Math.PI
    const start = startAngle < 0 ? startAngle + 2 * Math.PI : startAngle
    const end = endAngle < 0 ? endAngle + 2 * Math.PI : endAngle

    // 处理角度范围
    let minAngle = Math.min(start, end)
    let maxAngle = Math.max(start, end)

    // 调整角度范围考虑方向
    if (anticlockwise) {
      ;[minAngle, maxAngle] = [maxAngle, minAngle]
    }

    // 计算投影点
    const distanceToCenter = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    const ratio = r / (distanceToCenter === 0 ? 1 : distanceToCenter) // 防止除以0
    let closestAngle = angle

    // 判断角度是否在范围内，并调整到最近的边界
    if (!anticlockwise) {
      if (angle < minAngle) closestAngle = minAngle
      else if (angle > maxAngle) closestAngle = maxAngle
    } else {
      // 逆时针情况
      if (angle > minAngle && angle < maxAngle) {
        // 计算角度距离，选择最近的边界
        const distToMin = Math.min(Math.abs(angle - minAngle), 2 * Math.PI - Math.abs(angle - minAngle))
        const distToMax = Math.min(Math.abs(angle - maxAngle), 2 * Math.PI - Math.abs(angle - maxAngle))
        closestAngle = distToMin < distToMax ? minAngle : maxAngle
      }
    }

    // 计算圆弧上的最近点坐标
    const closestX = cx + r * Math.cos(closestAngle)
    const closestY = cy + r * Math.sin(closestAngle)

    return [closestX, closestY]
  }

  // 求点在线段上的最近点及其距离：计算线段（注意：是线段，而不是直线）上的那个距离该点最近的点坐标及2个点之间的距离
  public getSegmentClosestPointAndDistance(startPoint: Point, endPoint: Point): { point: Point; distance: number } {
    const closestPoint = this.getSegmentClosest(startPoint, endPoint)
    const distance = this.getToPointDistance(closestPoint)
    return { point: closestPoint, distance: distance }
  }

  // 求点在线段上的垂足：计算点在线段（注意：是线段，而不是直线）上的垂足坐标(存在在返回坐标，不存在则返回null（例如点在线段所处的直线或者垂足不在线段上）)
  public getSegmentPerpendicular(startPoint: Point, endPoint: Point): Point | null {
    const [px, py] = this.points[0]
    const [sx, sy] = startPoint
    const [ex, ey] = endPoint
    const dx = ex - sx
    const dy = ey - sy
    if (dx === 0 && dy === 0) {
      return null // 起点和终点重合，不存在垂足
    }
    const t = ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)
    if (t < 0 || t > 1) {
      return null // 垂足不在线段上
    }
    const closestX = sx + t * dx
    const closestY = sy + t * dy
    return [closestX, closestY]
  }

  // 求点在圆上的切点：计算点在圆（注意：是圆的周长，即圆的外边）上的切点坐标(存在在返回坐标，不存在则返回null（例如在圆周长上或圆内部时不存在切点）)
  public getCircleTangency(centerPoint: Point, radius: number): [Point, Point] | null {
    const [px, py] = this.points[0]
    const [cx, cy] = centerPoint
    const dx = px - cx
    const dy = py - cy
    const distToCenter = Math.sqrt(dx * dx + dy * dy)
    if (distToCenter <= radius) {
      return null // 在圆周上或圆内部不存在切点
    }
    const ratio = radius / distToCenter
    const offsetX = ratio * dy
    const offsetY = ratio * dx
    const tangency1: Point = [cx + ratio * dx - offsetX, cy + ratio * dy + offsetY]
    const tangency2: Point = [cx + ratio * dx + offsetX, cy + ratio * dy - offsetY]
    return [tangency1, tangency2] // 返回两个切点
  }

  // 求点在圆弧上的切点：计算点在圆弧（注意：是圆弧的周长，即圆弧的外边）上的切点坐标(存在在返回坐标，不存在则返回null（例如在圆周长上或圆内部时不存在切点）)
  public getArcTangency(center: Point, r: number, startAngle: number, endAngle: number, anticlockwise = false): [Point, Point?] | null {
    const [px, py] = this.points[0]
    const [cx, cy] = center
    const dx = px - cx
    const dy = py - cy
    const distToCenter = Math.sqrt(dx * dx + dy * dy)
    if (distToCenter <= r) {
      return null // 在圆弧上或圆内部不存在切点
    }
    const angle1 = Math.atan2(dy, dx)
    const angleDiff = Math.acos(r / distToCenter)
    const tangency1Angle = angle1 + angleDiff
    const tangency2Angle = angle1 - angleDiff
    const tangency1: Point = [cx + r * Math.cos(tangency1Angle), cy + r * Math.sin(tangency1Angle)]
    const tangency2: Point = [cx + r * Math.cos(tangency2Angle), cy + r * Math.sin(tangency2Angle)]
    const inArc1 = anticlockwise ? tangency1Angle <= startAngle && tangency1Angle >= endAngle : tangency1Angle >= startAngle && tangency1Angle <= endAngle
    const inArc2 = anticlockwise ? tangency2Angle <= startAngle && tangency2Angle >= endAngle : tangency2Angle >= startAngle && tangency2Angle <= endAngle
    if (inArc1 && inArc2) {
      return [tangency1, tangency2]
    } else if (inArc1) {
      return [tangency1]
    } else if (inArc2) {
      return [tangency2]
    } else {
      return null // 没有有效的切点在圆弧范围内
    }
  }

  /**
   * 判断一个点是否在矩形内部
   * @param leftTop 矩形的起点
   * @param rightBottom 矩形的终点
   * @returns boolean
   */
  public isInside(leftTop: Point, rightBottom: Point): boolean {
    const [px, py] = this.points[0]
    const isInside = px >= leftTop[0] && px <= rightBottom[0] && py >= leftTop[1] && py <= rightBottom[1]
    return isInside
  }
}
