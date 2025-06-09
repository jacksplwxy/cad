import { injectable } from 'inversify'
import { BaseEventBus } from '../helper/BaseEventBus'

export const MyKeyboardEvent = {
  KeyDown: 'KeyDown',
  KeyUp: 'KeyUp',
}

@injectable()
export class Keyboard extends BaseEventBus {
  private pressedKeys: Set<string> = new Set() // 存储当前按下的键
  private lastProcessedKey: string | null = null // 缓存上次处理的按键

  public constructor() {
    super()
    this.keyboardListenerInit()
  }

  // 键盘监听初始化
  private keyboardListenerInit(): void {
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.clearPressedKeys) // 处理焦点丢失
  }

  // 处理键盘按下事件
  private handleKeyDown = (event: KeyboardEvent): void => {
    const key: string = event.key.toLocaleUpperCase()

    // 处理重复按键的情况
    if (this.lastProcessedKey === key) {
      return
    }
    this.lastProcessedKey = key
    console.info('%c键盘按下：' + key, 'color: green;')
    if (!this.pressedKeys.has(key)) {
      this.pressedKeys.add(key)
      this.eventPreventDefaultFilter(event) // 防止默认行为
      this.dispatchEvent(MyKeyboardEvent.KeyDown, key)
    }
  }

  // 处理键盘释放事件
  private handleKeyUp = (event: KeyboardEvent): void => {
    const key: string = event.key.toLocaleUpperCase()
    if (this.pressedKeys.has(key)) {
      this.pressedKeys.delete(key)
      event.preventDefault() // 阻止默认行为
      this.dispatchEvent(MyKeyboardEvent.KeyUp, key)
    }

    // 清除上次处理的按键
    this.lastProcessedKey = null
  }

  // 防止默认行为
  private eventPreventDefaultFilter(event: KeyboardEvent): void {
    const key = event.key.toLocaleUpperCase()
    // 针对某些特定按键不阻止默认行为
    const allowKeys = ['F12', 'F5', 'F8']
    if (allowKeys.includes(key)) {
      return
    }
    // Shift+Ctrl+C 组合键
    if (this.pressedKeys.has('SHIFT') && this.pressedKeys.has('CONTROL') && this.pressedKeys.has('C')) {
      return
    }
    // 其他情况阻止默认行为
    event.preventDefault()
  }

  // 清空按下的键（处理焦点丢失）
  private clearPressedKeys = (): void => {
    this.pressedKeys.forEach((key) => {
      this.dispatchEvent(MyKeyboardEvent.KeyUp, key) // 触发 KeyUp 事件
    })
    this.pressedKeys.clear()
    this.lastProcessedKey = null
    console.info('%c焦点丢失，清空按下的键', 'color: blue;')
  }

  // 获取当前按下的所有键
  public getPressedKeys(): string[] {
    return Array.from(this.pressedKeys)
  }

  // 判断某个键是否一直按着
  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLocaleUpperCase())
  }

  // 移除事件监听
  public removeEventListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.clearPressedKeys)
  }
}
