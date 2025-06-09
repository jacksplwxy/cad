import { RtreeVisual } from '@/core/visual/RtreeVisual'
import { BaseCommand, type ICommandRule } from '../BaseCommand'
import { inject, injectable } from 'inversify'

@injectable()
export class RTV extends BaseCommand {
  @inject(RtreeVisual) private rtreeVisual!: RtreeVisual
  protected rule: ICommandRule = {
    action: () => {
      this.rtreeVisual.rtreeVisualShow = !this.rtreeVisual.rtreeVisualShow
      this.rtreeVisual.updateRtreeVisual()
    },
    msg: '展示/隐藏Rtree可视化视图',
    next: [],
    subCommand: {},
  }
  protected dispose() {
    // 无需处理
  }
}
