import '@abraham/reflection'
import { CursorState } from '@/core/visual/InteractionVisual'
import { Point } from '@/core/utils/math/ComputGeometry'

class Interaction {
  private osCtx!: OffscreenCanvasRenderingContext2D
  private dpr!: number
  private snapSize!: number
  private crossLength!: number
  private squareLength!: number
  private ghostClearCompensation!: number
  private crosshairImageDataInfo = new Map()

  constructor() {
    this.addEventListenerInit()
  }
  // 监听主线程的消息初始化
  private addEventListenerInit(): void {
    self.addEventListener('message', (e: MessageEvent): void => {
      const workerMsg = e.data || {}
      switch (workerMsg.event) {
        case 'INIT': {
          this.dpr = workerMsg.dpr
          this.snapSize = workerMsg.snapSize
          this.crossLength = workerMsg.crossLength
          this.squareLength = workerMsg.squareLength
          this.ghostClearCompensation = workerMsg.ghostClearCompensation
          const offscreenCanvas = workerMsg.canvas
          this.osCtx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D
          this.osCtx.strokeStyle = '#fff'
          this.osCtx.lineWidth = 1 * this.dpr
          this.osCtx.save()
          this.crosshairImageDataInfoInit()
          break
        }
        case 'DRAWCURSOR': {
          this.drawCursor(workerMsg.cursorState, workerMsg.point)
          break
        }
        case 'DRAWSELECTRECT': {
          this.drawSelectRect(workerMsg.startPoint, workerMsg.endPoint)
          break
        }
        case 'CLEARCURSORANDSELECTRECT': {
          this.clearCursorAndSelectRect(workerMsg.cursorState, workerMsg.startPoint, workerMsg.endPoint)
          break
        }
        case 'CLEARALLSHAPES': {
          this.clearAllShapes()
          break
        }
        case 'DRAWENDPOINT': {
          this.drawEndpoint(workerMsg.coordinate, workerMsg.strokeStyle)
          break
        }
        case 'DRAWMIDPOINT': {
          this.drawMidpoint(workerMsg.coordinate)
          break
        }
        case 'DRAWQUADRANT': {
          this.drawQuadrant(workerMsg.coordinate)
          break
        }
        case 'DRAWPERPENDICULAR': {
          this.drawPerpendicular(workerMsg.coordinate)
          break
        }
        case 'DRAWINSERTIONPOINT': {
          this.drawInsertionPoint(workerMsg.coordinate)
          break
        }
        case 'DRAWTANGENCY': {
          this.drawTangency(workerMsg.coordinate)
          break
        }
        case 'DRAWCLOSEST': {
          this.drawClosest(workerMsg.coordinate)
          break
        }
        case 'DRAWINTERSECTION': {
          this.drawIntersection(workerMsg.coordinate)
          break
        }
      }
    })
  }

