// http://victorjs.org/
// 向量概念与运算：https://zhuanlan.zhihu.com/p/635048469
// 点乘：https://zhuanlan.zhihu.com/p/66674587

import { Point } from './ComputGeometry'

// Vector2D.ts

export class Vector2D {
  private readonly coordinates: Float32Array

  constructor(x: number, y: number) {
    this.coordinates = new Float32Array([x, y])
  }

  // 从两个点创建向量
  public static fromPoints(startPoint: Point, endPoint: Point): Vector2D {
    const [x0, y0] = startPoint
    const [x1, y1] = endPoint
    const x = x1 - x0
    const y = y1 - y0
    return new Vector2D(x, y)
  }

  // 从数组创建向量
  public static fromArray(array: Point): Vector2D {
    return new Vector2D(array[0], array[1])
  }
  // 示例
  // const array = [3, 4];
  // const vector = Vector2D.fromArray(array);
  // console.log(vector); // 输出: Vector2D { coordinates: Float32Array [ 3, 4 ] }

  // 从对象创建向量
  public static fromObject(obj: { x: number; y: number }): Vector2D {
    return new Vector2D(obj.x, obj.y)
  }
  // 示例
  // const obj = { x: 3, y: 4 };
  // const vector = Vector2D.fromObject(obj);
  // console.log(vector); // 输出: Vector2D { coordinates: Float32Array [ 3, 4 ] }

  // 获取向量的长度
  public getMagnitude(): number {
    return Math.sqrt(this.coordinates[0] * this.coordinates[0] + this.coordinates[1] * this.coordinates[1])
  }
  // 示例
  // const vector = new Vector2D(3, 4);
  // console.log(vector.getMagnitude()); // 输出: 5

  // 获取向量的单位向量
  public getUnitVector(): Vector2D {
    const magnitude = this.getMagnitude()
    if (magnitude === 0) {
      throw new Error('Cannot calculate unit vector for a zero vector')
    }
    return new Vector2D(this.coordinates[0] / magnitude, this.coordinates[1] / magnitude)
  }
  // 示例
  // const vector = new Vector2D(3, 4);
  // const unitVector = vector.getUnitVector();
  // console.log(unitVector); // 输出: Vector2D { coordinates: Float32Array [ 0.6, 0.8 ] }

  // 获取向量方向的角度（以度为单位）
  public getDirectionDegrees(): number {
    return (Math.atan2(this.coordinates[1], this.coordinates[0]) * 180) / Math.PI
  }
  // 示例
  // const vector = new Vector2D(1, 1);
  // console.log(vector.getDirectionDegrees()); // 输出: 45

  // 向量加法
  public add(vector: Vector2D): Vector2D {
    return new Vector2D(this.coordinates[0] + vector.coordinates[0], this.coordinates[1] + vector.coordinates[1])
  }
  // 示例
  // const vector1 = new Vector2D(1, 2);
  // const vector2 = new Vector2D(3, 4);
  // const result = vector1.add(vector2);
  // console.log(result); // 输出: Vector2D { coordinates: Float32Array [ 4, 6 ] }

  // 向量减法
  public subtract(vector: Vector2D): Vector2D {
    return new Vector2D(this.coordinates[0] - vector.coordinates[0], this.coordinates[1] - vector.coordinates[1])
  }
  // 示例
  // const vector1 = new Vector2D(3, 4);
  // const vector2 = new Vector2D(1, 2);
  // const result = vector1.subtract(vector2);
  // console.log(result); // 输出: Vector2D { coordinates: Float32Array [ 2, 2 ] }

  // 向量数量乘法
  public scalarMultiply(scalar: number): Vector2D {
    return new Vector2D(this.coordinates[0] * scalar, this.coordinates[1] * scalar)
  }
  // 示例
  // const vector = new Vector2D(2, 3);
  // const result = vector.scalarMultiply(2);
  // console.log(result); // 输出: Vector2D { coordinates: Float32Array [ 4, 6 ] }

