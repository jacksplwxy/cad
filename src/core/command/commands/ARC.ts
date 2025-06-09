import { MetaEntityType, type IEntityTemp } from '@/core/data/DataManager'
import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'
import { Point } from '@/core/utils/math/ComputGeometry'
import { ArcCalculator } from '@/core/utils/math/ArcCalculator'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { isNumArray } from '@/core/utils/utils'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class ARC extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '圆弧绘制'
  private currentCommandStateStr = '' // 命令状态
  private interactionDataArr: {
    commandStateStr: string
    data: any
  }[] = []
  private queue = new MessageQueue(new ExecuteLatestStrategy())
  private addTask = () => {
    this.queue.addTask(this.drawInteractionShape)
  }
  protected rule: ICommandRule = {
    action: () => {
      this.currentCommandStateStr = ''
      this.interactionDataArr = []
      this.mouse.addEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
      this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
    },
    msg: '圆弧',
    next: ['POINT1'],
    subCommand: {
      POINT1: {
        action: (point: Point) => {
          this.currentCommandStateStr = 'POINT1'
          if (isNumArray(point)) {
            this.interactionDataArr[0] = {
              commandStateStr: 'POINT1',
              data: {
                point: point,
              },
            }
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '指定第1个点',
        next: ['POINT2', 'UNDO'],
      },
      POINT2: {
        action: (point: Point) => {
          this.currentCommandStateStr = 'POINT2'
          if (isNumArray(point)) {
            this.interactionDataArr[1] = {
              commandStateStr: 'POINT2',
              data: {
                point: point,
              },
            }
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '指定第2个点',
        next: ['POINT3', 'UNDO'],
      },
      POINT3: {
        action: (point: Point) => {
          this.currentCommandStateStr = 'POINT3'
          if (isNumArray(point)) {
            this.interactionDataArr[2] = {
              commandStateStr: 'POINT3',
              data: {
                point,
              },
            }
            const entityTemp: IEntityTemp = {
              type: this.constructor.name as MetaEntityType,
              shape: [
                {
                  type: this.constructor.name as MetaEntityType,
                  points: [],
                },
              ],
            }
            if (this.interactionDataArr.length === 3) {
              entityTemp.shape[0] = {
                ...entityTemp.shape[0],
                ...ArcCalculator.from3Points(
                  this.interactionDataArr.map((interactionData) => {
                    return interactionData.data.point
                  }),
                ).getCanvasArcParams(),
              }
              this.shapeCreated([entityTemp])
              this.clearInteractionShape()
            } else {
              throw new Error('交互点数量不对！')
            }
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '指定端点',
        next: [],
      },
      UNDO: this.UNDORule,
    },
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
    } else if (this.interactionDataArr.length === 2) {
      refline.shape[refline.shape.length - 1].points[0] = this.interactionDataArr[1].data.point
      refline.shape[refline.shape.length - 1].points[1] = [this.mouse.mouseX, this.mouse.mouseY]
    }
    interactionEnties.push(refline)
    // 绘制圆弧
    if (this.interactionDataArr.length === 2) {
      const refArc: IEntityTemp = {
        type: this.constructor.name as MetaEntityType,
        shape: [
          {
            type: this.constructor.name as MetaEntityType,
            points: [],
          },
        ],
      }
      const points = [
        ...this.interactionDataArr.map((interactionData) => {
          return interactionData.data.point
        }),
        [this.mouse.mouseX, this.mouse.mouseY],
      ] as Point[]
      refArc.shape[0] = { ...refArc.shape[0], ...ArcCalculator.from3Points(points).getCanvasArcParams() }
      interactionEnties.push(refArc)
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
