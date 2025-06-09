import { DataManager, type IEntity, type IEntityTemp } from '@/core/data/DataManager'
import { ShapeIdManager } from '@/core/command/ShapeIdManager'
import { deepCopy } from '@/core/utils/utils'
import { CommandVisual } from '@/core/visual/CommandVisual'
import { BaseEventBus } from '../helper/BaseEventBus'
import { inject, injectable } from 'inversify'
import { CommandHistoryManagerEvent, CommandHistoryManager } from './CommandHistoryManager'

export enum MyCommandEvent {
  CommandStart = 'CommandStart', //命令开始事件
  MateCommandEnd = 'MateCommandEnd', // 原子命令结束事件
  CommandEnd = 'CommandEnd', //命令结束事件
  CommandError = 'CommandError', // 指令错误事件
}

// 原子命令工作流状态
export enum MetaCommandWorkflowType {
  Normal = 'Normal', // 正常的原子命令工作流
  Rretry = 'Rretry', // 原子命令保持状态不变，不切换到下一个命令状态
  Over = 'Over', // 直接去执行命令终止
}

// meta指令执行结构
export interface IMetaCommandRunResult {
  metaCommandWorkflowType: MetaCommandWorkflowType //原子命令状态工作流类型，来控制原子命令行工作流的执行方式
  data?: any // 向交互层暴露的数据
}

// 特殊指令状态
enum SpectCommandState {
  ESCAPE = 'ESCAPE', //取消指令
}

interface ICommandBaseRule {
  name?: string //指令状态名
  /**
   * 指令状态执行回调函数
   * @param params 输入数据
   * @returns 正常执行返回void；可以根据需求返回不同状态，以控制命令执行工作流或触发自定义事件
   */
  action: (params?: any) => void | IMetaCommandRunResult
  msg: string // 当前指令的名称说明
  next: string[] // 下一个指令状态
}

export interface ICommandRule extends ICommandBaseRule {
  subCommand: Record<string, ICommandBaseRule> // 子命令类型不包含 type 字段
}

@injectable()
export abstract class BaseCommand extends BaseEventBus {
  @inject(DataManager) protected dataManager!: DataManager
  @inject(CommandVisual) protected guide!: CommandVisual
  @inject(CommandHistoryManager) protected commandHistoryManager!: CommandHistoryManager
  @inject(ShapeIdManager) protected shapeIdManager!: ShapeIdManager
  public isRunning = false //命令是否正在运行
  protected abstract rule: ICommandRule
  protected abstract dispose(): void // 实例被销毁
  protected description = '' //命令行使用描述
  private nextCommandStateStrArr: string[] = [] // 下一步合法的命令行状态数组
  private commandStateStr = '' // 当前命令行状态

  constructor() {
    super()
  }

  // 撤销状态：就是将存储的指令状态和交互数据出栈（注意：部分指令需要重写，例如复制还需要撤销上次图片创建命令）
  protected UNDORule = {
    name: 'UNDO', //撤销状态指令
    action: () => {
      console.warn('方法未实现')
    },
    msg: '放弃(U)',
    next: [],
  }

