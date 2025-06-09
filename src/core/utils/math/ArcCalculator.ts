import { IShape } from '@/core/data/DataManager'
import { IAABB } from '@/core/helper/BoundingBox'
import { Point } from '@/core/utils/math/ComputGeometry'

export interface CanvasArcParams {
  points: [Point]
  r: number
  startAngle: number //圆弧开始的角度，单位是弧度
  endAngle: number //圆弧结束的角度，单位是弧度
  anticlockwise?: boolean
}

export class ArcCalculator {
  private points: [Point]
  private r: number
  private startAngle: number
  private endAngle: number
  private anticlockwise: boolean //是否逆时针绘制

  constructor(center: Point, r: number, startAngle: number, endAngle: number, anticlockwise = false) {
    this.points = [center]
    this.r = r
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.anticlockwise = anticlockwise
  }

  // 从Shape创建圆弧
  public static fromShape(shape: IShape): ArcCalculator {
    if (!Array.isArray(shape.points) || shape.points.length !== 1 || shape.r === undefined || shape.startAngle === undefined || shape.endAngle === undefined) {
      throw new Error('Invalid shape data')
    }
    return new ArcCalculator(shape.points[0] as Point, shape.r, shape.startAngle, shape.endAngle, shape.anticlockwise)
  }

  // 从3个点创建圆弧
  public static from3Points(points: Point[]): ArcCalculator {
    if (points.length !== 3) {
      throw new Error('Exactly three points are required')
    }
    const [p0, p1, p2] = points
    const { xCenter, yCenter, r } = this.calculateCircle(p0, p1, p2)
    const startAngle = this.angle(xCenter, yCenter, p0[0], p0[1])
    const endAngle = this.angle(xCenter, yCenter, p2[0], p2[1])
    return new ArcCalculator([xCenter, yCenter], r, startAngle, endAngle, isAnticlockwise(p0, p1, p2))

    // 判断是否逆时针
    function isAnticlockwise(p0: Point, p1: Point, p2: Point): boolean {
      const [x0, y0] = p0
      const [x1, y1] = p1
      const [x2, y2] = p2
      // 向量 p0->p1
      const v1x = x1 - x0
      const v1y = y1 - y0
      // 向量 p0->p2
      const v2x = x2 - x0
      const v2y = y2 - y0
      // 计算向量叉积
      const crossProduct = v1x * v2y - v1y * v2x
      // 如果叉积大于0，则p2在p0->p1的左侧（顺时针）
      return crossProduct < 0
    }
  }

  // 根据圆心+起点+终点创建圆弧
  // public getCanvasArcParamsByCenterPoint(centerPoint: Point, startPoint: Point, endPoint: Point): CanvasArcParams {
  public static fromCenterStartEndPoint(centerPoint: Point, startPoint: Point, endPoint: Point): ArcCalculator {
    // 计算圆心到起点和终点的距离
    const r = Math.sqrt((startPoint[0] - centerPoint[0]) ** 2 + (startPoint[1] - centerPoint[1]) ** 2)
    // 计算起始角和终止角
    const startAngle = Math.atan2(startPoint[1] - centerPoint[1], startPoint[0] - centerPoint[0])
    const endAngle = Math.atan2(endPoint[1] - centerPoint[1], endPoint[0] - centerPoint[0])
    // anticlockwise: true, // 固定逆时针
    return new ArcCalculator(centerPoint, r, startAngle, endAngle, true)
  }

  // 根据前一个线段的终点+与前一个线段相切+当前圆弧终点创建当前圆弧
  public static fromTangencyLine(prevLineStartPoint: Point, prevLineEndPoint: Point, arcEndPoint: Point): ArcCalculator {
    const [x1, y1] = prevLineStartPoint
    const [x2, y2] = prevLineEndPoint
    const [x3, y3] = arcEndPoint

    // 计算线段方向向量并归一化
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const dirX = dx / length
    const dirY = dy / length

    // 计算垂直方向向量
    const perpX = -dirY
    const perpY = dirX

    // 中点
    const midX = (x2 + x3) / 2
    const midY = (y2 + y3) / 2

    // 圆心到中点方向的向量
    const centerDirX = midX - x2
    const centerDirY = midY - y2

    // 投影到垂直方向，计算t
    const t = (centerDirX * perpX + centerDirY * perpY) / (perpX ** 2 + perpY ** 2)

    // 圆心坐标
    const centerX = midX - t * perpX
    const centerY = midY - t * perpY

    // 半径
    const radius = Math.sqrt((centerX - x2) ** 2 + (centerY - y2) ** 2)

    // 起点和终点角度
    const startAngle = Math.atan2(y2 - centerY, x2 - centerX)
    const endAngle = Math.atan2(y3 - centerY, x3 - centerX)

    // 判断绘制方向（叉积）
    const anticlockwise = dirX * (y3 - y2) - dirY * (x3 - x2) < 0

    return new ArcCalculator([centerX, centerY], radius, startAngle, endAngle, anticlockwise)
  }

