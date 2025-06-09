import { inject, injectable } from 'inversify'
import { DataManager, IEntity } from '../data/DataManager'

export const CommandHistoryManagerEvent = {
  ShapeCreated: 'ShapeCreated', // 图形被创建事件
  ShapeEdited: 'ShapeEdited', // 图形被修改事件
  ShapeDelete: 'ShapeDelete', // 图形被删除恢复事件
}

type ShapeChangeType = typeof CommandHistoryManagerEvent.ShapeCreated | typeof CommandHistoryManagerEvent.ShapeEdited | typeof CommandHistoryManagerEvent.ShapeDelete

interface ICommandHistoryData {
  shapeChangeType: ShapeChangeType
  entitiesId: string[]
}

interface entityStatusInfo {
  entityStatusArr: IEntity[] //历史记录
  pointer: number //当前实体状态的指针（n条数据就指向了n，比index大1）
}

@injectable()
export class CommandHistoryManager {
  @inject(DataManager) private dataManager!: DataManager
  private historyList: ICommandHistoryData[] = [] //操作的历史记录
  private entityStatusHash: Record<string, entityStatusInfo> = {} // historyList中各个实体保存的历史状态记录
  private pointer = 0 // 指针（n条数据就指向了n，比index大1）

  // 添加命令记录
  public add(shapeChangeType: ShapeChangeType, data: IEntity[]): void {
    // this.throwStatus(this.historyList.slice(this.pointer))
    this.historyList = this.historyList.slice(0, this.pointer)
    this.historyList.push({
      shapeChangeType,
      entitiesId: data.map((item) => {
        return item.id
      }),
    })
    this.pointer++
    this.addStatus(data)
  }

  // 恢复指令到pointer位置
  public revert(pointer: number): void {
    if (pointer < 0) {
      console.warn('无法进行撤销了')
      return
    }
    if (pointer > this.historyList.length) {
      console.warn('无法进行重做了')
      return
    }
    if (pointer === this.pointer) {
      return
    }
    const isUndo = pointer < this.pointer
    if (isUndo) {
      const toRevertList = this.historyList.slice(pointer, this.pointer)
      for (let i = toRevertList.length - 1; i >= 0; i--) {
        const shapeChangeType = toRevertList[i].shapeChangeType
        const entityArr: IEntity[] = toRevertList[i].entitiesId.map((id: string) => {
          this.entityStatusHash[id].pointer--
          let entity = null
          // 目标数据的AABB重新赋值为老的AABB
          if (shapeChangeType === CommandHistoryManagerEvent.ShapeEdited) {
            entity = this.entityStatusHash[id].entityStatusArr[this.entityStatusHash[id].pointer - 1]
            entity.AABB = this.entityStatusHash[id].entityStatusArr[this.entityStatusHash[id].pointer].AABB
          } else {
            entity = this.entityStatusHash[id].entityStatusArr[this.entityStatusHash[id].pointer]
          }
          return entity
        })
        switch (shapeChangeType) {
          case CommandHistoryManagerEvent.ShapeCreated: {
            this.dataManager.delEntityData(entityArr)
            break
          }
          case CommandHistoryManagerEvent.ShapeEdited: {
            this.dataManager.editEntitiesData(entityArr)
            break
          }
          case CommandHistoryManagerEvent.ShapeDelete: {
            this.dataManager.addEntityData(entityArr)
            break
          }
        }
        this.pointer--
      }
    } else {
      const toRevertList = this.historyList.slice(this.pointer, pointer)
      for (let i = 0; i < toRevertList.length; i++) {
        const shapeChangeType = toRevertList[i].shapeChangeType
        const entityArr = toRevertList[i].entitiesId.map((id: string) => {
          this.entityStatusHash[id].pointer++
          const entity = this.entityStatusHash[id].entityStatusArr[this.entityStatusHash[id].pointer - 1]
          if (shapeChangeType === CommandHistoryManagerEvent.ShapeEdited) {
            // 目标数据的AABB重新赋值为老的AABB
            entity.AABB = this.entityStatusHash[id].entityStatusArr[this.entityStatusHash[id].pointer - 2].AABB
          }
          return entity
        })
        switch (shapeChangeType) {
          case CommandHistoryManagerEvent.ShapeCreated: {
            this.dataManager.addEntityData(entityArr)
            break
          }
          case CommandHistoryManagerEvent.ShapeEdited: {
            this.dataManager.editEntitiesData(entityArr)
            break
          }
          case CommandHistoryManagerEvent.ShapeDelete: {
            this.dataManager.delEntityData(entityArr)
            break
          }
        }
        this.pointer++
      }
    }
  }

  // 撤销
  public undo(): void {
    const pointer = this.pointer - 1
    this.revert(pointer)
  }

  // 重做
  public redo(): void {
    const pointer = this.pointer + 1
    this.revert(pointer)
  }

  // 添加状态
  private addStatus(entityArr: IEntity[]): void {
    entityArr.forEach((entity) => {
      if (!this.entityStatusHash[entity.id]) {
        this.entityStatusHash[entity.id] = {
          entityStatusArr: [],
          pointer: 0,
        }
      }
      this.entityStatusHash[entity.id].entityStatusArr = this.entityStatusHash[entity.id].entityStatusArr.slice(0, this.entityStatusHash[entity.id].pointer)
      this.entityStatusHash[entity.id].entityStatusArr.push(entity)
      this.entityStatusHash[entity.id].pointer++
    })
  }

  // 丢弃状态
  private throwStatus(historyList: ICommandHistoryData[]): void {
    historyList.reverse().forEach((commandHistoryData: ICommandHistoryData) => {
      commandHistoryData.entitiesId.forEach((id) => {
        this.entityStatusHash[id].entityStatusArr.pop()
        this.entityStatusHash[id].pointer--
      })
    })
  }
}