  /**
   * 执行指令
   * @param command 为string时表示指定命令，为null时表示按照rule默认规则命令
   * @param params  传给指令的参数
   * @returns void
   */
  public run(command: string | null, params?: any): void {
    try {
      if (!this.isRunning) {
        this.dispatchEvent(MyCommandEvent.CommandStart, {
          command: this,
        })
        this.isRunning = true
        console.info('%c当前命令：' + this.rule.msg, 'color: green;')
        const metaCommandRunResult = this.rule.action(params)
        this.dispatchEvent(MyCommandEvent.MateCommandEnd, {
          data: metaCommandRunResult ? { ...metaCommandRunResult.data } : {},
          command: this,
        })
        if (metaCommandRunResult) {
          switch (metaCommandRunResult.metaCommandWorkflowType) {
            case MetaCommandWorkflowType.Normal: {
              // 什么都不用做
              break
            }
            case MetaCommandWorkflowType.Rretry: {
              return
            }
            case MetaCommandWorkflowType.Over: {
              this.dispatchEvent(MyCommandEvent.CommandEnd, {
                data: metaCommandRunResult ? { ...metaCommandRunResult.data } : {},
                command: this,
              })
              this.commandOver()
              return
            }
          }
        }
        console.info('%c可执行命令：' + this.rule.next.join(' | '), 'color: green;')
        // 需要判定输入的指令是否是next待选的指令
        this.nextCommandStateStrArr = this.rule.next
        // 拿到下一个默认的指令状态
        this.commandStateStr = this.rule.next[0]
        // 判定是否可以完结指令
        if (!this.commandStateStr) {
          this.dispatchEvent(MyCommandEvent.CommandEnd, {
            command: this,
          })
          this.commandOver()
        }
      } else {
        // 取消命令
        if (command === SpectCommandState.ESCAPE) {
          this.dispatchEvent(MyCommandEvent.MateCommandEnd, {
            command: this,
          })
          this.dispatchEvent(MyCommandEvent.CommandEnd, {
            command: this,
          })
          this.commandOver()
          return
        }
        // 切换子命令
        else if (this.nextCommandStateStrArr.includes(command || '')) {
          console.info('%c命令从' + this.commandStateStr + '切换到' + command, 'color: green;')
          this.commandStateStr = command || ''
        }
        // 设置命令默认不会结束
        if (this.rule.subCommand[this.commandStateStr]) {
          console.info('%c当前命令：' + this.rule.subCommand[this.commandStateStr].msg, 'color: green;')
          const metaCommandRunResult = this.rule.subCommand[this.commandStateStr].action(params)
          this.dispatchEvent(MyCommandEvent.MateCommandEnd, {
            data: metaCommandRunResult ? { ...metaCommandRunResult.data } : {},
            command: this,
          })
          if (metaCommandRunResult) {
            switch (metaCommandRunResult.metaCommandWorkflowType) {
              case MetaCommandWorkflowType.Normal: {
                // 什么都不用做
                break
              }
              case MetaCommandWorkflowType.Rretry: {
                return
              }
              case MetaCommandWorkflowType.Over: {
                this.dispatchEvent(MyCommandEvent.CommandEnd, {
                  data: metaCommandRunResult ? { ...metaCommandRunResult.data } : {},
                  command: this,
                })
                this.commandOver()
                return
              }
            }
          }
          // 拿到下一个默认的指令状态
          if (this.commandStateStr) {
            console.info('%c可执行命令：' + this.rule.subCommand[this.commandStateStr].next.join(' | '), 'color: green;')
            // 需要判定输入的指令状态是否是next待选的指令
            this.nextCommandStateStrArr = this.rule.subCommand[this.commandStateStr].next
            // 拿到下一个默认的指令状态
            this.commandStateStr = this.rule.subCommand[this.commandStateStr].next[0]
          }
          // 判定是否可以完结指令
          if (!this.commandStateStr) {
            this.dispatchEvent(MyCommandEvent.CommandEnd, {
              command: this,
            })
            this.commandOver()
          }
        } else {
          this.dispatchEvent(MyCommandEvent.MateCommandEnd, {
            command: this,
          })
          console.trace('指令状态不合法！')
        }
      }
    } catch (error) {
      console.error('指令错误:', error)
      this.dispatchEvent(MyCommandEvent.CommandError, {
        command: this,
      })
      this.commandOver()
    }
  }

  // 命令结束
  private commandOver(): void {
    this.isRunning = false
    console.info('%c命令结束', 'color: yellow;')
    this.commandStateStr = ''
    this.dispose()
  }

  // 图形完成创建
  protected shapeCreated(entityTempArr: IEntityTemp[]): void {
    const entityArr: IEntity[] = []
    entityTempArr.forEach((entityTemp: IEntityTemp) => {
      const entity = deepCopy(entityTemp) as IEntity
      entity.id = this.shapeIdManager.createId()
      entityArr.push(entity)
    })
    if (entityArr.length) {
      // 添加数据
      this.dataManager.addEntityData(entityArr)
      this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeCreated, entityArr)
    }
  }

  // 图形完成编辑
  protected shapeEdit(entityArr: IEntity[]): void {
    if (entityArr.length) {
      // 更新数据
      this.dataManager.editEntitiesData(entityArr)
      this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeEdited, entityArr)
    }
  }

  // 图形完成删除
  protected shapeDeleted(entityArr: IEntity[]): void {
    if (entityArr.length) {
      // 删除数据
      this.dataManager.delEntityData(entityArr)
      this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeDelete, entityArr)
      // 释放id资源池中的id
      entityArr.forEach((entity) => {
        this.shapeIdManager.deleteId(entity.id)
      })
    }
  }
}
