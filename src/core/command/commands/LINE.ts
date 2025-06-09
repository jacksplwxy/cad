import { MetaEntityType, type IEntityTemp } from '@/core/data/DataManager'
import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'
import { Point } from '@/core/utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { isNumArray } from '@/core/utils/utils'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class LINE extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '线段绘制'
  private currentCommandStateStr = '' // 命令状态
  private interactionDataArr: {
    commandStateStr: string
    data: any
  }[] = []
  private queue = new MessageQueue(new ExecuteLatestStrategy())
  private addTask = () => {
    this.queue.addTask(this.drawInteractionShape)
  }
  private firstPoint!: Point
  protected rule: ICommandRule = {
    action: () => {
      this.currentCommandStateStr = ''
      this.interactionDataArr = []
      this.mouse.addEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
      this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
    },
    msg: '线段',
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
            this.firstPoint = this.interactionDataArr[0].data.point
          } else {
            console.log('请选择坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '指定第1点',
        next: ['POINT2', 'UNDO'],
      },
      POINT2: {
        action: (point: Point) => {
          this.currentCommandStateStr = 'POINT2'
          if (isNumArray(point)) {
            this.interactionDataArr[1] = {
              commandStateStr: 'POINT2',
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
            if (this.interactionDataArr.length === 2) {
              entityTemp.shape[0].points = this.interactionDataArr.map((interactionData) => {
                return interactionData.data.point
              })
              this.shapeCreated([entityTemp])
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
        next: ['POINT3', 'UNDO'],
      },
      POINT3: {
        action: (point: Point) => {
          this.currentCommandStateStr = 'POINT3'
          if (isNumArray(point)) {
            this.interactionDataArr[1] = {
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
            if (this.interactionDataArr.length === 2) {
              entityTemp.shape[0].points = this.interactionDataArr.map((interactionData) => {
                return interactionData.data.point
              })
              this.shapeCreated([entityTemp])
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
        next: ['POINT3', 'CLOSE', 'UNDO'],
      },
      UNDO: this.UNDORule,
      CLOSE: {
        action: () => {
          this.interactionDataArr[1] = {
            commandStateStr: 'CLOSE',
            data: {
              point: this.firstPoint,
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
          if (this.interactionDataArr.length === 2) {
            entityTemp.shape[0].points = this.interactionDataArr.map((interactionData) => {
              return interactionData.data.point
            })
            this.shapeCreated([entityTemp])
            this.clearInteractionShape()
          }
        },
        msg: '闭合(C)',
        next: [],
      },
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
    }
    interactionEnties.push(refline)

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
