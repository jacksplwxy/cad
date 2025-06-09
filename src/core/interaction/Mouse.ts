import { BaseEventBus } from '../helper/BaseEventBus'
import { injectable } from 'inversify'
import { Point } from '../utils/math/ComputGeometry'

export interface IView {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export const MyMouseEvent = {
  VisualWorkerViewChange: 'VisualWorkerViewChange',
  BaseMousedownChange: 'BaseMousedownChange',
  BaseMouseChange: 'BaseMouseChange',
  BaseMouseupChange: 'BaseMouseupChange',
  BaseMouseRecordsChange: 'BaseMouseRecordsChange',
  WheelDeltaYChange: 'WheelDeltaYChange',
}

@injectable()
export class Mouse extends BaseEventBus {
  private _visualWorkerView: IView = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } // worker线程离屏canvas坐标变换终值（绝对值）
  private _baseMousedownX = 0 // 鼠标按下x坐标
  private _baseMousedownY = 0 // 鼠标按下y坐标
  private _baseMouseX = 0 // 鼠标移动x坐标
  private _baseMouseY = 0 // 鼠标移动y坐标
  private _baseMouseupX = 0 // 鼠标弹出x坐标
  private _baseMouseupY = 0 // 鼠标弹出y坐标
  private _baseMouseRecords: number[][] = [] // 鼠标点击记录
  private _wheelDeltaY = 0 // 滚轮上下滚动值

  public constructor() {
    super()
  }

  public get visualWorkerView(): Readonly<IView> {
    return this._visualWorkerView
  }
  public setVisualWorkerView(val: IView): void {
    const oldVal = this._visualWorkerView
    this._visualWorkerView = val
    this.dispatchEvent(MyMouseEvent.VisualWorkerViewChange, val, oldVal)
  }
  public get baseMousedownX(): Readonly<number> {
    return this._baseMousedownX
  }
  public get baseMousedownY(): Readonly<number> {
    return this._baseMousedownY
  }
  public setBaseMousedown(val: [number, number]): void {
    const oldVal = [this._baseMousedownX, this._baseMousedownY]
    this._baseMousedownX = val[0]
    this._baseMousedownY = val[1]
    this.dispatchEvent(MyMouseEvent.BaseMousedownChange, val, oldVal)
  }
  public get baseMouseX(): Readonly<number> {
    return this._baseMouseX
  }
  public get baseMouseY(): Readonly<number> {
    return this._baseMouseY
  }
  public setBaseMouse(val: [number, number]): void {
    const oldVal = [this._baseMouseX, this._baseMouseY]
    this._baseMouseX = val[0]
    this._baseMouseY = val[1]
    this.dispatchEvent(MyMouseEvent.BaseMouseChange, val, oldVal)
  }
  public get baseMouseupX(): Readonly<number> {
    return this._baseMouseupX
  }
  public get baseMouseupY(): Readonly<number> {
    return this._baseMouseupY
  }
  public setBaseMouseup(val: [number, number]): void {
    const oldVal = [this._baseMouseupX, this._baseMouseupY]
    this._baseMouseupX = val[0]
    this._baseMouseupY = val[1]
    this.dispatchEvent(MyMouseEvent.BaseMouseupChange, val, oldVal)
  }
  public get baseMouseRecords(): Readonly<number[][]> {
    return this._baseMouseRecords
  }
  public setBaseMouseRecords(val: number[][]): void {
    const oldVal = this._baseMouseRecords
    this._baseMouseRecords = val
    this.dispatchEvent(MyMouseEvent.BaseMouseRecordsChange, val, oldVal)
  }
  public get wheelDeltaY(): Readonly<number> {
    return this._wheelDeltaY
  }
  public setWheelDeltaY(val: number): void {
    const oldVal = this._wheelDeltaY
    this._wheelDeltaY = val
    this.dispatchEvent(MyMouseEvent.WheelDeltaYChange, val, oldVal)
  }