  // 根据前一个圆弧的终点+与前一个圆弧相切+当前圆弧终点创建当前圆弧
  public static fromTangencyArc(prevArc: CanvasArcParams, arcEndPoint: Point): ArcCalculator {
    const [centerX, centerY] = prevArc.points[0]
    const radius1 = prevArc.r
    const prevEndAngle = prevArc.endAngle
    const anticlockwise1 = prevArc.anticlockwise

    const [x3, y3] = arcEndPoint

    // 计算前一圆弧终点
    const prevEndX = centerX + radius1 * Math.cos(prevEndAngle)
    const prevEndY = centerY + radius1 * Math.sin(prevEndAngle)

    // 计算切线方向并归一化
    const tangentDX = anticlockwise1 ? -(prevEndY - centerY) : prevEndY - centerY
    const tangentDY = anticlockwise1 ? prevEndX - centerX : -(prevEndX - centerX)
    const tangentLength = Math.sqrt(tangentDX ** 2 + tangentDY ** 2)
    const tangentDirX = tangentDX / tangentLength
    const tangentDirY = tangentDY / tangentLength

    // 中点
    const midX = (prevEndX + x3) / 2
    const midY = (prevEndY + y3) / 2

    // 圆心方向
    const centerDirX = midX - prevEndX
    const centerDirY = midY - prevEndY

    // 投影计算t
    const t = (centerDirX * tangentDirX + centerDirY * tangentDirY) / (tangentDirX ** 2 + tangentDirY ** 2)

    // 新圆心
    const newCenterX = midX - t * tangentDirX
    const newCenterY = midY - t * tangentDirY

    // 新圆弧半径
    const radius2 = Math.sqrt((newCenterX - prevEndX) ** 2 + (newCenterY - prevEndY) ** 2)

    // 起点和终点角度
    const startAngle = Math.atan2(prevEndY - newCenterY, prevEndX - newCenterX)
    const endAngle = Math.atan2(y3 - newCenterY, x3 - newCenterX)

    // 判断绘制方向
    const anticlockwise2 = tangentDirX * (y3 - prevEndY) - tangentDirY * (x3 - prevEndX) > 0

    return new ArcCalculator([newCenterX, newCenterY], radius2, startAngle, endAngle, anticlockwise2)
  }

