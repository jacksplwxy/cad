import { injectable } from 'inversify'
import { Layer, type ILayer } from './Layer'

@injectable()
export class LayerContainer {
  private readonly list: ILayer[] = []

  // 设置构造函数private，防止new实例化
  public constructor() {
    this.layerInit()
  }

  private layerInit(): void {
    if (this.list.length === 0) {
      this.addLayer()
    }
  }

  // 获取全部图层
  public getList(): ILayer[] {
    const layers = this.list
    if (layers.length === 0) {
      throw new Error('没有任何图层存在！')
    }
    return layers
  }

  // 获取当前图层
  public getCurrentLayer(): ILayer {
    let layer = this.list.find((item) => {
      return item.status
    })
    try {
      if (layer == null) {
        throw new Error('出现没有status为true的情况')
      }
    } catch (error) {
      this.list[0].status = true
      layer = this.list[0]
    }
    return layer
  }

  // 添加单个图层
  public addLayer(): void {
    const layer: ILayer = new Layer()
    this.list.push(layer)
  }

  // 根据index移除图层
  public removeLayerByIndex(indexToRemove: number): ILayer[] {
    if (indexToRemove > -1 && indexToRemove < this.list.length) {
      this.list.splice(indexToRemove, 1)
    } else {
      throw new Error('无效的索引。')
    }
    return this.list
  }

  // 根据图层id移除图层
  public removeLayerById(id: string): ILayer[] {
    if (this.list.length === 1 && this.list[0].id === id) {
      return this.list
    } else {
      return this.list.filter((item) => item.id !== id)
    }
  }

  // 将指定图层id设置为当前
  public setLayerStatus(id: string): void {
    // 取消原来图层
    this.list.some((item: ILayer) => {
      if (item.id === id) {
        item.status = false
        return true
      } else {
        return false
      }
    })
    // 设置新图层
    this.list.some((item: ILayer) => {
      if (item.id === id) {
        item.status = true
        return true
      } else {
        return false
      }
    })
  }

  // 删除图层,并返回删除后的结果
  public delLayersByIds(idArr: string[]): ILayer[] {
    return this.list.filter((item) => !idArr.includes(item.id))
  }
}
