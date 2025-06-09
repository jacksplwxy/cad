import '@abraham/reflection'
import { Shape } from '@/core/helper/Shape'
import { IEntity, IEntityTemp, MetaEntityType } from '@/core/data/DataManager'
import { ArcCalculator } from '@/core/utils/math/ArcCalculator'
import { IView } from '@/core/interaction/Mouse'
import { IAABB } from '@/core/helper/BoundingBox'

export class Render {
  private offscreenCanvas!: OffscreenCanvas
  private osCtx!: OffscreenCanvasRenderingContext2D
  private dpr!: number
  private selectedNodeSize!: number
  private shape!: Shape
  private isProgressiveRenderRunning = false //渐进式渲染是否正在执行中
  private canProgressiveRenderBeStop = false //渐进式渲染是否可以被终止
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
          this.selectedNodeSize = workerMsg.selectedNodeSize || 12
          this.offscreenCanvas = workerMsg.canvas
          this.osCtx = this.offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D
          this.osCtx.strokeStyle = '#fff'
          this.osCtx.lineWidth = 1 * this.dpr
          this.osCtx.save()
          this.shapeInit()
          break
        }
        case 'RENDER': {
          this.renderEntityArr(workerMsg)
          break
        }
        case 'PROCESSRENDER': {
          if (this.isProgressiveRenderRunning && workerMsg.stopPrevProcessRender) {
            this.canProgressiveRenderBeStop = true
          } else {
            this.canProgressiveRenderBeStop = false
          }
          this.progressiveRender(workerMsg)
          break
        }
        case 'CLEAR': {
          if (Array.isArray(workerMsg.clearArea)) {
            this.clearRect(workerMsg.clearArea)
          }
        }
      }
    })
  }

  // shape初始化
  private shapeInit(): void {
    this.shape = new Shape(this.osCtx)
  }

  // 一次性渲染
  private renderEntityArr(request: any): void {
    const { a, b, c, d, e, f } = request.viewInfo
    this.osCtx.setTransform(a, b, c, d, e, f)
    // 保持绘制线宽不随坐标变换
    this.osCtx.lineWidth = this.dpr / a
    const entityArr = request.entityArr
    const scaleA = 1 / a
    const scaleD = 1 / d
    for (const entity of entityArr) {
      if (entity.other) {
        const { collisioned, boxSelected } = entity.other
        if (collisioned || boxSelected) {
          const lineDash = collisioned ? [scaleA, 3 * scaleD] : [5 * scaleA, 5 * scaleD]
          for (const shape of entity.shape) {
            shape.lineDash = lineDash
          }
        }
      }
    }

    try {
      // 渲染到离屏Canvas
      this.shape.createBatch(entityArr)
    } catch (error) {
      throw new Error('visual绘制异常！')
    }

    if (request.renderShapeSelectedNode) {
      this.drawShapeSelectedNode(entityArr, request.viewInfo)
    }
  }

  // 渐进渲染
  private progressiveRender(request: any): void {
    const { a, b, c, d, e, f } = request.viewInfo
    this.osCtx.setTransform(a, b, c, d, e, f)
    // 保持绘制线宽不随坐标变换
    this.osCtx.lineWidth = this.dpr / a
    const entityArr = request.entityArr
    const scaleA = 1 / a
    const scaleD = 1 / d
    for (const entity of entityArr) {
      if (entity.other) {
        const { collisioned, boxSelected } = entity.other
        if (collisioned || boxSelected) {
          const lineDash = collisioned ? [scaleA, 3 * scaleD] : [5 * scaleA, 5 * scaleD]
          for (const shape of entity.shape) {
            shape.lineDash = lineDash
          }
        }
      }
    }

    let stepNum = 1000 // 初始批次大小
    const targetFrameTime = 16 // 目标帧时间（16ms，对应60FPS）
    let currentIndex = 0
    this.isProgressiveRenderRunning = true
    const step = (): void => {
      if (this.canProgressiveRenderBeStop) {
        //@wxy：这里应该是清空已绘制的图形区域
        // this.clearRect(this.getEntitiesAABB(entityArr.slice(0, currentIndex)))
        this.isProgressiveRenderRunning = false
        this.canProgressiveRenderBeStop = false
        self.postMessage({ event: 'PROCESSRENDERFINISHED' })
        return
      }
      const startTime = performance.now()
      const beRenderEntityArr = entityArr.slice(currentIndex, currentIndex + stepNum)
      currentIndex += beRenderEntityArr.length
      this.shape.createBatch(beRenderEntityArr)
      const elapsedTime = performance.now() - startTime
      // 动态调整单次渲染批次大小
      if (elapsedTime > targetFrameTime) {
        stepNum = Math.max(100, Math.floor(stepNum * 0.85))
      } else {
        stepNum = Math.min(3000, Math.floor(stepNum * 1.15))
      }
      if (currentIndex < entityArr.length) {
        requestAnimationFrame(step)
      } else {
        this.isProgressiveRenderRunning = false
        this.canProgressiveRenderBeStop = false
        self.postMessage({ event: 'PROCESSRENDERFINISHED' })
      }
    }
    step()
  }

  // 绘制图形选中节点
  private drawShapeSelectedNode(entityArr: Array<IEntity | IEntityTemp>, viewInfo: IView): void {
    entityArr.forEach((entity) => {
      if (entity.other?.boxSelected) {
        entity.shape.forEach((shapeItem) => {
          switch (shapeItem.type) {
            case MetaEntityType.LINE: {
              // 绘制线段的端点
              shapeItem.points?.forEach((point) => {
                this.drawSelectedNode(point, viewInfo)
              })
              // 绘制线段的中点
              if (shapeItem.points && shapeItem.points.length >= 2) {
                const centerPoint = [(shapeItem.points[1][0] + shapeItem.points[0][0]) / 2, (shapeItem.points[1][1] + shapeItem.points[0][1]) / 2]
                this.drawSelectedNode(centerPoint, viewInfo)
              }
              break
            }
            case MetaEntityType.MTEXT: {
              // 绘制线段的端点
              let allPoints: number[][] = []
              if (Array.isArray(shapeItem.points)) {
                allPoints = [shapeItem.points[0], [shapeItem.points[1][0], shapeItem.points[0][1]], shapeItem.points[1], [shapeItem.points[0][0], shapeItem.points[1][1]]]
              }
              allPoints.forEach((point) => {
                this.drawSelectedNode(point, viewInfo)
              })
              break
            }
            case MetaEntityType.CIRCLE: {
              if (Array.isArray(shapeItem.points) && shapeItem.r) {
                // 绘制圆心
                const centerPoint = shapeItem.points[0]
                this.drawSelectedNode(centerPoint, viewInfo)
                // 绘制4个象限点
                this.drawSelectedNode([centerPoint[0] + shapeItem.r, centerPoint[1]], viewInfo)
                this.drawSelectedNode([centerPoint[0], centerPoint[1] - shapeItem.r], viewInfo)
                this.drawSelectedNode([centerPoint[0] - shapeItem.r, centerPoint[1]], viewInfo)
                this.drawSelectedNode([centerPoint[0], centerPoint[1] + shapeItem.r], viewInfo)
              }
              break
            }
            case MetaEntityType.ARC: {
              if (Array.isArray(shapeItem.points) && shapeItem.r && shapeItem.startAngle && shapeItem.endAngle) {
                const arcCalculator = ArcCalculator.fromShape(shapeItem)
                // 绘制圆心
                const centerPoint = shapeItem.points[0]
                this.drawSelectedNode(centerPoint, viewInfo)
                // 绘制弧长起点、中点和终点
                this.drawSelectedNode(arcCalculator.getArcLengthStartPoint(), viewInfo)
                this.drawSelectedNode(arcCalculator.getArcLengthCenterPoint(), viewInfo)
                this.drawSelectedNode(arcCalculator.getArcLengthEndPoint(), viewInfo)
              }
              break
            }
          }
        })
      }
    })
  }

  // 绘制节点
  private drawSelectedNode(point: number[], viewInfo: IView): void {
    const { a, d } = viewInfo
    const width = this.selectedNodeSize / a
    const height = this.selectedNodeSize / d
    this.osCtx.save()
    this.osCtx.fillStyle = 'blue' // 设置填充颜色为蓝色
    this.osCtx.fillRect(point[0] - width / 2, point[1] - height / 2, width, height) // 绘制填充矩形
    this.osCtx.restore()
  }

  // 清除ctx上的矩形区域
  private clearRect(AABB: IAABB): void {
    const { a, d, e, f } = this.osCtx.getTransform()
    this.osCtx.clearRect((AABB[0][0] - e) / a, (AABB[0][1] - f) / d, (AABB[1][0] - AABB[0][0]) / a, (AABB[1][1] - AABB[0][1]) / d)
  }

  // 清除ctx上的所有区域
  private clearAll(): void {
    const { a, d, e, f } = this.osCtx.getTransform()
    this.osCtx.clearRect((0 - e) / a, (0 - f) / d, this.osCtx.canvas.width / a, this.osCtx.canvas.height / d)
  }
}
