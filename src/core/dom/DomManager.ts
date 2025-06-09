import { VisualCanvasId } from '../enum/common'
import { injectable } from 'inversify'

@injectable()
export class DomManager {
  public domContainer!: HTMLDivElement
  public interactionCanvas!: HTMLCanvasElement
  public commandCanvas!: HTMLCanvasElement
  public dataCanvas!: HTMLCanvasElement

  public constructor() {}

  public init(domContainer: HTMLDivElement): void {
    this.domContainer = domContainer
    if (!this.isPositionAbsolute(this.domContainer)) {
      throw new Error('CAD domContainer must be position absolute !')
    }
    // 创建并初始化 canvas 元素
    this.interactionCanvas = this.createCanvas(VisualCanvasId.InteractionVisual)
    this.commandCanvas = this.createCanvas(VisualCanvasId.CommandVisual)
    this.dataCanvas = this.createCanvas(VisualCanvasId.DataVisual)
    // 将 canvas 添加到容器
    this.domContainer.appendChild(this.dataCanvas)
    this.domContainer.appendChild(this.commandCanvas)
    this.domContainer.appendChild(this.interactionCanvas)
  }

  // 创建 canvas 元素并设置样式
  private createCanvas(id: VisualCanvasId): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.id = id
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.cursor = 'none'
    switch (id) {
      case VisualCanvasId.InteractionVisual:
        canvas.style.backgroundColor = 'transparent'
        canvas.style.zIndex = '3'
        break
      case VisualCanvasId.CommandVisual:
        canvas.style.backgroundColor = 'transparent'
        canvas.style.zIndex = '2'
        break
      case VisualCanvasId.DataVisual:
        canvas.style.backgroundColor = '#000'
        canvas.style.zIndex = '1'
        break
    }
    return canvas
  }

  private isPositionAbsolute(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element)
    return computedStyle.position === 'absolute'
  }
}
