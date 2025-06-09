import { injectable } from 'inversify'

export type Point = [number, number]

@injectable()
export class ComputGeometry {
  private readonly accurary: number = 1e-6 // 我们在做等于判断时，往往都是直接用== ，但是在计算几何中，判断点，距离,以及弧度制是否相同时，都不能用==,在计算几何中，我们认为误差在1e-6或者更小的范围内是相等的

  // 判断2个数是否相等
  public numEqual(num1: number, num2: number): boolean {
    return num1 - num2 < this.accurary
  }
}
