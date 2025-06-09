/**
 * 深度管理器
 * 维护一个最深和最浅深度2个值
 * 深度只影响渲染，所以渲染顺序计算放在worker中
 * 置于最底层方法：在当前最浅深度-1
 * 置于最上层方法：在当前最深深度+1
 * 置于对象之上：图形范围内所有的图形的深度值，并排序，再对当前图形的深度加上一个能提升一个索引的最小值
 * 置于对象之下：图形范围内所有的图形的深度值，并排序，再对当前图形的深度减去一个能降低一个索引的最小值
 */
export class ZIndexManager {
  private minZIndex = 0 // 最浅深度
  private maxZIndex = 0 // 最深深度
  private zIndexMap: Map<string, number> = new Map() // 存储图形id和对应的深度

  /**
   * 获取当前最浅深度
   */
  public getMinZIndex(): number {
    return this.minZIndex
  }

  /**
   * 获取当前最深深度
   */
  public getMaxZIndex(): number {
    return this.maxZIndex
  }

  /**
   * 将图形置于最下层
   * @param id 图形id
   */
  public moveToBottom(id: string): void {
    const newZIndex = this.minZIndex - 1
    this.zIndexMap.set(id, newZIndex)
    this.minZIndex = newZIndex
  }

  /**
   * 将图形置于最上层
   * @param id 图形id
   */
  public moveToTop(id: string): void {
    const newZIndex = this.maxZIndex + 1
    this.zIndexMap.set(id, newZIndex)
    this.maxZIndex = newZIndex
  }

  /**
   * 将图形置于指定对象之上
   * @param id 图形id
   * @param targetId 目标图形id
   */
  public moveAbove(id: string, targetId: string): void {
    const targetZIndex = this.zIndexMap.get(targetId)
    if (targetZIndex !== undefined) {
      const newZIndex = targetZIndex + 1
      this.zIndexMap.set(id, newZIndex)
      if (newZIndex > this.maxZIndex) {
        this.maxZIndex = newZIndex
      }
    }
  }

  /**
   * 将图形置于指定对象之下
   * @param id 图形id
   * @param targetId 目标图形id
   */
  public moveBelow(id: string, targetId: string): void {
    const targetZIndex = this.zIndexMap.get(targetId)
    if (targetZIndex !== undefined) {
      const newZIndex = targetZIndex - 1
      this.zIndexMap.set(id, newZIndex)
      if (newZIndex < this.minZIndex) {
        this.minZIndex = newZIndex
      }
    }
  }

  /**
   * 获取图形的深度
   * @param id 图形id
   */
  public getZIndex(id: string): number | undefined {
    return this.zIndexMap.get(id)
  }
}
