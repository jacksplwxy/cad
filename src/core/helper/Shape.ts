import { type IEntity, MetaEntityType, type IShape, type IEntityTemp } from '../data/DataManager'

export class Shape {
  private readonly ctx!: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  constructor(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    this.ctx = ctx
  }

  public createBatch(entityArr: Array<IEntity | IEntityTemp>): void {
    entityArr.forEach((entity) => {
      this.create(entity)
    })
  }

  public create(entity: IEntity | IEntityTemp): void {
    switch (entity.type) {
      case MetaEntityType.LINE: {
        this.createMetaShape(entity.shape[0])
        break
      }
      case MetaEntityType.MTEXT: {
        this.createMetaShape(entity.shape[0])
        break
      }
      case MetaEntityType.CIRCLE: {
        this.createMetaShape(entity.shape[0])
        break
      }
      case MetaEntityType.ARC: {
        this.createMetaShape(entity.shape[0])
        break
      }
      case MetaEntityType.PLINE: {
        entity.shape.forEach((shape: IShape) => {
          this.createMetaShape(shape)
        })
        break
      }
    }
  }

  public createMetaShape(shape: IShape): void {
    switch (shape.type) {
      case MetaEntityType.LINE: {
        this.line(shape)
        break
      }
      case MetaEntityType.MTEXT: {
        this.mtext(shape)
        break
      }
      case MetaEntityType.CIRCLE: {
        this.circle(shape)
        break
      }
      case MetaEntityType.ARC: {
        this.arc(shape)
        break
      }
    }
  }

  private line(shape: IShape): void {
    const points = shape.points as number[][]
    if (points.length < 2) {
      return
    }
    this.ctx.save()
    this.setStyle(shape)
    const x1: number = points[0][0]
    const y1: number = points[0][1]
    const x2: number = points[1][0]
    const y2: number = points[1][1]
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  }
  private mtext(shape: IShape): void {
    const points = shape.points as number[][]
    if (points.length < 2) {
      return
    }
    this.ctx.save()
    this.setStyle(shape)
    const x1: number = points[0][0]
    const y1: number = points[0][1]
    const x2: number = points[1][0]
    const y2: number = points[1][1]
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.lineTo(x1, y2)
    this.ctx.lineTo(x1, y1)
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  }

  private circle(shape: IShape): void {
    const points = shape.points as number[][]
    if (points.length < 1) {
      return
    }
    this.ctx.save()
    this.setStyle(shape)
    const x: number = points[0][0]
    const y: number = points[0][1]
    const radius: number = shape.r as number
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  }

  private arc(shape: IShape): void {
    const points = shape.points as number[][]
    const x: number = points[0][0]
    const y: number = points[0][1]
    const radius: number = shape.r as number
    const startAngle = shape.startAngle as number
    const endAngle = shape.endAngle as number
    const anticlockwise = shape.anticlockwise
    if (!points || points.length !== 1 || radius === undefined || startAngle === undefined || endAngle === undefined) {
      throw new Error('Invalid shape data')
    }
    this.ctx.save()
    this.setStyle(shape)
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  }

  private setStyle(shape: IShape): void {
    if (shape.color) {
      this.ctx.strokeStyle = shape.color
    }
    if (shape.lineWidth) {
      this.ctx.lineWidth = shape.lineWidth
    }
    if (shape.lineDash) {
      this.ctx.setLineDash(shape.lineDash)
    }
  }
}
