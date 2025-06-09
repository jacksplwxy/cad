import { Point } from '@/core/utils/math/ComputGeometry'

export class CircleCalculator {
  private points: [Point] //圆心
  private r: number //半径

  /**
   * 计算圆构造器
   * @param centerPoint 圆心
   * @param radius 半径
   */
  constructor(centerPoint: Point, radius: number) {
    this.points = [centerPoint]
    this.r = radius
  }

  // 从3个点创建圆
  public static from3Points(points: Point[]): CircleCalculator {
    if (points.length !== 3) {
      throw new Error('Exactly three points are required')
    }
    const [p1, p2, p3] = points
    // 计算中间变量
    const A = p2[0] - p1[0]
    const B = p2[1] - p1[1]
    const C = p3[0] - p1[0]
    const D = p3[1] - p1[1]
    const E = A * (p1[0] + p2[0]) + B * (p1[1] + p2[1])
    const F = C * (p1[0] + p3[0]) + D * (p1[1] + p3[1])
    const G = 2 * (A * (p3[1] - p1[1]) - B * (p3[0] - p1[0]))
    // 如果 G 为 0，说明三个点共线，无法确定圆
    if (G === 0) {
      throw new Error('三个点共线，无法确定圆')
    }
    // 计算圆心
    const centerX = (D * E - B * F) / G
    const centerY = (A * F - C * E) / G
    const center: Point = [centerX, centerY]
    // 计算半径
    const radius = Math.sqrt((centerX - p1[0]) ** 2 + (centerY - p1[1]) ** 2)
    return new CircleCalculator(center, radius)
  }

  //获得圆的参数
  public getCircleParams() {
    return {
      points: this.points,
      r: this.r,
    }
  }

  /**
   * 计算圆的四个象限点（正上方、正下方、正左侧、正右侧）
   * @returns 四个象限点的数组
   */
  public getQuadrantPoints(): [Point, Point, Point, Point] {
    const [cx, cy] = this.points[0] // 圆心坐标
    const r = this.r // 半径
    // 计算四个象限的点
    const top: Point = [cx, cy + r] // 正上方点
    const bottom: Point = [cx, cy - r] // 正下方点
    const left: Point = [cx - r, cy] // 正左侧点
    const right: Point = [cx + r, cy] // 正右侧点
    return [top, left, bottom, right]
  }
}