  private crosshairImageDataInfoInit(): void {
    this.crosshairImageDataInfo.set(CursorState.NONE, CursorState.NONE)
    this.crosshairImageDataInfo.set(CursorState.DRAGGING, CursorState.DRAGGING)

    const crossLengthHalf = this.crossLength / 2
    const squareLengthHalf = this.squareLength / 2

    // 清空画布以确保没有残影
    this.osCtx.clearRect(0, 0, this.crossLength, this.crossLength)

    // 十字标
    this.osCtx.beginPath()
    this.osCtx.moveTo(0, crossLengthHalf)
    this.osCtx.lineTo(this.crossLength, crossLengthHalf)
    this.osCtx.moveTo(crossLengthHalf, this.crossLength)
    this.osCtx.lineTo(crossLengthHalf, 0)
    this.osCtx.stroke()
    let imageData = this.osCtx.getImageData(0, 0, this.crossLength, this.crossLength)
    this.crosshairImageDataInfo.set(CursorState.CROSS, imageData)

    // 清除当前路径
    this.osCtx.clearRect(0, 0, this.crossLength, this.crossLength)

    // 小方块 (只绘制小方块，去掉十字标)
    this.osCtx.beginPath() // 开始一个新的路径
    this.osCtx.moveTo(crossLengthHalf - squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf + squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf + squareLengthHalf, crossLengthHalf + squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf - squareLengthHalf, crossLengthHalf + squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf - squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.stroke()
    imageData = this.osCtx.getImageData(0, 0, this.crossLength, this.crossLength)
    this.crosshairImageDataInfo.set(CursorState.SQUARE, imageData)

    // 清除当前路径
    this.osCtx.clearRect(0, 0, this.crossLength, this.crossLength)

    // 十字标+小方块
    this.osCtx.beginPath()
    this.osCtx.moveTo(0, crossLengthHalf)
    this.osCtx.lineTo(this.crossLength, crossLengthHalf)
    this.osCtx.moveTo(crossLengthHalf, this.crossLength)
    this.osCtx.lineTo(crossLengthHalf, 0)
    this.osCtx.moveTo(crossLengthHalf - squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf + squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf + squareLengthHalf, crossLengthHalf + squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf - squareLengthHalf, crossLengthHalf + squareLengthHalf)
    this.osCtx.lineTo(crossLengthHalf - squareLengthHalf, crossLengthHalf - squareLengthHalf)
    this.osCtx.stroke()
    imageData = this.osCtx.getImageData(0, 0, this.crossLength, this.crossLength)
    this.crosshairImageDataInfo.set(CursorState.CROSSWITHSQUARE, imageData)
    // 清除当前路径
    this.osCtx.clearRect(0, 0, this.crossLength, this.crossLength)
  }

  // 绘制光标
  public drawCursor(cursorState: CursorState | null, point: Point): void {
    const crosshairImageData = this.crosshairImageDataInfo.get(cursorState)
    if (crosshairImageData) {
      this.osCtx.putImageData(crosshairImageData, point[0] - this.crossLength / 2, point[1] - this.crossLength / 2)
    }
  }

  // 绘制选择框
  public drawSelectRect(startPoint: Point, endPoint: Point): void {
    this.osCtx.save()
    const x = startPoint[0]
    const y = startPoint[1]
    const width = endPoint[0] - x
    const height = endPoint[1] - y
    if (width > 0) {
      this.osCtx.fillStyle = 'rgba(30, 30, 140, 0.3)'
    } else {
      this.osCtx.fillStyle = 'rgba(10, 230, 10, 0.3)'
      this.osCtx.setLineDash([5, 5])
    }
    this.osCtx.strokeRect(x, y, width, height)
    this.osCtx.fillRect(x, y, width, height)
    this.osCtx.restore()
  }

  // 清除光标
  private clearCursor(point: Point): void {
    this.osCtx.clearRect(
      point[0] - this.crossLength / 2 - this.ghostClearCompensation,
      point[1] - this.crossLength / 2 - this.ghostClearCompensation,
      this.crossLength + 2 * this.ghostClearCompensation,
      this.crossLength + 2 * this.ghostClearCompensation,
    )
  }

  // 清除选择框
  private clearSelectRect(startPoint: Point, endPoint: Point): void {
    // 残影补偿
    let compensationX = this.ghostClearCompensation
    let compensationY = this.ghostClearCompensation
    let x = startPoint[0]
    let y = startPoint[1]
    let width = endPoint[0] - x
    let height = endPoint[1] - y
    if (width < 0) {
      compensationX *= -1
    }
    if (height < 0) {
      compensationY *= -1
    }
    x -= compensationX
    y -= compensationY
    width += 2 * compensationX
    height += 2 * compensationY
    this.osCtx.clearRect(x, y, width, height)
  }

  // 清除光标和选择框绘制
  public clearCursorAndSelectRect(cursorState: CursorState | null, startPoint: Point, endPoint: Point): void {
    this.clearCursor(endPoint)
    switch (cursorState) {
      case CursorState.NONE: {
        this.clearSelectRect(startPoint, endPoint)
        break
      }
    }
  }

  // 清除所有
  public clearAllShapes(): void {
    this.osCtx.clearRect(0, 0, this.osCtx.canvas.width, this.osCtx.canvas.height)
  }

  // 绘制端点
  private drawEndpoint(coordinate: Point, strokeStyle = '#F2D378'): void {
    const [x, y] = coordinate
    this.osCtx.save()
    this.osCtx.strokeStyle = strokeStyle
    this.osCtx.beginPath()
    this.osCtx.moveTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.closePath()
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制中点
  private drawMidpoint(coordinate: Point): void {
    const [x, y] = coordinate
    // 绘制交互图标
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.closePath()
    this.osCtx.stroke()
    this.osCtx.restore()
  }
  // 绘制象限点
  private drawQuadrant(coordinate: Point): void {
    const [x, y] = coordinate
    // 绘制交互图标
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y)
    this.osCtx.lineTo(x, y + this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y)
    this.osCtx.closePath()
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制垂足
  private drawPerpendicular(coordinate: Point): void {
    const [x, y] = coordinate
    // 绘制交互图标
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x - this.snapSize / 2, y)
    this.osCtx.lineTo(x, y)
    this.osCtx.lineTo(x, y + this.snapSize / 2)
    this.osCtx.moveTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制插入点
  private drawInsertionPoint(coordinate: Point): void {
    const [x, y] = coordinate
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x + 2, y - this.snapSize / 2) // 横1
    this.osCtx.lineTo(x + 2, y - 2) // 竖1
    this.osCtx.lineTo(x + this.snapSize / 2, y - 2) // 横2
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2) // 竖2
    this.osCtx.lineTo(x - 2, y + this.snapSize / 2) // 横3
    this.osCtx.lineTo(x - 2, y + 2) // 竖3
    this.osCtx.lineTo(x - this.snapSize / 2, y + 2) // 横4
    this.osCtx.closePath() // 竖4
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制切点
  private drawTangency(coordinate: Point): void {
    const [x, y] = coordinate
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.arc(x, y, this.snapSize / 2, 0, Math.PI * 2)
    this.osCtx.closePath()
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制最近点
  private drawClosest(coordinate: Point): void {
    const [x, y] = coordinate
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.closePath()
    this.osCtx.stroke()
    this.osCtx.restore()
  }

  // 绘制交点
  private drawIntersection(coordinate: Point): void {
    const [x, y] = coordinate
    this.osCtx.save()
    this.osCtx.strokeStyle = '#F2D378'
    this.osCtx.beginPath()
    this.osCtx.moveTo(x - this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x + this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.moveTo(x + this.snapSize / 2, y - this.snapSize / 2)
    this.osCtx.lineTo(x - this.snapSize / 2, y + this.snapSize / 2)
    this.osCtx.stroke()
    this.osCtx.restore()
  }
}

new Interaction()
