import { type IEntityTemp, type IEntity } from '../data/DataManager'
import { inject, injectable, postConstruct } from 'inversify'
import { EnvConfig } from '../store/env/EnvConfig'
import { DomManager } from '@/core/dom/DomManager'
import { IView, Mouse } from '@/core/interaction/Mouse'

@injectable()
export class CommandVisual {
  @inject(EnvConfig) private envConfig!: EnvConfig
  @inject(DomManager) private domManager!: DomManager
  @inject(Mouse) private mouse!: Mouse
  private renderWorker!: Worker
  private processRenderResolve: ((data?: any) => void) | null = null

  @postConstruct()
  public init() {
    this.canvasInit()
    this.workerListenerInit()
  }

  public canvasInit(): void {
    const canvas: HTMLCanvasElement = this.domManager.commandCanvas
    canvas.width = Math.ceil(canvas.offsetWidth * this.envConfig.dpr)
    canvas.height = Math.ceil(canvas.offsetHeight * this.envConfig.dpr)
    // 创建离屏Canvas并传递给Worker
    const offscreen = canvas.transferControlToOffscreen()
    this.renderWorker = new Worker(new URL('../render/canvas/CommandRender', import.meta.url), {
      type: 'module',
      name: 'visual',
    })
    this.renderWorker.postMessage({ event: 'INIT', canvas: offscreen, dpr: this.envConfig.dpr }, [offscreen])
  }

  private workerListenerInit(): void {
    this.renderWorker.addEventListener('message', (event) => {
      if (event.data?.event === 'PROCESSRENDERFINISHED') {
        this.processRenderResolve?.(event.data) // 触发 Promise 结束
        this.processRenderResolve = null
      }
    })
  }

  // 图形创建
  public render(entityArr: Array<IEntity | IEntityTemp>, viewInfo?: IView): Promise<void> {
    if (!viewInfo) {
      const { a, b, c, d, e, f } = this.mouse.visualWorkerView
      viewInfo = { a, b, c, d, e, f } // { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    }
    return new Promise((resolve) => {
      this.processRenderResolve = resolve
      this.renderWorker.postMessage({
        event: 'PROCESSRENDER',
        entityArr,
        viewInfo,
        stopPrevProcessRender: true, // 是否终止上一次渐进渲染
      })
    })
  }

  // 清除ctx上的所有区域
  public clearAll(): void {
    this.renderWorker.postMessage({
      event: 'CLEAR',
      clearArea: [
        [0, 0],
        [this.domManager.dataCanvas.width, this.domManager.dataCanvas.height],
      ],
    })
  }
}
