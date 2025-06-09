interface IData<T = any> {
  [key: string]: T
}

export class StateManager<T = any> {
  private state: IData<T>
  // 使用 WeakMap 存储监听器，key 为包装对象，value 为该属性对应的监听回调数组
  private listenerMap: WeakMap<object, Array<(newValues: any[], oldValues: any[]) => void>> = new WeakMap()
  // keyMap 用于保存 state 属性（字符串）与包装对象的映射，以便在需要时能够遍历所有监听属性
  private keyMap: Map<keyof IData<T>, object> = new Map()

  constructor(initialState: IData<T>) {
    this.state = initialState
    // 对每个初始状态的 key，创建一个包装对象并初始化对应的监听器数组
    Object.keys(initialState).forEach((key) => {
      const keyObj = {} // 包装对象
      this.keyMap.set(key, keyObj)
      this.listenerMap.set(keyObj, [])
    })
  }

  public getState<K extends keyof IData<T>>(key: K): Readonly<IData<T>[K]> {
    return this.state[key]
  }

  // 数据更新
  public setData(updates: Partial<IData<T>>) {
    const oldState: Partial<IData<T>> = { ...this.state } // 浅拷贝旧状态（如果需要深拷贝，请根据具体业务自行处理）
    const changedKeys: (keyof IData<T>)[] = []

    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        if (!(key in this.state)) {
          console.warn(`StateManager: Trying to update undefined key: ${key}`)
          continue
        }
        this.state[key] = updates[key] as T
        changedKeys.push(key)
      }
    }

    // 只调用一次 emit，并传递所有变化
    this.emit(this.state, oldState)
  }

  private emit(newState: Partial<IData<T>>, oldState: Partial<IData<T>>) {
    // 使用 Map 收集所有监听的回调及其对应的新旧值，保证每个回调只执行一次
    const callbacksMap: Map<(newValues: any[], oldValues: any[]) => void, { newValues: any[]; oldValues: any[] }> = new Map()

    // 通过 keyMap 遍历所有注册了监听的 state 属性
    this.keyMap.forEach((keyObj, key) => {
      const listeners = this.listenerMap.get(keyObj)
      if (listeners && listeners.length > 0) {
        const newValue = newState[key]
        const oldValue = oldState[key]
        listeners.forEach((callback) => {
          if (!callbacksMap.has(callback)) {
            callbacksMap.set(callback, { newValues: [], oldValues: [] })
          }
          callbacksMap.get(callback)!.newValues.push(newValue)
          callbacksMap.get(callback)!.oldValues.push(oldValue)
        })
      }
    })

    // 触发每个监听器的回调，并一次性传递所有变化
    callbacksMap.forEach(({ newValues, oldValues }, callback) => {
      callback(newValues, oldValues)
    })
  }

  // 监听数据变化，返回一个取消监听的函数
  public watch<K extends keyof IData<T>>(keys: K[], callback: (newValues: IData<T>[K][], oldValues: IData<T>[K][]) => void) {
    keys.forEach((key) => {
      // 如果 keyMap 中没有对应包装对象，则创建新的包装对象并添加到 listenerMap 中
      if (!this.keyMap.has(key)) {
        const keyObj = {}
        this.keyMap.set(key, keyObj)
        this.listenerMap.set(keyObj, [])
      }
      const keyObj = this.keyMap.get(key)!
      const listeners = this.listenerMap.get(keyObj)
      if (listeners) {
        listeners.push(callback)
      } else {
        this.listenerMap.set(keyObj, [callback])
      }
    })

    // 返回一个取消监听的函数
    return () => {
      this.unwatch(keys, callback)
    }
  }

  // 取消对指定属性和回调函数的监听
  public unwatch<K extends keyof IData<T>>(keys: K[], callback: (newValues: IData<T>[K][], oldValues: IData<T>[K][]) => void) {
    keys.forEach((key) => {
      const keyObj = this.keyMap.get(key)
      if (keyObj) {
        const listeners = this.listenerMap.get(keyObj)
        if (listeners) {
          const filtered = listeners.filter((listener) => listener !== callback)
          if (filtered.length > 0) {
            this.listenerMap.set(keyObj, filtered)
          } else {
            // 如果该属性没有任何监听器，则从 listenerMap 和 keyMap 中移除
            this.listenerMap.delete(keyObj)
            this.keyMap.delete(key)
          }
        }
      }
    })
  }

  // 取消所有监听
  // 注意：若仅销毁 StateManager 实例而 listenerMap 仍被外部引用，则可能导致内存泄漏，调用 unwatchAll 可确保所有监听器释放
  public unwatchAll() {
    // 遍历 keyMap 删除 listenerMap 中对应的记录
    this.keyMap.forEach((keyObj) => {
      this.listenerMap.delete(keyObj)
    })
    this.keyMap.clear()
  }
}
