interface Point {
  x: number
  y: number
}

export enum AngleUnit {
  Degrees,
  Radians,
}

// 计算直线的斜率(求反正切值： 使用 Math.atan() 函数计算斜率的反正切值，得到弧度值。)
// 斜率要考虑分子为0的情况，尽量用向量替代斜率
export function getLineSlope(p1: Point, p2: Point): number {
  return (p2.y - p1.y) / (p2.x - p1.x)
}

// 根据原点获取旋转后的点坐标
export function rotatePointByOrigin(point: Point, origin: Point, angleInRadians: AngleUnit.Radians): Point {
  const { x: ox, y: oy } = origin
  const { x, y } = point
  // 也可以用旋转矩阵实现
  const newX = ox + (x - ox) * Math.cos(angleInRadians) - (y - oy) * Math.sin(angleInRadians)
  const newY = oy + (x - ox) * Math.sin(angleInRadians) + (y - oy) * Math.cos(angleInRadians)
  return { x: newX, y: newY }
}

// 计算两个线段的夹角0-180度（弧度0-π之间）
export function get2linesAngle(p1: Point, p2: Point, p3: Point, p4: Point, type: AngleUnit = AngleUnit.Radians): AngleUnit {
  const vector1 = { x: p2.x - p1.x, y: p2.y - p1.y }
  const vector2 = { x: p4.x - p3.x, y: p4.y - p3.y }
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y)
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y)
  const cosTheta = dotProduct / (magnitude1 * magnitude2)
  const theta = Math.acos(cosTheta)
  if (type === AngleUnit.Radians) {
    return theta
  } else {
    const angle = (theta * 180) / Math.PI // 转换为度数
    return angle
  }
}

// 弧度转换为度数
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI)
}

// 度数转换为弧度
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// 角度限制在[0,90]范围内
export function normalizeAngle0To90(angle: number): number {
  // 将角度标准化到 [0, 360) 范围内
  angle = angle % 360
  if (angle < 0) {
    angle += 360
  }
  // 将角度转换到 [0, 90] 范围内
  if (angle >= 270) {
    angle = 360 - angle
  } else if (angle >= 180) {
    angle = angle - 180
  } else if (angle >= 90) {
    angle = 180 - angle
  }
  return angle
}

// 弧度限制在[0, π/2]范围内
export function normalizeRadian0To90(radian: number): number {
  // 将弧度标准化到 [0, 2π) 范围内
  radian = radian % (2 * Math.PI)
  if (radian < 0) {
    radian += 2 * Math.PI
  }
  // 将弧度转换到 [0, π/2] 范围内
  if (radian >= (3 * Math.PI) / 2) {
    radian = 2 * Math.PI - radian
  } else if (radian >= Math.PI) {
    radian = radian - Math.PI
  } else if (radian >= Math.PI / 2) {
    radian = Math.PI - radian
  }
  return radian
}

// 2点之间的距离
export function calculateDistance(point1: Point, point2: Point): number {
  const xDiff = point2.x - point1.x
  const yDiff = point2.y - point1.y
  const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff)
  return distance
}

// 根据圆心、圆弧起点、圆弧终点、是否按照逆时针方向获取canvas绘制圆弧参数
export function getArcParamsBy3Points(center: Point, startP: Point, endP: Point, anticlockwise: boolean = false): [number, number, number, number, number, boolean] {
  const radius = Math.sqrt(Math.pow(center.x - startP.x, 2) + Math.pow(center.y - startP.y, 2))
  const startAngle = Math.atan2(startP.y - center.y, startP.x - center.x)
  const endAngle = Math.atan2(endP.y - center.y, endP.x - center.x)
  return [center.x, center.y, radius, startAngle, endAngle, anticlockwise]
}
