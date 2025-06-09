import { DataManager } from '../data/DataManager'
import { Mouse } from './Mouse'
import { isNumArray, isNumeric, debounce } from '../utils/utils'
import { Keyboard, MyKeyboardEvent } from './Keyboard'
import { inject, injectable } from 'inversify'
import { CursorState, InteractionVisual } from '../visual/InteractionVisual'
import { ShortcutManager } from './ShortcutManager'
import { CommandManager } from '../command/CommandManager'
import { MyCommandEvent } from '../command/BaseCommand'
import { DomManager } from '../dom/DomManager'
import { EnvConfig } from '../store/env/EnvConfig'
import { StateManager } from '../helper/StateManager'
import { SystemConfig } from '../store/system/SystemConfig'
import { Snap } from './Snaps'
import { Point } from '../utils/math/ComputGeometry'
import { ITextEditorOptions, TextEditor, TextEditorEvents } from '../text/TextEditor'

// 命令交互状态（决定鼠标形态）
enum CommandInteractionState {
  DEFAULT = 'DEFAULT', // 默认状态
  COMMANDING = 'COMMANDING', // 命令行中
  SELECT = 'SELECT', // 对象被选择状态
  DRAGGING = 'DRAGGING', // 画布拖拽中
  TEXTEIDTING = 'TEXTEIDTING', // 文本编辑中
}

@injectable()
export class InteractionManager {
  @inject(EnvConfig) private envConfig!: EnvConfig
  @inject(SystemConfig) private systemConfig!: SystemConfig
  @inject(Mouse) private mouse!: Mouse
  @inject(DataManager) private dataManager!: DataManager
  @inject(InteractionVisual) private interactionVisual!: InteractionVisual
  @inject(Keyboard) private keyboard!: Keyboard
  @inject(ShortcutManager) private shortcutManager!: ShortcutManager
  @inject(CommandManager) private commandManager!: CommandManager
  @inject(DomManager) private domManager!: DomManager
  @inject(Snap) private snap!: Snap
  @inject(TextEditor) public editor!: TextEditor

  private stateManager = new StateManager({
    commandInteractionState: CommandInteractionState.DEFAULT as CommandInteractionState | null, // 当前交互状态（决定鼠标形态）
  })
  private input = '' // 记录键盘输入
  private prevCommandInteractionState: CommandInteractionState | null = CommandInteractionState.DEFAULT // 前一条指令状态
  private cursorState: CursorState | null = CursorState.CROSSWITHSQUARE // 鼠标状态
  private debounceCursorCollisionDetect!: (x: number, y: number) => void
  private lastMouseMovePosition = [0, 0] //上一次鼠标移动的位置
  private centerKeyDoubleMousedowning = false // 鼠标中间是否双击中

  public init() {
    this.debounceCursorCollisionDetect = debounce(this.commandManager.cursorCollisionDetect.bind(this.commandManager), this.systemConfig.detectTime)
    this.mouseInit()
    this.keyboardInit()
    this.watchInit()
    this.shortcutManagerInit()
    this.commandManagerListenerInit()
    this.snap.init()
    this.interactionVisual.init()
    this.editor.init(this.domManager.domContainer)
    this.commandManager.run('READDATALOCAL')
  }

  public getSnapPoint(): Point | null {
    return this.snap.getSnapBaseCoordinate(this.cursorState)
  }

  private shortcutManagerInit() {
    this.shortcutManager.init()
    // 手动设置快捷键
    this.shortcutManager.setShortcut('L', 'LINE')
    this.shortcutManager.setShortcut('C', 'CIRCLE')
    this.shortcutManager.setShortcut('AS', 'MOVE')
    this.shortcutManager.setShortcut('REC', 'RECTANGLE')
    this.shortcutManager.setShortcut('M', 'MOVE')
    this.shortcutManager.setShortcut('CC', 'COPY')
    this.shortcutManager.setShortcut('DEL', 'ERASE')
    this.shortcutManager.setShortcut('DELETE', 'ERASE')
    this.shortcutManager.setShortcut('MT', 'MTEXT')
  }

  private watchInit(): void {
    this.stateManager.watch(['commandInteractionState'], ([newVal], [oldVal]) => {
      this.prevCommandInteractionState = oldVal
      console.log(73, `commandInteractionState changed from: ${oldVal} to: ${newVal}`)
      this.cursorState = this.getCursorState()
      // 光标变化时自动清除选框并且刷新光标图形
      this.interactionVisual.clearAllShapes()
      this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
    })
  }

