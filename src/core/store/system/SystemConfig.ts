import { inject, injectable } from 'inversify'
import { EnvConfig } from '../env/EnvConfig'

@injectable()
export class SystemConfig {
  private _crossLength!: number // 十字标
  private _squareLength!: number // 矩形标
  private _detectTime!: number // 光标探测间隔时间
  private _maxNodeEntityShowNum!: number // 被选中图形的数量超过该值时不进行节点绘制
  private _snapSize!: number // 对象捕捉范围
  private _selectedNodeSize!: number // 选中节点大小

  constructor(@inject(EnvConfig) private envConfig: EnvConfig) {}

  public init() {
    this._crossLength = 100 * this.envConfig.dpr
    this._squareLength = 10 * this.envConfig.dpr
    this._detectTime = 20
    this._maxNodeEntityShowNum = 10
    this._snapSize = 20 * this.envConfig.dpr
    this._selectedNodeSize = 12 * this.envConfig.dpr
  }

  public get crossLength(): Readonly<number> {
    return this._crossLength
  }
  public get squareLength(): Readonly<number> {
    return this._squareLength
  }
  public get detectTime(): Readonly<number> {
    return this._detectTime
  }
  public get maxNodeEntityShowNum(): Readonly<number> {
    return this._maxNodeEntityShowNum
  }
  public get snapSize(): Readonly<number> {
    return this._snapSize
  }
  public get selectedNodeSize(): Readonly<number> {
    return this._selectedNodeSize
  }
}