  // 鼠标按下x坐标（相对于转换坐标后的canvas的位置）（例如坐标系整体右移100后，点击原来左上角的原点得到的[mousedownX,mousedownY]就应该为[-100,0]）
  public get mousedownX(): number {
    return this.affineInverseTransformX(this._baseMousedownX)
  }
  // 鼠标按下y坐标（相对于转换坐标后的canvas的位置）
  public get mousedownY(): number {
    return this.affineInverseTransformY(this._baseMousedownY)
  }
  // 鼠标移动x坐标（相对于转换坐标后的canvas的位置）
  public get mouseX(): number {
    return this.affineInverseTransformX(this._baseMouseX)
  }
  // 鼠标移动y坐标（相对于转换坐标后的canvas的位置）
  public get mouseY(): number {
    return this.affineInverseTransformY(this._baseMouseY)
  }
  // 鼠标弹出x坐标（相对于转换坐标后的canvas的位置）
  public get mouseupX(): number {
    return this.affineInverseTransformX(this._baseMouseupX)
  }
  // 鼠标弹出y坐标（相对于转换坐标后的canvas的位置）
  public getmouseupY(): number {
    return this.affineInverseTransformY(this._baseMouseupY)
  }
  // 鼠标点击记录（相对于转换坐标后的canvas的位置）
  public get mouseRecords(): number[][] {
    return this._baseMouseRecords.map((point) => {
      return point.map((num, index) => {
        if (index === 0) {
          return this.affineInverseTransformX(num)
        } else {
          return this.affineInverseTransformY(num)
        }
      })
    })
  }

  // 坐标系x的矩阵仿射变换
  public affineTransformX(x: number): number {
    // x′=a⋅x+c⋅y+e
    const { a, e } = this._visualWorkerView
    return x * a + e
  }

  // 坐标系y的矩阵仿射变换
  public affineTransformY(y: number): number {
    // y′=b⋅x+d⋅y+f
    const { d, f } = this._visualWorkerView
    return y * d + f
  }

  // 坐标系x的矩阵逆仿射变换
  public affineInverseTransformX(x: number): number {
    // x=(d·x′-c⋅y′+c·f-d·e)/(a·d-b·c)
    const { a, e } = this._visualWorkerView
    return (x - e) / a
  }

  // 坐标系y的矩阵逆仿射变换
  public affineInverseTransformY(y: number): number {
    // y=(-b·x′+a⋅y′+b·e-a·f)/(a·d-b·c)
    const { d, f } = this._visualWorkerView
    return (y - f) / d
  }

  // 将基本坐标点跟随坐标系变换：[x,y]→[x`,y`]
  // 获取原始坐标[x,y]经过setTransform(a, b, c, d, e, f)变换后的坐标[x`,y`]
  public affineTransformPoint(transformPoint: Point): Point {
    return [this.affineTransformX(transformPoint[0]), this.affineTransformY(transformPoint[1])]
  }

  // 将变换后的点还原为变换前的点：[x`,y`]→[x,y]
  // （例如坐标系整体右移100后，点击原来屏幕左上角的原点得到的[mousedownX,mousedownY]就应该为[-100,0]）
  public affineInverseTransformPoint(basePoint: Point): Point {
    return [this.affineInverseTransformX(basePoint[0]), this.affineInverseTransformY(basePoint[1])]
  }

  /**
   * 将坐标相对变换转换为绝对变换
   * @param baseView 原始绝对坐标系
   * @param relativeTransform 相对变换
   * @returns 变换后的绝对坐标系
   */
  public getAbsoluteTransformFromRelative(baseView: IView, relativeTransform: IView): IView {
    return {
      a: baseView.a * relativeTransform.a + baseView.c * relativeTransform.b,
      b: baseView.b * relativeTransform.a + baseView.d * relativeTransform.b,
      c: baseView.a * relativeTransform.c + baseView.c * relativeTransform.d,
      d: baseView.b * relativeTransform.c + baseView.d * relativeTransform.d,
      e: baseView.a * relativeTransform.e + baseView.c * relativeTransform.f + baseView.e,
      f: baseView.b * relativeTransform.e + baseView.d * relativeTransform.f + baseView.f,
    }
  }
}