  private mouseInit() {
    const canvasInfo = this.domManager.interactionCanvas.getBoundingClientRect()
    this.domManager.interactionCanvas.addEventListener('mousedown', (event: MouseEvent) => {
      this.interactionVisual.clearCursorAndSelectRect(this.cursorState, [this.mouse.baseMousedownX, this.mouse.baseMousedownY], [this.mouse.baseMouseX, this.mouse.baseMouseY])

      switch (event.button) {
        case 0: {
          this.mouse.setBaseMousedown([(event.clientX - canvasInfo.left) * this.envConfig.dpr, (event.clientY - canvasInfo.top) * this.envConfig.dpr])
          const baseMouseRecords = [...this.mouse.baseMouseRecords]
          baseMouseRecords.push([this.mouse.baseMousedownX, this.mouse.baseMousedownY])
          this.mouse.setBaseMouseRecords(baseMouseRecords)
          break
        }
        case 1: {
          event.preventDefault()
          // centerKeyDoubleMousedowning为真表示这次为双击
          if (this.centerKeyDoubleMousedowning) {
            this.centerKeyDoubleMousedowning = false
            // 触发鼠标中间双击事件
            this.commandManager.zoomCenter(Math.ceil(this.domManager.interactionCanvas.width), Math.ceil(this.domManager.interactionCanvas.height))
          } else {
            this.centerKeyDoubleMousedowning = true
            const timer = setTimeout(() => {
              this.centerKeyDoubleMousedowning = false
              clearTimeout(timer)
            }, 400)
          }
          break
        }
        case 2: {
          event.preventDefault()
          break
        }
      }

      let isCommandFirstRunning = false
      const snapPoint = this.getSnapPoint()
      if (snapPoint) {
        this.mouse.setBaseMousedown(snapPoint)
        const baseMouseRecords = [...this.mouse.baseMouseRecords]
        baseMouseRecords[baseMouseRecords.length - 1] = snapPoint
        this.mouse.setBaseMouseRecords(baseMouseRecords)
        if (this.stateManager.getState('commandInteractionState') === CommandInteractionState.DEFAULT) {
          this.commandManager.run('KEYNODESDRAG', this.snap.getClosestKeyNodeArr())
          isCommandFirstRunning = true
        }
      }
      this.cursorState = this.getCursorState()
      this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
      if (event.button === 1) {
        this.stateManager.setData({ commandInteractionState: CommandInteractionState.DRAGGING })
      }
      if (this.cursorState === CursorState.NONE) {
        //  NONE状态并且鼠标点数为1，并且存在光标碰撞实体时，则说明是单选
        if (this.mouse.mouseRecords.length === 1 && this.dataManager.collisionEntity) {
          this.commandManager.setSingleSelectionBox(this.keyboard.isKeyPressed('SHIFT'))
          this.selectCompleteKeyDataReset()
        }
        // NONE状态并且鼠标点击2次表示框选结束
        else if (this.mouse.mouseRecords.length >= 2) {
          this.commandManager.setSelectionBox(this.mouse.mouseRecords[0], this.mouse.mouseRecords[1], this.keyboard.isKeyPressed('SHIFT'))
          this.selectCompleteKeyDataReset()
        }
      } else if (this.cursorState === CursorState.CROSS) {
        //如果是指令刚开始执行，则不执行run(null)
        if (!isCommandFirstRunning) {
          this.commandManager.run(null, [this.mouse.mouseX, this.mouse.mouseY])
        }
      }
    })

    this.domManager.interactionCanvas.addEventListener('mousemove', (event: MouseEvent) => {
      this.lastMouseMovePosition = [this.mouse.baseMouseX, this.mouse.baseMouseY]
      this.interactionVisual.clearCursorAndSelectRect(this.cursorState, [this.mouse.baseMousedownX, this.mouse.baseMousedownY], [this.mouse.baseMouseX, this.mouse.baseMouseY])

      this.mouse.setBaseMouse([(event.clientX - canvasInfo.left) * this.envConfig.dpr, (event.clientY - canvasInfo.top) * this.envConfig.dpr])

      const snapPoint = this.getSnapPoint()
      if (snapPoint) {
        this.mouse.setBaseMouse(snapPoint)
      }
      this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
      // 拖拽状态时更新视图坐标
      if (this.stateManager.getState('commandInteractionState') === CommandInteractionState.DRAGGING) {
        this.centerMouseCoordinateUpdate(this.mouse.baseMouseX, this.mouse.baseMouseY, this.lastMouseMovePosition[0], this.lastMouseMovePosition[1])
      }
      switch (this.cursorState) {
        case CursorState.CROSSWITHSQUARE:
        case CursorState.SQUARE: {
          //  CROSSWITHSQUARE或SQUARE状态并且鼠标点数为0，说明是光标碰撞检测状态
          if (this.mouse.mouseRecords.length === 0) {
            this.debounceCursorCollisionDetect(this.mouse.mouseX, this.mouse.mouseY)
          }
          break
        }
        // CursorState.NONE时，表明当前鼠标正在框选状态
        case CursorState.NONE: {
          this.interactionVisual.drawSelectRect([this.mouse.baseMousedownX, this.mouse.baseMousedownY], [this.mouse.baseMouseX, this.mouse.baseMouseY])
          break
        }
      }
    })

    this.domManager.interactionCanvas.addEventListener('mouseup', (event: MouseEvent) => {
      this.interactionVisual.clearCursorAndSelectRect(this.cursorState, [this.mouse.baseMousedownX, this.mouse.baseMousedownY], [this.mouse.baseMouseX, this.mouse.baseMouseY])
      switch (event.button) {
        // 左键
        case 0: {
          this.mouse.setBaseMouseup([(event.clientX - canvasInfo.left) * this.envConfig.dpr, (event.clientY - canvasInfo.top) * this.envConfig.dpr])
          break
        }
        // 中键
        case 1: {
          event.preventDefault()
          this.stateManager.setData({ commandInteractionState: this.prevCommandInteractionState })
          break
        }
        // 右键
        case 2: {
          event.preventDefault()
          break
        }
      }
      const snapPoint = this.getSnapPoint()
      if (snapPoint) {
        this.mouse.setBaseMouseup(snapPoint)
      }
      this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
    })

    // 鼠标右键监听
    this.domManager.interactionCanvas.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault() // 阻止默认行为
    })

    // 鼠标滚轮监听
    this.domManager.interactionCanvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault() // 阻止默认行为
      this.mouse.setWheelDeltaY(event.deltaY)
      this.wheelDeltaYUpdate(this.mouse.wheelDeltaY)
    })
  }

  private commandManagerListenerInit() {
    this.commandManager.addEventListener(MyCommandEvent.CommandStart, (info) => {
      console.info('执行MyCommandEvent.CommandStart', info)
      this.stateManager.setData({ commandInteractionState: CommandInteractionState.COMMANDING })
    })
    this.commandManager.addEventListener(MyCommandEvent.MateCommandEnd, (info) => {
      console.info('执行MyCommandEvent.MateCommandEnd', info)
      this.input = ''
      if (info?.data?.event === 'CommandSelect') {
        this.stateManager.setData({ commandInteractionState: CommandInteractionState.SELECT })
      } else if (info?.data?.event === 'MTEXT') {
        console.log('多文本状态变更：', info)
        if (this.domManager.domContainer) {
          const options: ITextEditorOptions = info?.data?.textEditorInfo || {}
          this.editor.showTextEditor(options.canvasLeft, options.canvasTop, options.canvasWidth, options.canvasHeight)
          this.stateManager.setData({ commandInteractionState: CommandInteractionState.TEXTEIDTING })
        }
      }
    })
    this.commandManager.addEventListener(MyCommandEvent.CommandEnd, (info) => {
      console.info('执行MyCommandEvent.CommandEnd', info)
      this.stateManager.setData({ commandInteractionState: CommandInteractionState.DEFAULT })
      if (info?.data?.event === 'CommandSelect') {
        this.stateManager.setData({ commandInteractionState: CommandInteractionState.SELECT })
      }
      // 指令执行完后清除选中的对象
      if (info?.command?.constructor?.name !== 'SELECTIONBOXALL') {
        this.commandManager.clearSelectionBox()
      }
      this.keyDataReset()
    })
    this.commandManager.addEventListener(MyCommandEvent.CommandError, (info) => {
      console.info('执行MyCommandEvent.CommandError', info)
      this.stateManager.setData({ commandInteractionState: CommandInteractionState.DEFAULT })
      this.keyDataReset()
    })
  }

  private keyboardInit() {
    this.keyboard.addEventListener(MyKeyboardEvent.KeyDown, (key: string) => {
      const getPressedKeyStr = this.keyboard.getPressedKeys().join('+')
      console.log(150, getPressedKeyStr)
      switch (getPressedKeyStr) {
        case 'CONTROL+A': {
          this.commandManager.run('SELECTIONBOXALL')
          break
        }
        case 'CONTROL+S': {
          this.commandManager.run('SAVEDATALOCAL')
          break
        }
        case 'CONTROL+Z': {
          this.commandManager.undo()
          break
        }
        case 'CONTROL+Y': {
          this.commandManager.redo()
          break
        }
        // 输入Esc键时
        case 'ESCAPE':
        case 'ESC': {
          this.commandManager.run('ESCAPE')
          break
        }
        // 后退键
        case 'BACKSPACE': {
          this.input = this.input.slice(0, -1)
          break
        }
        // 删除键
        case 'DELETE': {
          this.commandManager.run('ERASE')
          break
        }
        // 可以添加其他按键的处理逻辑
        default: {
          switch (key) {
            // 输入空格或回车键时，说明开始执行指令了
            case ' ':
            case 'ENTER': {
              if (this.stateManager.getState('commandInteractionState') === CommandInteractionState.COMMANDING) {
                let inputData: any = this.input
                // 输入坐标点
                if (isNumArray(inputData)) {
                  this.commandManager.run(null, inputData)
                }
                // 输入数字
                else if (isNumeric(inputData)) {
                  inputData = Number(inputData)
                  this.commandManager.run(null, inputData)
                }
                //切换状态
                else {
                  this.commandManager.run(inputData)
                }
              } else {
                const allShortcut = this.shortcutManager.getAllShortcut()
                const command = allShortcut[this.input] || ' '
                if (command) {
                  this.commandManager.run(command)
                }
              }

              break
            }
            default: {
              if (key.length === 1 && /^[0-9a-zA-Z]+$/.test(key)) {
                this.input = this.input + key.toUpperCase()
              }
            }
          }
        }
      }
    })
  }

  // 获取光标形状
  private getCursorState(): CursorState {
    const commandInteractionState = this.stateManager.getState('commandInteractionState')
    console.log(356, commandInteractionState)

    if ((commandInteractionState === CommandInteractionState.DEFAULT || commandInteractionState === CommandInteractionState.SELECT) && this.mouse.baseMouseRecords.length) {
      return CursorState.NONE
    } else if (commandInteractionState === CommandInteractionState.DEFAULT) {
      return CursorState.CROSSWITHSQUARE
    } else if (commandInteractionState === CommandInteractionState.SELECT) {
      return CursorState.SQUARE
    } else if (commandInteractionState === CommandInteractionState.COMMANDING) {
      return CursorState.CROSS
    } else if (commandInteractionState === CommandInteractionState.DRAGGING) {
      return CursorState.DRAGGING
    } else if (commandInteractionState === CommandInteractionState.TEXTEIDTING) {
      return CursorState.NONE
    } else {
      return CursorState.CROSSWITHSQUARE
    }
  }

  // 鼠标中键引起的坐标变化
  private centerMouseCoordinateUpdate(newX: number, newY: number, oldX: number, oldY: number): void {
    const a = 1
    const b = 0
    const c = 0
    const d = 1
    const e = (newX - oldX) / this.mouse.visualWorkerView.a
    const f = (newY - oldY) / this.mouse.visualWorkerView.d
    this.setVisualWorkerView(a, b, c, d, e, f)
  }

  // 滚轮变化
  private wheelDeltaYUpdate(wheelDeltaYVal: number): void {
    if (wheelDeltaYVal !== 0) {
      let scale = 1
      // 判断滚轮方向
      if (wheelDeltaYVal > 0) {
        if (this.mouse.visualWorkerView.a <= 0.02 && this.mouse.visualWorkerView.d <= 0.02) {
          return
        }
        scale = 0.9
      } else if (wheelDeltaYVal < 0) {
        scale = 1.1
      }
      const a = scale
      const b = 0
      const c = 0
      const d = scale
      const e = this.mouse.mouseX * (1 - scale) // 以鼠标为中点的进行缩放后的偏移量
      const f = this.mouse.mouseY * (1 - scale) // 以鼠标为中点的进行缩放后的偏移量
      this.setVisualWorkerView(a, b, c, d, e, f)
    }
  }

  // 重绘所有（只涉及渲染）
  private setVisualWorkerView(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.mouse.setVisualWorkerView(this.mouse.getAbsoluteTransformFromRelative(this.mouse.visualWorkerView, { a, b, c, d, e, f }))
  }

  // 选择完成后状态重置
  private selectCompleteKeyDataReset(): void {
    this.interactionVisual.clearAllShapes()
    this.mouse.setBaseMouseRecords([])
    this.cursorState = this.getCursorState()
    this.input = ''
    this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
  }

  // 状态重置
  private keyDataReset(): void {
    this.interactionVisual.clearAllShapes()
    this.mouse.setBaseMouseRecords([])
    this.cursorState = this.getCursorState()
    this.input = ''
    this.interactionVisual.drawCursor(this.cursorState, [this.mouse.baseMouseX, this.mouse.baseMouseY])
  }
}
