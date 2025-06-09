import { DomManager } from '@/core/dom/DomManager'
import { EnvConfig } from '@/core/store/env/EnvConfig'
import { SystemConfig } from '@/core/store/system/SystemConfig'
import { Point } from '@/core/utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'

export enum CursorState {
  CROSSWITHSQUARE = 'CROSSWITHSQUARE', // 十字标携带中间小方形
  NONE = 'NONE', // 没有标识，例如框选过程中、文本编辑中
  CROSS = 'CROSS', // 十字标(不携带中间小方形)
  SQUARE = 'SQUARE', // 小方形
  DRAGGING = 'DRAGGING', // 拖拽
}

@injectable()
export class InteractionVisual {
  @inject(DomManager) private domManager!: DomManager
  @inject(EnvConfig) private envConfig!: EnvConfig
  @inject(SystemConfig) private systemConfig!: SystemConfig
  private renderWorker!: Worker
  private canvas!: HTMLCanvasElement

  // canvas初始化
  public init(): void {
    this.canvas = this.domManager.interactionCanvas
    this.canvas.width = Math.ceil(this.canvas.offsetWidth * this.envConfig.dpr)
    this.canvas.height = Math.ceil(this.canvas.offsetHeight * this.envConfig.dpr)
    const offscreen = this.canvas.transferControlToOffscreen()
    this.renderWorker = new Worker(new URL('../render/canvas/InteractionRender', import.meta.url), {
      type: 'module',
      name: 'visual',
    })
    this.renderWorker.postMessage(
      {
        event: 'INIT',
        canvas: offscreen,
        dpr: this.envConfig.dpr,
        crossLength: this.systemConfig.crossLength,
        squareLength: this.systemConfig.squareLength,
        snapSize: this.systemConfig.snapSize,
        ghostClearCompensation: this.envConfig.ghostClearCompensation,
      },
      [offscreen],
    )
  }

  // 绘制光标
  public drawCursor(cursorState: CursorState | null, point: Point): void {
    if (cursorState === CursorState.NONE) {
      if (this.canvas.style.cursor !== 'none') {
        this.canvas.style.cursor = 'none'
      }
    } else if (cursorState === CursorState.DRAGGING) {
      if (this.canvas.style.cursor !== 'grabbing') {
        this.canvas.style.cursor = 'grabbing'
      }
    } else {
      if (this.canvas.style.cursor !== 'none') {
        this.canvas.style.cursor = 'none'
      }
      this.renderWorker.postMessage({
        event: 'DRAWCURSOR',
        cursorState,
        point,
      })
    }
  }

  // 绘制选择框
  public drawSelectRect(startPoint: Point, endPoint: Point): void {
    this.renderWorker.postMessage({
      event: 'DRAWSELECTRECT',
      startPoint,
      endPoint,
    })
  }

  // 清除光标和选择框绘制
  public clearCursorAndSelectRect(cursorState: CursorState | null, startPoint: Point, endPoint: Point): void {
    this.renderWorker.postMessage({
      event: 'CLEARCURSORANDSELECTRECT',
      cursorState,
      startPoint,
      endPoint,
    })
  }

  // 清除所有
  public clearAllShapes(): void {
    this.renderWorker.postMessage({
      event: 'CLEARALLSHAPES',
    })
  }

  public drawEndpoint(coordinate: Point, strokeStyle = '#F2D378') {
    this.renderWorker.postMessage({
      event: 'DRAWENDPOINT',
      coordinate,
      strokeStyle,
    })
  }

  public drawMidpoint(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWMIDPOINT',
      coordinate,
    })
  }

  public drawPerpendicular(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWPERPENDICULAR',
      coordinate,
    })
  }

  public drawInsertionPoint(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWINSERTIONPOINT',
      coordinate,
    })
  }

  public drawTangency(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWTANGENCY',
      coordinate,
    })
  }
  public drawQuadrant(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWQUADRANT',
      coordinate,
    })
  }

  public drawClosest(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWCLOSEST',
      coordinate,
    })
  }

  public drawIntersection(coordinate: Point) {
    this.renderWorker.postMessage({
      event: 'DRAWINTERSECTION',
      coordinate,
    })
  }
}
