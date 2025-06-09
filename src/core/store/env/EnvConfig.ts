import { BaseEventBus } from '@/core/helper/BaseEventBus'
import { injectable } from 'inversify'

@injectable()
export class EnvConfig extends BaseEventBus {
  // 屏幕分辨率
  private _dpr = 1

  constructor() {
    super()
  }

  get dpr(): Readonly<number> {
    return this._dpr
  }

  setDpr(dpr: number): void {
    this._dpr = dpr
  }

  // canvas清除残影补偿
  get ghostClearCompensation(): Readonly<number> {
    return 1 * this._dpr
  }
}