  // 向量点积
  public dotProduct(vector: Vector2D): number {
    return this.coordinates[0] * vector.coordinates[0] + this.coordinates[1] * vector.coordinates[1]
  }
  // 示例
  // const vector1 = new Vector2D(1, 2);
  // const vector2 = new Vector2D(3, 4);
  // console.log(vector1.dotProduct(vector2)); // 输出: 11

  // 向量叉积
  public crossProduct(vector: Vector2D): number {
    return this.coordinates[0] * vector.coordinates[1] - this.coordinates[1] * vector.coordinates[0]
  }
  // 示例
  // const vector1 = new Vector2D(2, 3);
  // const vector2 = new Vector2D(4, 5);
  // console.log(vector1.crossProduct(vector2)); // 输出: -2

  // 获取两向量夹角的弧度
  public getAngleRadians(vector: Vector2D): number {
    const dotProduct = this.dotProduct(vector)
    const magnitudeProduct = this.getMagnitude() * vector.getMagnitude()
    return Math.acos(dotProduct / magnitudeProduct)
  }
  // 示例
  // const vector1 = new Vector2D(1, 0);
  // const vector2 = new Vector2D(0, 1);
  // console.log(vector1.getAngleRadians(vector2)); // 输出: 1.5707963267948966

  // 向量投影
  public projectOnto(vector: Vector2D): Vector2D {
    const dotProduct = this.dotProduct(vector)
    const magnitudeSquared = vector.getMagnitude() ** 2
    const scalar = dotProduct / magnitudeSquared
    return vector.scalarMultiply(scalar)
  }
  // 示例
  // const vector1 = new Vector2D(3, 4);
  // const vector2 = new Vector2D(1, 0);
  // console.log(vector1.projectOnto(vector2)); // 输出: Vector2D { coordinates: Float32Array [ 3, 0 ] }

  // 向量旋转（逆时针方向，角度为弧度）
  public rotate(angleRadians: number): Vector2D {
    const cosTheta = Math.cos(angleRadians)
    const sinTheta = Math.sin(angleRadians)
    const newX = this.coordinates[0] * cosTheta - this.coordinates[1] * sinTheta
    const newY = this.coordinates[0] * sinTheta + this.coordinates[1] * cosTheta
    return new Vector2D(newX, newY)
  }
  // 示例
  // const vector = new Vector2D(1, 0);
  // const result = vector.rotate(Math.PI / 2);
  // console.log(result); // 输出: Vector2D { coordinates: Float32Array [ 6.123233995736766e-17, 1 ] }

  // 向量平移
  public translate(dx: number, dy: number): Vector2D {
    return new Vector2D(this.coordinates[0] + dx, this.coordinates[1] + dy)
  }
  // 示例
  // const vector = new Vector2D(1, 2);
  // const result = vector.translate(2, 3);
  // console.log(result); // 输出: Vector2D { coordinates: Float32Array [ 3, 5 ] }

  // 检查向量相等
  public isEqual(vector: Vector2D): boolean {
    return this.coordinates[0] === vector.coordinates[0] && this.coordinates[1] === vector.coordinates[1]
  }
  // 示例
  // const vector1 = new Vector2D(3, 4);
  // const vector2 = new Vector2D(3, 4);
  // console.log(vector1.isEqual(vector2)); // 输出: true

  // 求解向量的法向量（逆时针旋转90度）
  public getNormalVector(): Vector2D {
    return new Vector2D(-this.coordinates[1], this.coordinates[0])
  }
  // 示例
  // const vector = new Vector2D(3, 4);
  // console.log(vector.getNormalVector()); // 输出: Vector2D { coordinates: Float32Array [ -4, 3 ] }

  // 碰撞检测
  public isCollidingWith(vector: Vector2D, radius: number): boolean {
    const distance = this.subtract(vector).getMagnitude()
    return distance <= radius
  }
  // 示例
  // const vector1 = new Vector2D(3, 4);
  // const vector2 = new Vector2D(1, 2);
  // console.log(vector1.isCollidingWith(vector2, 3)); // 输出: true
}
