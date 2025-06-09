import { BaseCommand, type ICommandRule } from '../BaseCommand'

export class HELP extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      console.log('展示帮助文档')
    },
    msg: '帮助',
    next: [],
    subCommand: {},
  }
  protected dispose() {
    // 无需处理
  }
}
