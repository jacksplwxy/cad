// 定义 QueueStrategy 接口
export interface QueueStrategy {
  name: Strategy
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void
  beforeExecuteMessage?(queue: MessageQueue): void
}

// 策略枚举
export enum Strategy {
  ExecuteAllStrategy = 'ExecuteAllStrategy',
  ExecuteLatestStrategy = 'ExecuteLatestStrategy',
  NoNewWhileExecutingStrategy = 'NoNewWhileExecutingStrategy',
  DiscardEvenlyStrategy = 'DiscardEvenlyStrategy',
  ExecuteRecentStrategy = 'ExecuteRecentStrategy',
}

export class MessageQueue {
  public queue: { task: any; resolve: (value: any) => void; reject: (reason?: any) => void }[] = []
  public isProcessing = false // 是否正在执行消息
  private currentStrategy!: QueueStrategy

  constructor(strategy: QueueStrategy) {
    this.setStrategy(strategy)
  }

  // 设置队列策略
  public setStrategy(strategy: QueueStrategy): void {
    this.currentStrategy = strategy
  }

  // 入队消息，并返回 Promise
  public addTask(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.currentStrategy.addToEnqueue(this, task, resolve, reject)
      this.processQueue() // 处理队列中的任务
    })
  }

  // 出队并执行消息
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return // 如果正在处理，或者队列为空，直接返回
    }
    this.isProcessing = true // 标记开始处理消息
    this.currentStrategy.beforeExecuteMessage && this.currentStrategy.beforeExecuteMessage(this)

    const { task, resolve, reject } = this.queue.shift()! // 取出队列中的第一条消息
    try {
      const result = await this.executeMessage(task) // 执行消息
      resolve(result) // 解析 Promise
    } catch (error) {
      reject(error) // 发生错误，拒绝 Promise
    }

    this.isProcessing = false // 当前任务执行完毕
    if (this.queue.length > 0) {
      this.processQueue() // 递归调用处理下一个消息
    }
  }

  // 执行消息
  private async executeMessage(task: any): Promise<any> {
    if (typeof task === 'function') {
      return await task() // 执行并返回结果
    } else if (typeof task === 'string') {
      console.log('Message:', task)
      return task
    }
    return null
  }

  // 获取队列大小
  public getQueueSize(): number {
    return this.queue.length
  }

  // 获取当前策略名称
  public getCurrentStrategy(): string {
    return this.currentStrategy.name
  }
}

// 策略1：执行所有消息（按顺序）
export class ExecuteAllStrategy implements QueueStrategy {
  name: Strategy = Strategy.ExecuteAllStrategy
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    queue.queue.push({ task, resolve, reject }) // 允许入队
  }
}

// 策略2：只执行当前正在执行的消息和最新进入的一条消息
export class ExecuteLatestStrategy implements QueueStrategy {
  name: Strategy = Strategy.ExecuteLatestStrategy
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    queue.queue = [{ task, resolve, reject }] // 只保留最新的一条
  }
}

// 策略3：当消息正在执行时，不允许进入新的消息
export class NoNewWhileExecutingStrategy implements QueueStrategy {
  name: Strategy = Strategy.NoNewWhileExecutingStrategy
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    if (queue.isProcessing) {
      console.warn('New messages cannot be added while processing.')
      return // 阻止新消息入队
    }
    queue.queue.push({ task, resolve, reject })
  }
}

// 策略4：当消息堆积时，在保证最后一条消息存在的基础上，均匀地丢弃掉一些消息
export class DiscardEvenlyStrategy implements QueueStrategy {
  name: Strategy = Strategy.DiscardEvenlyStrategy
  private max: number
  constructor(max: number) {
    this.max = max // 初始化最大消息数
  }
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    queue.queue.push({ task, resolve, reject })
  }
  beforeExecuteMessage(queue: MessageQueue): void {
    if (queue.queue.length > this.max) {
      let step = Math.floor(queue.queue.length / this.max)
      if (step <= 0) {
        step = 1
      }
      const res = []
      let index = queue.queue.length - 1
      while (res.length < this.max && queue.queue[index]) {
        res.push(queue.queue[index])
        index -= step
      }
      queue.queue = res.reverse()
    }
  }
}

// 策略5：当消息堆积时，只执行最近的几条消息，丢弃前面的
export class ExecuteRecentStrategy implements QueueStrategy {
  name: Strategy = Strategy.ExecuteRecentStrategy
  constructor(private recentCount: number) {}
  addToEnqueue(queue: MessageQueue, task: any, resolve: (value: any) => void, reject: (reason?: any) => void): void {
    queue.queue.push({ task, resolve, reject })
    if (queue.queue.length > this.recentCount) {
      queue.queue = queue.queue.slice(-this.recentCount) // 保留最近的 `recentCount` 条消息
    }
  }
}
