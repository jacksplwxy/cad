import { MetaEntityType, type IEntityTemp } from '@/core/data/DataManager'
import { BaseCommand, MetaCommandWorkflowType, type ICommandRule } from '../BaseCommand'
import { Point } from '@/core/utils/math/ComputGeometry'
import { isNumArray, isNumeric } from '@/core/utils/utils'
import { CircleCalculator } from '@/core/utils/math/CircleCalculator'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { inject, injectable } from 'inversify'
import { ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class CIRCLE extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '圆绘制'
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
    msg: '圆',
    next: ['CENTER', 'P3', 'P2', 'T'],
    subCommand: {
      CENTER: {
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
        msg: '圆心(CENTER)',
        next: ['R', 'D'],
      },
      R: {
        action: (params?) => {
          this.currentCommandStateStr = 'R'
          if (isNumArray(params)) {
            this.interactionDataArr[1] = {
              commandStateStr: 'R',
              data: {
                point: (params as Point) || [0, 0],
              },
            }
            if (this.interactionDataArr.length === 2) {
              const rPoint = this.interactionDataArr[1].data.point
              const centerPoint = this.interactionDataArr[0].data.point
              const entityTemp: IEntityTemp = {
                type: this.constructor.name as MetaEntityType,
                shape: [
                  {
                    type: this.constructor.name as MetaEntityType,
                    points: [centerPoint],
                    r: Math.sqrt((rPoint[0] - centerPoint[0]) ** 2 + (rPoint[1] - centerPoint[1]) ** 2),
                  },
                ],
              }
              this.shapeCreated([entityTemp])
              this.clearInteractionShape()
            }
          } else if (isNumeric(params)) {
            const centerPoint = this.interactionDataArr[0].data.point
            const entityTemp: IEntityTemp = {
              type: this.constructor.name as MetaEntityType,
              shape: [
                {
                  type: this.constructor.name as MetaEntityType,
                  points: [centerPoint],
                  r: params,
                },
              ],
            }
            this.shapeCreated([entityTemp])
            this.clearInteractionShape()
          } else {
            console.log('请输入半径')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '半径(R)',
        next: [],
      },
      D: {
        action: (params) => {
          this.currentCommandStateStr = 'D'
          if (isNumArray(params)) {
            this.interactionDataArr[1] = {
              commandStateStr: 'D',
              data: {
                point: (params as Point) || [0, 0],
              },
            }
            if (this.interactionDataArr.length === 2) {
              const dPoint = this.interactionDataArr[1].data.point
              const centerPoint = this.interactionDataArr[0].data.point
              const entityTemp: IEntityTemp = {
                type: this.constructor.name as MetaEntityType,
                shape: [
                  {
                    type: this.constructor.name as MetaEntityType,
                    points: [centerPoint],
                    r: Math.sqrt((dPoint[0] - centerPoint[0]) ** 2 + (dPoint[1] - centerPoint[1]) ** 2) / 2,
                  },
                ],
              }
              this.shapeCreated([entityTemp])
              this.clearInteractionShape()
            }
          } else if (isNumeric(params)) {
            const centerPoint = this.interactionDataArr[0].data.point
            const entityTemp: IEntityTemp = {
              type: this.constructor.name as MetaEntityType,
              shape: [
                {
                  type: this.constructor.name as MetaEntityType,
                  points: [centerPoint],
                  r: params / 2,
                },
              ],
            }
            this.shapeCreated([entityTemp])
            this.clearInteractionShape()
          } else {
            console.log('请输入直径')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '直径(D)',
        next: [],
      },
      P3: {
        action: () => {
          this.currentCommandStateStr = 'P3'
        },
        msg: '三点(P3)',
        next: ['POINT1'],
      },
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
            console.log('请输入坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '第一点(POINT1)',
        next: ['POINT2'],
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
          } else {
            console.log('请输入坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '第二点(POINT2)',
        next: ['POINT3'],
      },
      POINT3: {
        action: (point: Point) => {
          if (isNumArray(point)) {
            this.interactionDataArr[2] = {
              commandStateStr: 'POINT3',
              data: {
                point,
              },
            }
            const result = CircleCalculator.from3Points(this.interactionDataArr.map((item) => item.data.point)).getCircleParams()
            const entityTemp: IEntityTemp = {
              type: this.constructor.name as MetaEntityType,
              shape: [
                {
                  type: this.constructor.name as MetaEntityType,
                  points: result.points,
                  r: result.r,
                },
              ],
            }
            this.shapeCreated([entityTemp])
            this.clearInteractionShape()
          } else {
            console.log('请输入坐标点')
            return {
              metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
            }
          }
        },
        msg: '第三点(POINT3)',
        next: [],
      },
    },
  }

  // 绘制临时交互图形
  private drawInteractionShape = (): void => {
    let interactionEnties = []
    if (this.currentCommandStateStr === 'P3') {
      interactionEnties = []
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
      // 绘制圆
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
        refArc.shape[0] = { ...refArc.shape[0], ...CircleCalculator.from3Points(points).getCircleParams() }
        interactionEnties.push(refArc)
      }
    } else {
      if (this.interactionDataArr.length === 1) {
        interactionEnties = []
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
        const centerPoint = this.interactionDataArr[0].data.point
        const endPoint = [this.mouse.mouseX, this.mouse.mouseY]
        const refCircle: IEntityTemp = {
          type: this.constructor.name as MetaEntityType,
          shape: [
            {
              type: this.constructor.name as MetaEntityType,
              points: [centerPoint],
              r: Math.sqrt((centerPoint[0] - endPoint[0]) ** 2 + (centerPoint[1] - endPoint[1]) ** 2) / (this.currentCommandStateStr === 'D' ? 2 : 1),
            },
          ],
        }
        interactionEnties.push(refCircle)
      }
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
