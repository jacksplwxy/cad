interface IData<T = any> {
  [key: string]: T
}

// 抽象类定义
export abstract class AbstractStateManager {
  protected abstract state: IData // 抽象属性，子类必须实现
  private listeners: { keys: (keyof IData)[]; callback: (newValues: any[], oldValues: any[]) => void }[] = []

  constructor() {}

  // 注册观察者
  public watch(keys: (keyof IData)[], callback: (newValues: any[], oldValues: any[]) => void) {
    this.listeners.push({ keys, callback })
  }

  // 更新状态并通知观察者
  protected setState<K extends keyof IData>(key: K, value: IData[K]) {
    const oldValue = this.state[key]
    this.state[key] = value
    this.emit(key, oldValue)
  }

  // 通知观察者
  private emit<K extends keyof IData>(changedKey: K, oldValue: IData[K]) {
    this.listeners.forEach(({ keys, callback }) => {
      const hasChanged = keys.includes(changedKey)
      if (hasChanged) {
        const newValue = this.state[changedKey]
        callback([newValue], [oldValue])
      }
    })
  }
}
