import { injectable } from 'inversify'

@injectable()
export class ShapeIdManager {
  private readonly idPool: Record<string, boolean> = {}

  // 创建唯一id
  public createId(): string {
    let id = this.createOnceId()
    while (this.idPool[id]) {
      id = this.createOnceId()
    }
    this.idPool[id] = true
    return id
  }

  private createOnceId(): string {
    return Array(3)
      .fill(0)
      .map(() => Math.ceil(Math.random() * 255))
      .concat(255)
      .join('-')
  }

  public deleteId(id: string): void {
    delete this.idPool[id]
  }
}
