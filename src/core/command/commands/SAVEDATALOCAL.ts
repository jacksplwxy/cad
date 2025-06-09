import { BaseCommand, type ICommandRule } from '../BaseCommand'

export enum ILocalStorageName {
  allLocalData = 'allLocalData',
}

export class SAVEDATALOCAL extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      localStorage.setItem(ILocalStorageName.allLocalData, JSON.stringify(this.dataManager.all()))
    },
    msg: '保存数据到本地',
    next: [],
    subCommand: {},
  }
  protected dispose() {
    // 无需处理
  }
}
