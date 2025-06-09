import { type IAABB } from '../helper/BoundingBox'
import { VisualCanvasId } from '../enum/common'
import { inject, injectable } from 'inversify'
import { EnvConfig } from '../store/env/EnvConfig'
import { type Node } from '../data/RTree'
import { DataManager, DataManagerEvent } from '@/core/data/DataManager'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'

@injectable()
export class RtreeVisual {
  private ctx!: CanvasRenderingContext2D
  @inject(EnvConfig) private envConfig!: EnvConfig
  @inject(DataManager) private dataManager!: DataManager
  @inject(Mouse) private mouse!: Mouse
  public rtreeVisualShow = true //是否展示R树可视化（仅用于演示）

  public init() {
    this.ctxInit()
    this.eventListenserInit()
  }

  // 获取canvas上下文
  private ctxInit(): void {
    const canvas: HTMLCanvasElement = createTransparentCanvas()
    const width = Math.ceil(canvas.offsetWidth * this.envConfig.dpr)
    const height = Math.ceil(canvas.offsetHeight * this.envConfig.dpr)
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    this.ctx.canvas.width = width
    this.ctx.canvas.height = height
    this.ctx.strokeStyle = '#f00'
    this.ctx.lineWidth = (1 * this.envConfig.dpr) / this.mouse.visualWorkerView.a
    this.ctx.save()

    // 创建一个函数来创建并设置 canvas
    function createTransparentCanvas(): HTMLCanvasElement {
      // 创建 canvas 元素
      const canvas = document.createElement('canvas')
      // 设置 canvas 的 id
      canvas.id = VisualCanvasId.RTreeVisual
      // 设置 canvas 的样式为透明
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.position = 'absolute'
      canvas.style.left = '0'
      canvas.style.top = '0'
      canvas.style.cursor = 'none'
      canvas.style.backgroundColor = 'transparent'
      canvas.style.zIndex = '1'
      // 将 canvas 插入到 .canvas-container 的最底层
      const visual = document.getElementById(VisualCanvasId.DataVisual)
      if (visual) {
        const container = visual.parentNode
        if (container) {
          container.appendChild(canvas)
        } else {
          console.error('.canvas-container not found!')
        }
      } else {
        console.error('visual not found!')
      }
      return canvas
    }
  }

  private eventListenserInit(): void {
    this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, (val) => {
      this.clearAll()
      const { a, b, c, d, e, f } = this.mouse.visualWorkerView
      this.updateView(a, b, c, d, e, f, true)
      this.updateRtreeVisual()
    })
    this.dataManager.addEventListener(DataManagerEvent.ADD, () => {
      this.updateRtreeVisual()
    })
    this.dataManager.addEventListener(DataManagerEvent.EDIT, () => {
      this.updateRtreeVisual()
    })
    this.dataManager.addEventListener(DataManagerEvent.DELETE, () => {
      this.updateRtreeVisual()
    })
  }

  // R树可视化更新
  public updateRtreeVisual(): void {
    this.clearAll()
    if (!this.rtreeVisualShow) {
      return
    }
    this.drawRTreeNode(this.dataManager.toJSON())
  }

  // 绘制R树范围
  private drawRTreeNode(node: Node): void {
    this.draw([
      [node.minX, node.minY],
      [node.maxX, node.maxY],
    ])
    if (node.leaf) return
    for (let i = 0; i < node.children.length; i++) {
      this.drawRTreeNode(node.children[i] as Node)
    }
  }

  // 清空所有
  private clearAll(): void {
    const { a, d, e, f } = this.mouse.visualWorkerView
    this.ctx.clearRect((0 - e) / a, (0 - f) / d, this.ctx.canvas.width / a, this.ctx.canvas.height / d)
  }

  // 绘制节点
  private draw(bounds: IAABB): void {
    const [startX, startY] = bounds[0]
    const [endX, endY] = bounds[1]
    this.ctx.strokeStyle = this.getRandomColor()
    this.ctx.lineWidth = (1 * this.envConfig.dpr) / this.mouse.visualWorkerView.a
    this.ctx.strokeRect(startX, startY, endX - startX, endY - startY)
  }

  // 更新视图
  private updateView(a: number, b: number, c: number, d: number, e: number, f: number, setTransform = false): void {
    if (setTransform) {
      this.ctx.setTransform(a, b, c, d, e, f)
    } else {
      this.ctx.transform(a, b, c, d, e, f)
    }
  }

  // 随机颜色
  private getRandomColor(): string {
    // 生成随机的 R、G、B 分量值
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    // 将 RGB 分量值转换为十六进制格式，并返回颜色字符串
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
  }
}
