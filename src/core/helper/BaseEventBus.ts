import { injectable } from 'inversify'

type Fn = (...args: any[]) => void
type MyEvent = string

interface IBaseEventBus {
  addEventListener: (name: MyEvent, fn: Fn) => void
  dispatchEvent: (name: MyEvent, ...args: any[]) => void
  removeEventListener: (name: MyEvent, fn: Fn) => void
  removeAllListeners: (name?: MyEvent) => void
  once: (name: MyEvent, fn: Fn) => void
}

@injectable()
export class BaseEventBus implements IBaseEventBus {
  private list: Map<MyEvent, Set<Fn>> = new Map()

  public addEventListener(name: MyEvent, fn: Fn): void {
    let callbacks = this.list.get(name)
    if (!callbacks) {
      callbacks = new Set()
      this.list.set(name, callbacks)
    }
    callbacks.add(fn)
  }

  public dispatchEvent(name: MyEvent, ...args: any[]): void {
    const callbacks = this.list.get(name)
    if (callbacks) {
      // 创建副本以防止在遍历时修改导致问题
      const callbacksCopy = new Set(callbacks)
      for (const callback of callbacksCopy) {
        callback(...args)
      }
      // 清理空的事件列表
      if (callbacks.size === 0) {
        this.list.delete(name)
      }
    }
  }

  public removeEventListener(name: MyEvent, fn: Fn): void {
    const callbacks = this.list.get(name)
    if (callbacks) {
      callbacks.delete(fn)
      // 如果事件列表为空，清理该事件
      if (callbacks.size === 0) {
        this.list.delete(name)
      }
    }
  }

  public removeAllListeners(name?: MyEvent): void {
    if (name) {
      // 移除特定事件的所有监听器
      this.list.delete(name)
    } else {
      // 移除所有事件的监听器
      this.list.clear()
    }
  }

  public once(name: MyEvent, fn: Fn): void {
    const tempFn = (...args: any[]): void => {
      fn(...args)
      this.removeEventListener(name, tempFn)
    }
    this.addEventListener(name, tempFn)
  }
}