  // 根据3个点计算圆心和半径
  private static calculateCircle(p0: Point, p1: Point, p2: Point): { xCenter: number; yCenter: number; r: number } {
    const [x0, y0] = p0
    const [x1, y1] = p1
    const [x2, y2] = p2
    const D = 2 * (x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1))
    const xCenter = ((x0 ** 2 + y0 ** 2) * (y1 - y2) + (x1 ** 2 + y1 ** 2) * (y2 - y0) + (x2 ** 2 + y2 ** 2) * (y0 - y1)) / D
    const yCenter = ((x0 ** 2 + y0 ** 2) * (x2 - x1) + (x1 ** 2 + y1 ** 2) * (x0 - x2) + (x2 ** 2 + y2 ** 2) * (x1 - x0)) / D
    const r = Math.sqrt((x0 - xCenter) ** 2 + (y0 - yCenter) ** 2)
    return { xCenter, yCenter, r }
  }

  // 计算从圆心到给定点的角度
  private static angle(xCenter: number, yCenter: number, x: number, y: number): number {
    return Math.atan2(y - yCenter, x - xCenter)
  }

  //获得canvas绘制arc的参数
  public getCanvasArcParams(): CanvasArcParams {
    return {
      points: this.points,
      r: this.r,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      anticlockwise: this.anticlockwise as boolean,
    }
  }

  // 获取圆弧的AABB
  public getArcAABB(): IAABB | [] {
    if (this.points && this.points[0] && this.r && this.startAngle && this.endAngle) {
      const cx = this.points[0][0]
      const cy = this.points[0][1]
      // Helper function to normalize angles between 0 and 2*PI
      // eslint-disable-next-line no-inner-declarations
      function normalizeAngle(angle: number): number {
        while (angle < 0) angle += 2 * Math.PI
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI
        return angle
      }
      const start = normalizeAngle(this.startAngle)
      const end = normalizeAngle(this.endAngle)
      const minX = (angle: number) => cx + this.r * Math.cos(angle)
      const minY = (angle: number) => cy + this.r * Math.sin(angle)
      // Starting and ending points
      let xMin = Math.min(minX(start), minX(end))
      let xMax = Math.max(minX(start), minX(end))
      let yMin = Math.min(minY(start), minY(end))
      let yMax = Math.max(minY(start), minY(end))
      // Check key angles
      const keyAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
      for (const angle of keyAngles) {
        const normalizedAngle = normalizeAngle(angle)
        if (
          (this.anticlockwise && ((start >= normalizedAngle && normalizedAngle >= end) || (start < end && (start >= normalizedAngle || normalizedAngle >= end)))) ||
          (!this.anticlockwise && ((start <= normalizedAngle && normalizedAngle <= end) || (start > end && (start <= normalizedAngle || normalizedAngle <= end))))
        ) {
          xMin = Math.min(xMin, minX(normalizedAngle))
          xMax = Math.max(xMax, minX(normalizedAngle))
          yMin = Math.min(yMin, minY(normalizedAngle))
          yMax = Math.max(yMax, minY(normalizedAngle))
        }
      }
      return [
        [xMin, yMin],
        [xMax, yMax],
      ]
    } else {
      return []
    }
  }

  // 获取圆弧弧长的中点
  public getArcLengthCenterPoint(): Point {
    if (!this.points || this.points.length !== 1 || this.r === undefined || this.startAngle === undefined || this.endAngle === undefined) {
      throw new Error('Invalid shape data')
    }
    const [xCenter, yCenter] = this.points[0]
    const totalAngle = this.anticlockwise ? (this.startAngle - this.endAngle + 2 * Math.PI) % (2 * Math.PI) : (this.endAngle - this.startAngle + 2 * Math.PI) % (2 * Math.PI)
    const middleAngle = this.anticlockwise ? (this.startAngle - totalAngle / 2 + 2 * Math.PI) % (2 * Math.PI) : (this.startAngle + totalAngle / 2) % (2 * Math.PI)
    const centerX = xCenter + this.r * Math.cos(middleAngle)
    const centerY = yCenter + this.r * Math.sin(middleAngle)
    return [centerX, centerY]
  }

  // 获取圆弧弧长的起点
  public getArcLengthStartPoint(): Point {
    if (!this.points || this.points.length !== 1 || this.r === undefined || this.startAngle === undefined) {
      throw new Error('Invalid shape data')
    }
    const [xCenter, yCenter] = this.points[0]
    const radius = this.r
    // 根据起始角度计算起点坐标
    const startX = xCenter + radius * Math.cos(this.startAngle)
    const startY = yCenter + radius * Math.sin(this.startAngle)
    return [startX, startY]
  }

  // 获取圆弧弧长的终点
  public getArcLengthEndPoint(): Point {
    if (!this.points || this.points.length !== 1 || this.r === undefined || this.endAngle === undefined) {
      throw new Error('Invalid shape data')
    }
    const [xCenter, yCenter] = this.points[0]
    const radius = this.r
    // 根据终止角度计算终点坐标
    const endX = xCenter + radius * Math.cos(this.endAngle)
    const endY = yCenter + radius * Math.sin(this.endAngle)
    return [endX, endY]
  }

  // 计算圆弧的中点，该圆弧与线段相切
  public static getArcCenterPointByLine(prevLineStart: Point, prevLineEnd: Point, arcEnd: Point): Point {
    const [x1, y1] = prevLineStart
    const [x2, y2] = prevLineEnd
    const [x3, y3] = arcEnd

    // 计算线段的方向向量
    const dx = x2 - x1
    const dy = y2 - y1

    // 垂直向量，顺时针旋转90度
    const perpendicularDx = -dy
    const perpendicularDy = dx

    // 计算中点
    const midX = (x2 + x3) / 2
    const midY = (y2 + y3) / 2

    // 计算垂直方向的中点向量
    const factor = Math.sqrt((x3 - x2) ** 2 + (y3 - y2) ** 2) / 2 // 可调整权重
    const centerX = midX + (perpendicularDx * factor) / Math.sqrt(perpendicularDx ** 2 + perpendicularDy ** 2)
    const centerY = midY + (perpendicularDy * factor) / Math.sqrt(perpendicularDx ** 2 + perpendicularDy ** 2)

    return [centerX, centerY]
  }

  // 计算圆弧的中点，该圆弧与另一圆弧相切
  public static getArcCenterPointByArc(prevArcPoints: Point[], arcStart: Point, arcEnd: Point): Point {
    if (prevArcPoints.length !== 3) {
      throw new Error('The previous arc must have exactly three points.')
    }

    const [prevStart, prevMid, prevEnd] = prevArcPoints
    const { xCenter, yCenter } = this.calculateCircle(prevStart, prevMid, prevEnd)

    // 计算上一圆弧的终点与圆心的方向向量
    const dx = prevEnd[0] - xCenter
    const dy = prevEnd[1] - yCenter

    // 归一化方向向量
    const length = Math.sqrt(dx ** 2 + dy ** 2)
    const unitDx = dx / length
    const unitDy = dy / length

    // 新圆弧的中点应位于起点和终点的中点附近
    const midX = (arcStart[0] + arcEnd[0]) / 2
    const midY = (arcStart[1] + arcEnd[1]) / 2

    // 沿切向方向调整中点
    const factor = Math.sqrt((arcEnd[0] - arcStart[0]) ** 2 + (arcEnd[1] - arcStart[1]) ** 2) / 2 // 可调整权重
    const centerX = midX + unitDx * factor
    const centerY = midY + unitDy * factor

    return [centerX, centerY]
  }
}
