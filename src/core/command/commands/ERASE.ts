import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'

export class ERASE extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      if (this.dataManager.selectionBoxEntities.length <= 0) {
        return {
          data: { event: 'CommandSelect' },
          metaCommandWorkflowType: MetaCommandWorkflowType.Over,
        }
      }
      // 点击删除直接删除清除选中数据，并结束命令
      const selectionBoxEntitiesNum = this.dataManager.selectionBoxEntities.length
      this.shapeDeleted(this.dataManager.selectionBoxEntities)
      console.info(`删除${selectionBoxEntitiesNum}个对象`)
    },
    msg: '删除',
    next: [],
    subCommand: {},
  }

  protected dispose() {}
}
