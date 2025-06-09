import { inject, injectable } from 'inversify'
import { BaseCommand, type ICommandRule } from '../BaseCommand'
import { Mouse } from '@/core/interaction/Mouse'

@injectable()
export class RECTANGLE extends BaseCommand {
  @inject(Mouse) private mouse!: Mouse
  public description = '矩形绘制'
  private currentCommandStateStr = '' // 命令状态
  private interactionDataArr: {
    commandStateStr: string
    data: any
  }[] = []
  rule: ICommandRule = {
    action: () => {
      this.currentCommandStateStr = ''
      this.interactionDataArr = []
    },
    msg: '矩形',
    next: ['POINT1', 'CHAMFER', 'ELEVATION', 'FILLET', 'THICKNESS', 'WIDTH'],
    subCommand: {
      POINT1: {
        action: () => {},
        msg: '指定第一个角点',
        next: ['POINT2', 'AREA', 'DIMENSION', 'ROTATION'],
      },
      POINT2: {
        action: () => {},
        msg: '指定另一个角点',
        next: [],
        // end: true
      },
      AREA: {
        action: () => {},
        msg: '面积(A)',
        next: ['AREAINPUT'],
      },
      AREAINPUT: {
        action: (area = 100) => {},
        msg: '输入以当前单位计算的矩形面积 <100.0000>',
        next: ['LENGTHORWIDTH'],
      },
      LENGTHORWIDTH: {
        action: (type = 'LENGTH') => {},
        msg: '计算矩形标注时依据',
        next: ['ALENGTH', 'AWIDTH'],
      },
      ALENGTH: {
        action: () => {},
        msg: '长度(L)',
        next: [],
        // end: true
      },
      AWIDTH: {
        action: () => {},
        msg: '宽度(W)',
        next: [],
        // end: true
      },
      DIMENSION: {
        action: () => {},
        msg: '尺寸(D)',
        next: ['RLENGTH'],
      },
      RLENGTH: {
        action: () => {},
        msg: '指定矩形的长度',
        next: ['RWIDTH'],
      },
      RWIDTH: {
        action: () => {},
        msg: '指定矩形的宽度',
        next: ['POINT1'],
      },
      ROTATION: {
        action: () => {},
        msg: '旋转(R)',
        next: ['RANGLE', 'PICKUP'],
      },
      RANGLE: {
        action: () => {},
        msg: '旋转角度',
        next: ['POINT1'],
      },
      PICKUP: {
        action: () => {},
        msg: '拾取点(P)',
        next: ['PPOINT1'],
      },
      PPOINT1: {
        action: () => {},
        msg: '指定第一点',
        next: ['PPOINT2'],
      },
      PPOINT2: {
        action: () => {},
        msg: '指定第二点',
        next: ['POINT1'],
      },
      CHAMFER: {
        action: () => {},
        msg: '倒角(C)',
        next: ['CHAMFER1'],
      },
      CHAMFER1: {
        action: () => {},
        msg: '指定矩形的第一个倒角距离',
        next: ['CHAMFER2'],
      },
      CHAMFER2: {
        action: () => {},
        msg: '指定矩形的第2个倒角距离',
        next: ['POINT1'],
      },
      ELEVATION: {
        action: () => {},
        msg: '指定标高',
        next: ['POINT1'],
      },
      FILLET: {
        action: () => {},
        msg: '圆角尺寸',
        next: ['POINT1'],
      },
      THICKNESS: {
        action: () => {},
        msg: '厚度大小',
        next: ['POINT1'],
      },
      WIDTH: {
        action: () => {},
        msg: '宽度大小',
        next: ['POINT1'],
      },
    },
  }

  protected dispose() {}
}
