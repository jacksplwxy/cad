import { type BaseCommand } from './BaseCommand'
import { LINE } from './commands/LINE'
import { ERASE } from './commands/ERASE'
import { MOVE } from './commands/MOVE'
import { COPY } from './commands/COPY'
import { RECTANGLE } from './commands/RECTANGLE'
import { CIRCLE } from './commands/CIRCLE'
import { ARC } from './commands/ARC'
import { PLINE } from './commands/PLINE'
import { HELP } from './commands/HELP'
import { MTEXT } from './commands/MTEXT'
import { SELECTIONBOXALL } from './commands/SELECTIONBOXALL'
import { KEYNODESDRAG } from './commands/KEYNODESDRAG'
import { LRUCache } from '../helper/LRUCache'
import { Container, injectable } from 'inversify'
import { ESCAPE } from './commands/ESCAPE'
import { READDATALOCAL } from './commands/READDATALOCAL'
import { SAVEDATALOCAL } from './commands/SAVEDATALOCAL'
import { RTV } from './commands/RTV'

// 定义命令名称类型
export type CommandName =
  | typeof LINE.name
  | typeof ERASE.name
  | typeof MOVE.name
  | typeof COPY.name
  | typeof RECTANGLE.name
  | typeof CIRCLE.name
  | typeof ARC.name
  | typeof PLINE.name
  | typeof HELP.name
  | typeof MTEXT.name
  | typeof SELECTIONBOXALL.name
  | typeof KEYNODESDRAG.name
  | typeof ESCAPE.name
  | typeof RTV.name

@injectable()
export class CommandRegistry {
  // 指令类数组
  private commandsArr: Array<typeof BaseCommand> = [LINE, ERASE, MOVE, COPY, RECTANGLE, CIRCLE, ARC, PLINE, HELP, MTEXT, SELECTIONBOXALL, KEYNODESDRAG, ESCAPE, SAVEDATALOCAL, READDATALOCAL, RTV]
  private commandsMap: Record<CommandName, typeof BaseCommand> = {}

  private commandCache: LRUCache<BaseCommand> // 缓存类型指定为 BaseCommand
  private iocContainer: Container

  constructor(iocContainer: Container, capacity = 10) {
    this.iocContainer = iocContainer
    this.commandCache = new LRUCache<BaseCommand>(capacity)
    this.registerCommands()
  }

  // 动态注册命令类
  private registerCommands() {
    this.commandsArr.forEach((command) => {
      this.iocContainer.bind(command).toSelf()
      this.commandsMap[command.name] = command
    })
  }

  // 获取命令实例
  public getCommand(commandName: CommandName): BaseCommand | null {
    let command = this.commandCache.get(commandName)
    if (command) {
      return command
    } else {
      const commandType: typeof BaseCommand = this.commandsMap[commandName]
      if (commandType) {
        // 使用 iocContainer 从容器中获取命令实例
        command = this.iocContainer.get<BaseCommand>(commandType)
        if (commandType && command) {
          this.commandCache.put(commandName, command) // 将命令缓存
          return command
        }
        return command
      } else {
        console.warn('没有找到有效指令！')
        return null
      }
    }
  }

  public getAllCommands(): Record<CommandName, CommandName> {
    const result: Record<CommandName, CommandName> = {} as Record<CommandName, CommandName>
    this.commandsArr.forEach((command) => {
      result[command.name.toUpperCase()] = command.name.toUpperCase()
    })
    return result
  }
}
