import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'
import { IEntityTemp, MetaEntityType } from '@/core/data/DataManager'
import { Point } from '@/core/utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { isNumArray } from '@/core/utils/utils'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'
import { EnvConfig } from '@/core/store/env/EnvConfig'

@injectable()
export class MTEXT extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  @inject(EnvConfig) private envConfig!: EnvConfig
  public description = '多行文本'
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
    msg: '多行文本',
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
            if (this.interactionDataArr.length === 2) {
              // const entityTemp: IEntityTemp = {
              //   type: this.constructor.name as MetaEntityType,
              //   shape: [
              //     {
              //       type: this.constructor.name as MetaEntityType,
              //       points: this.interactionDataArr.map((item) => {
              //         return item.data.point
              //       }),
              //     },
              //   ],
              // }
              // this.shapeCreated([entityTemp])
              this.clearInteractionShape()
              const point1 = this.interactionDataArr[0].data.point
              const point2 = point
              const dpr = this.envConfig.dpr
              return {
                data: {
                  event: 'MTEXT',
                  textEditorInfo: {
                    canvasWidth: (point2[0] - point1[0]) / dpr,
                    canvasHeight: (point2[1] - point1[1]) / dpr,
                    canvasLeft: point1[0] / dpr,
                    canvasTop: point1[1] / dpr,
                  },
                },
                metaCommandWorkflowType: MetaCommandWorkflowType.Normal,
              }
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
        msg: '指定终点',
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

    if (this.interactionDataArr.length === 1) {
      const refMT: IEntityTemp = {
        type: this.constructor.name as MetaEntityType,
        shape: [
          {
            type: this.constructor.name as MetaEntityType,
            points: [this.interactionDataArr[0].data.point, [this.mouse.mouseX, this.mouse.mouseY]],
          },
        ],
      }
      interactionEnties.push(refMT)
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
