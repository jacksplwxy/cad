import { inject, injectable } from 'inversify'
import { CommandName } from '../command/CommandRegistry'
import { CommandManager } from '../command/CommandManager'

@injectable()
export class ShortcutManager {
  private shortcuts: Record<string, CommandName> = {}
  private defaultShortcuts: Record<string, CommandName> = {}
  @inject(CommandManager) private commandManager!: CommandManager

  constructor() {}

  public init() {
    this.defaultShortcuts = this.commandManager.getAllCommands()
    // 加载默认快捷键
    this.shortcuts = { ...this.defaultShortcuts }
  }

  // 添加/修改快捷键
  public setShortcut(keyCombination: string, command: CommandName): void {
    this.shortcuts[keyCombination] = command
  }

  // 移除快捷键
  public removeShortcut(keyCombination: string): void {
    delete this.shortcuts[keyCombination]
  }

  // 获取所有快捷键
  public getAllShortcut(): Record<string, CommandName> {
    return this.shortcuts
  }
}
