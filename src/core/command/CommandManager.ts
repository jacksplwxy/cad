import { type BaseCommand, MyCommandEvent } from './BaseCommand'
import { CommandName, CommandRegistry } from './CommandRegistry'
import { CommandHistoryManager } from './CommandHistoryManager'
import { inject, injectable } from 'inversify'
import { BaseEventBus } from '../helper/BaseEventBus'
import { InteractionCommand } from './InteractionCommand'

@injectable()
export class CommandManager extends BaseEventBus {
  @inject(CommandRegistry) private commandRegistry!: CommandRegistry
  @inject(InteractionCommand) private interactionCommand!: InteractionCommand
  @inject(CommandHistoryManager) private commandHistoryManager!: CommandHistoryManager

  private commandInstance: BaseCommand | null = null
  private prevCurrentCommandStr = '' // 上一次命令

  public constructor() {
    super()
  }

  // 获取所有指令
  public getAllCommands(): Record<CommandName, CommandName> {
    return this.commandRegistry.getAllCommands()
  }

  // 撤销
  public undo() {
    this.commandHistoryManager.undo()
  }
  //重做
  public redo() {
    this.commandHistoryManager.redo()
  }

  // 光标碰撞检测
  public cursorCollisionDetect(x: number, y: number): void {
    this.interactionCommand.cursorCollisionDetect(x, y)
  }

  // 单选
  public setSingleSelectionBox(isShiftKeyPressed: boolean): void {
    this.interactionCommand.setSingleSelectionBox(isShiftKeyPressed)
  }

  // 框选
  public setSelectionBox(start: number[], end: number[], isShiftKeyPressed: boolean): void {
    this.interactionCommand.setSelectionBox(start, end, isShiftKeyPressed)
  }

  // 清除所有已被框选的图形
  public clearSelectionBox(): void {
    this.interactionCommand.clearSelectionBox()
  }

  // 将所有图形缩放居中
  public zoomCenter(canvasWidth: number, canvasHeight: number): void {
    this.interactionCommand.zoomCenter(canvasWidth, canvasHeight)
  }

  /**
   * 执行指令
   * @param command 为string时表示指定命令，为null时表示按照rule默认规则命令
   * @param params  传给指令的参数
   * @returns void
   */
  public run(command: string | null, params?: any): void {
    console.log(35, command, params)
    if ((!this.commandInstance || (this.commandInstance && !this.commandInstance.isRunning)) && command) {
      let currentCommandStr = command
      if (currentCommandStr === ' ') {
        currentCommandStr = this.prevCurrentCommandStr
      }
      if (this.commandInstance) {
        this.commandInstance.removeAllListeners()
      }
      this.commandInstance = this.commandRegistry.getCommand(currentCommandStr) // 创建指令实例
      if (this.commandInstance) {
        this.commandInstance.removeAllListeners()
        this.commandInstance.once(MyCommandEvent.CommandStart, (info) => {
          this.dispatchEvent(MyCommandEvent.CommandStart, info)
        })
        this.commandInstance.addEventListener(MyCommandEvent.MateCommandEnd, (info: any) => {
          this.dispatchEvent(MyCommandEvent.MateCommandEnd, info)
        })
        this.commandInstance.once(MyCommandEvent.CommandEnd, (info) => {
          this.dispatchEvent(MyCommandEvent.CommandEnd, info)
          this.commandInstance && this.commandInstance.removeAllListeners()
        })
        this.commandInstance.once(MyCommandEvent.CommandError, (info) => {
          this.dispatchEvent(MyCommandEvent.CommandError, info)
          this.commandInstance && this.commandInstance.removeAllListeners()
        })

        // 第一次执行指令
        this.commandInstance.run(null, params)
        // ESCAPE指令不保存到prevCurrentCommandStr
        if (currentCommandStr !== 'ESCAPE') {
          this.prevCurrentCommandStr = currentCommandStr
        }
      } else {
        this.dispatchEvent(MyCommandEvent.CommandError)
        console.error('无效指令')
      }
    } else {
      this.commandInstance && this.commandInstance.run(command, params)
    }
  }
}
