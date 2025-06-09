// 双向链表节点类
class ListNode<T> {
  key: string // 节点的键
  value: T // 节点的值，可以是任何类型
  prev: ListNode<T> | null = null // 指向前一个节点
  next: ListNode<T> | null = null // 指向后一个节点

  constructor(key: string, value: T) {
    this.key = key
    this.value = value
  }
}

// LRU 缓存类
export class LRUCache<T> {
  private capacity: number // 缓存的容量上限
  private cache: Map<string, ListNode<T>> // 用于存储缓存数据的哈希表
  private head: ListNode<T> | null = null // 双向链表的头节点
  private tail: ListNode<T> | null = null // 双向链表的尾节点

  constructor(capacity: number) {
    this.capacity = capacity // 初始化缓存容量
    this.cache = new Map() // 初始化缓存哈希表
  }

  // 获取缓存中的值，如果存在则移动到头部
  get(key: string): T | null {
    if (!this.cache.has(key)) {
      return null // 如果缓存中不存在该键，返回 null
    }
    const node = this.cache.get(key)! // 获取节点
    this.moveToHead(node) // 将节点移动到头部，表示最近使用
    return node.value // 返回节点的值
  }

  // 向缓存中添加值，如果已存在则更新值并移动到头部
  put(key: string, value: T): void {
    if (this.cache.has(key)) {
      const node = this.cache.get(key)! // 获取节点
      node.value = value // 更新节点的值
      this.moveToHead(node) // 将节点移动到头部
    } else {
      const newNode = new ListNode(key, value) // 创建新节点
      if (this.cache.size >= this.capacity) {
        this.removeTail() // 如果缓存已满，移除尾节点
      }
      this.addToHead(newNode) // 将新节点添加到头部
      this.cache.set(key, newNode) // 将新节点添加到哈希表
    }
  }

  // 将节点移动到头部
  private moveToHead(node: ListNode<T>): void {
    this.removeNode(node) // 先从链表中移除节点
    this.addToHead(node) // 然后将节点添加到头部
  }

  // 将节点添加到头部
  private addToHead(node: ListNode<T>): void {
    node.next = this.head // 将节点的 next 指向当前头节点
    node.prev = null // 将节点的 prev 设为 null
    if (this.head !== null) {
      this.head.prev = node // 将当前头节点的 prev 指向新节点
    }
    this.head = node // 更新头节点为新节点
    if (this.tail === null) {
      this.tail = node // 如果尾节点为 null，说明这是第一个节点，将其设为尾节点
    }
  }

  // 从链表中移除节点
  private removeNode(node: ListNode<T>): void {
    if (node.prev !== null) {
      node.prev.next = node.next // 将前一个节点的 next 指向当前节点的 next
    } else {
      this.head = node.next // 如果当前节点没有前一个节点，说明是头节点，更新头节点
    }
    if (node.next !== null) {
      node.next.prev = node.prev // 将后一个节点的 prev 指向当前节点的 prev
    } else {
      this.tail = node.prev // 如果当前节点没有后一个节点，说明是尾节点，更新尾节点
    }
  }

  // 移除尾节点
  private removeTail(): void {
    if (this.tail !== null) {
      this.cache.delete(this.tail.key) // 从哈希表中删除尾节点
      this.removeNode(this.tail) // 从链表中移除尾节点
    }
  }

  // 判断缓存中是否存在某个键
  has(key: string): boolean {
    return this.cache.has(key)
  }

  // 从缓存中删除某个键值对
  remove(key: string): void {
    const node = this.cache.get(key)
    if (node) {
      this.removeNode(node)
      this.cache.delete(key)
    }
  }
}
