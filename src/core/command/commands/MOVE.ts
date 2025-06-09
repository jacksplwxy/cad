import { BaseCommand, MetaCommandWorkflowType, type ICommandRule, IMetaCommandRunResult } from '../BaseCommand'
import { MetaEntityType, type IEntityTemp, IEntity } from '@/core/data/DataManager'
import { deepCopy, isNumArray, isNumeric } from '@/core/utils/utils'
import { Point } from '@/core/utils/math/ComputGeometry'
import { inject, injectable } from 'inversify'
import { Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { DiscardEvenlyStrategy, ExecuteLatestStrategy, MessageQueue } from '@/core/helper/MessageQueue'

@injectable()
export class MOVE extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '移动'
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
      if (this.dataManager.selectionBoxEntities.length <= 0) {
        return {
          data: { event: 'CommandSelect' },
          metaCommandWorkflowType: MetaCommandWorkflowType.Over,
        }
      }
      this.currentCommandStateStr = ''
      this.interactionDataArr = []
      this.mouse.addEventListener(MyMouseEvent.BaseMouseChange, this.addTask)
      this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
    },
    msg: '移动',
    next: ['POINT1', 'DISPLACEMENT'],
    // end: false,
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
        msg: '指定基点',
        next: ['POINT2'],
      },
      POINT2: {
        action: (params?) => {
          this.currentCommandStateStr = 'POINT2'
          return this.setFinalPoint(params)
        },
        msg: '指定第二个点',
        next: [],
        // end: true
      },
      DISPLACEMENT: {
        action: () => {
          this.interactionDataArr[0] = {
            commandStateStr: 'POINT1',
            data: {
              point: [0, 0],
            },
          }
        },
        msg: '位移(D)',
        next: ['DISPLACEMENTNUM'],
      },
      DISPLACEMENTNUM: {
        action: (params) => {
          this.currentCommandStateStr = 'DISPLACEMENTNUM'
          return this.setFinalPoint(params)
        },
        msg: '指定位移',
        next: [],
        // end: true
      },
    },
  }

  // 设置最终的位置
  private setFinalPoint(params?: any): void | IMetaCommandRunResult {
    const selectionBoxEntitiesNum = this.dataManager.selectionBoxEntities.length
    if (selectionBoxEntitiesNum > 0) {
      if (isNumArray(params)) {
        this.interactionDataArr[1] = {
          commandStateStr: 'POINT2',
          data: {
            point: params as Point,
          },
        }
      } else if (isNumeric(params)) {
        this.interactionDataArr[1] = {
          commandStateStr: 'POINT2',
          data: {
            point: [0, 0] as Point,
          },
        }
        const point0 = this.interactionDataArr[0].data.point
        const finalPointPosition = this.movePoint(point0, [this.mouse.mouseX - point0[0], this.mouse.mouseY - point0[1]], Number(params))
        this.interactionDataArr[1].data.point = finalPointPosition
      } else {
        console.log('请选择坐标点')
        return {
          metaCommandWorkflowType: MetaCommandWorkflowType.Rretry,
        }
      }
      // 基于最原始数据多次复制
      const originEntityArr = deepCopy(this.dataManager.selectionBoxEntities)
      const vector = [this.interactionDataArr[1].data.point[0] - this.interactionDataArr[0].data.point[0], this.interactionDataArr[1].data.point[1] - this.interactionDataArr[0].data.point[1]]
      this.shapeEdit(
        originEntityArr.map((entity) => {
          entity.shape.forEach((item) => {
            item.points?.forEach((numArr) => {
              numArr.forEach((num, index) => {
                if (vector[index]) {
                  numArr[index] = num + vector[index]
                }
              })
            })
          })
          if (entity.other?.boxSelected) {
            entity.other.boxSelected = false
          }
          return entity
        }),
      )
      console.info(`移动了${selectionBoxEntitiesNum}个对象`)
    }
  }

  // 点point沿向量方向vector移动距离distance后的位置
  private movePoint(point: number[], vector: number[], distance: number): number[] {
    const [x, y] = point
    const [a, b] = vector
    // 计算单位向量
    const length = Math.sqrt(a * a + b * b)
    const unitVector = [a / length, b / length]
    return [x + distance * unitVector[0], y + distance * unitVector[1]]
  }

  // 绘制临时交互图形
  private drawInteractionShape = (): void => {
    const interactionEnties: Array<IEntity | IEntityTemp> = []
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
      const originEntityArr = deepCopy(this.dataManager.selectionBoxEntities)
      const vector = [this.mouse.mouseX - this.interactionDataArr[0].data.point[0], this.mouse.mouseY - this.interactionDataArr[0].data.point[1]]
      interactionEnties.push(
        ...originEntityArr.map((entity) => {
          entity.shape.forEach((item) => {
            item.points?.forEach((numArr) => {
              numArr.forEach((num, index) => {
                if (vector[index]) {
                  numArr[index] = num + vector[index]
                }
              })
            })
          })
          if (entity.other?.boxSelected) {
            entity.other.boxSelected = false
          }
          return entity
        }),
      )
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
