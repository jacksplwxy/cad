import { BaseCommand, type ICommandRule } from '../BaseCommand'
import { injectable } from 'inversify'

@injectable()
export class SELECTIONBOXALL extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      this.setSelectionBoxAll()
    },
    msg: '全选',
    next: [],
    subCommand: {},
  }

  // 全选
  private setSelectionBoxAll(): void {
    const entityArr = this.dataManager.all().map((entity) => {
      if (!entity.other) {
        entity.other = {}
      }
      entity.other.boxSelected = true
      return entity
    })
    this.shapeEdit(entityArr)
  }
  protected dispose() {}
}
