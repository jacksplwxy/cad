import { BaseCommand, type ICommandRule } from '../BaseCommand'

export class ESCAPE extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      console.log('取消')
    },
    msg: '取消',
    next: [],
    subCommand: {},
  }

  protected dispose() {
    // 无需处理
  }
}
