import { IShape, MetaEntityType, type IEntityTemp } from '@/core/data/DataManager'
import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'
import { deepCopy, isNumArray } from '@/core/utils/utils'
import { Point } from '@/core/utils/math/ComputGeometry'
import { ArcCalculator, CanvasArcParams } from '@/core/utils/math/ArcCalculator'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class PLINE extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '多段线绘制'
  private currentCommandStateStr = '' // 命令状态
  private interactionDataArr: {
    commandStateStr: string
    data: any
  }[] = []
  private queue = new MessageQueue(new ExecuteLatestStrategy())
  private addTask = () => {
    this.queue.addTask(this.drawInteractionShape)
  }
  private drawShapeItemType = MetaEntityType.LINE
  private entityTemp: IEntityTemp = {
    type: this.constructor.name as MetaEntityType,
    shape: [],
  }
  protected rule: ICommandRule = {
    action: () => {
      this.currentCommandStateStr = ''
      this.interactionDataArr = []
      this.mouse.addEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
      this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
    },
    msg: '多段线',
    next: ['POINT1'],
    subCommand: {
      POINT1: {
        action: (point: Point) => {
          if (isNumArray(point)) {
            this.interactionDataArr[0] = {
              commandStateStr: 'POINT1',
              data: {
                point,
              },
            }
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '起点',
        next: ['POINT2', 'A', 'L', 'H', 'U', 'W'], // 下一点、圆弧、半宽、长度、放弃、宽度
      },
      POINT2: {
        action: (point: Point) => {
          if (isNumArray(point)) {
            this.interactionDataArr[1] = {
              commandStateStr: 'POINT2',
              data: {
                point,
              },
            }
            if (this.interactionDataArr.length === 2) {
              this.entityTemp.shape.push(this.creatNewShapeItem(this.interactionDataArr[1].data.point))
              this.clearInteractionShape()
              // 重置状态，并且设置上次的最后一个节点为第一个节点
              this.interactionDataArr = [this.interactionDataArr[1]]
            }
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '指定下一点',
        next: ['POINT2', 'A', 'C', 'H', 'L', 'U', 'W'], // 下一点、圆弧、闭合、半宽、长度、放弃、宽度
      },
      L: {
        action: () => {
          this.drawShapeItemType = MetaEntityType.LINE
        },
        msg: '绘制线段',
        next: ['POINT2'],
      },
      A: {
        action: () => {
          this.drawShapeItemType = MetaEntityType.ARC
        },
        msg: '绘制圆弧',
        next: ['POINT2'],
      },
    },
  }

  // 创建一个元图形
  private creatNewShapeItem(point: Point): IShape {
    if (this.drawShapeItemType === MetaEntityType.LINE) {
      return {
        type: MetaEntityType.LINE,
        points: [this.interactionDataArr[0].data.point, point],
      }
    } else if (this.drawShapeItemType === MetaEntityType.ARC) {
      const lastShapeItem = this.entityTemp.shape[this.entityTemp.shape.length - 1]
      if (lastShapeItem && lastShapeItem.type === MetaEntityType.LINE && lastShapeItem.points?.length === 2) {
        return {
          type: MetaEntityType.ARC,
          ...ArcCalculator.fromTangencyLine(lastShapeItem.points[0] as Point, lastShapeItem.points[1] as Point, point).getCanvasArcParams(),
        }
      } else if (lastShapeItem && lastShapeItem.type === MetaEntityType.ARC && lastShapeItem.points && lastShapeItem.r) {
        return {
          type: MetaEntityType.ARC,
          ...ArcCalculator.fromTangencyArc(lastShapeItem as unknown as CanvasArcParams, point).getCanvasArcParams(),
        }
      }
    }
    // 处理未匹配到的情况
    throw new Error('Unsupported shape type')
  }

  // 绘制临时交互图形
  private drawInteractionShape = (): void => {
    const interactionEnties = []
    // 绘制线段
    const refline = {
      type: MetaEntityType.LINE,
      shape: [
        {
          type: MetaEntityType.LINE,
          points: [] as number[][],
        },
      ],
    }
    if (this.interactionDataArr.length === 1) {
      refline.shape[refline.shape.length - 1].points[0] = this.interactionDataArr[0].data.point
      refline.shape[refline.shape.length - 1].points[1] = [this.mouse.mouseX, this.mouse.mouseY]
    }
    interactionEnties.push(refline)
    // 绘制最后多段线
    if (this.interactionDataArr.length === 1) {
      const refPline = deepCopy(this.entityTemp)
      refPline.shape.push(this.creatNewShapeItem([this.mouse.mouseX, this.mouse.mouseY]))
      interactionEnties.push(refPline)
    }

    // 开始渲染
    this.clearInteractionShape()
    this.guide.render(interactionEnties).then(() => {
      if (!this.isRunning) {
        this.clearInteractionShape()
      }
    })
  }

  // 清除临时交互图形
  private clearInteractionShape(): void {
    this.guide.clearAll()
  }

  protected dispose() {
    this.clearInteractionShape()
    this.mouse.removeEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
    this.mouse.removeEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
  }
}
