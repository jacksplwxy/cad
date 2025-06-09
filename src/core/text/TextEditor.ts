import { BaseEventBus } from '@/core/helper/BaseEventBus'
import { inject, injectable } from 'inversify'
import { EnvConfig } from '../store/env/EnvConfig'

export interface IStyle {
  color: string
  fontSize: number
  italic: boolean
  lineHeight: number
  bold: boolean
  fontFamily: string
  background: string
  linethrough: boolean
  underline: boolean
}

export interface IChar extends IStyle {
  value: string
}

export interface ITextEditorOptions extends IStyle {
  canvasWidth: number
  canvasHeight: number
  canvasLeft: number
  canvasTop: number
  canvasPadding: number[]
  rangeColor: string
  rangeOpacity: number
}

interface IRowInfo {
  width: number
  height: number
  originHeight: number // 没有应用行高的原始高度
  descent: number // 行内元素最大的descent
  elementList: IEelement[]
}

type ICtxFont = string

interface IEelement extends IChar {
  font: ICtxFont
  info: {
    width: number
    height: number
    ascent: number
    descent: number
  }
}

interface IPosition extends IEelement {
  rowIndex: number
  rect: { leftTop: number[]; leftBottom: number[]; rightTop: number[]; rightBottom: number[] }
}

interface ICursorInfo {
  x: number
  y: number
  height: number
}

export enum TextEditorEvents {
  POSITIONINDEXUPDATE = 'POSITIONINDEXUPDATE',
  RANGECHAGE = 'RANGECHAGE',
  SHOWTEXTEDITOR = 'SHOWTEXTEDITOR',
  FINISHED = 'FINISHED',
}

@injectable()
export class TextEditor extends BaseEventBus {
  @inject(EnvConfig) private envConfig!: EnvConfig
  private container!: HTMLElement // 容器元素
  public data!: IChar[]
  public options: ITextEditorOptions = {
    canvasWidth: 150,
    canvasHeight: 80,
    canvasLeft: 100,
    canvasTop: 100,
    canvasPadding: [4, 4, 4, 4], // canvas内边距，分别为：上、右、下、左
    rangeColor: '#bbdfff',
    rangeOpacity: 0.6,
    color: '#fff',
    fontSize: 16,
    italic: false,
    lineHeight: 1.5,
    bold: false,
    fontFamily: 'Yahei',
    background: 'unset',
    linethrough: false,
    underline: false,
  }

  private pageCanvas!: HTMLCanvasElement // 页面canvas
  private pageCanvasCtx!: CanvasRenderingContext2D // 页面canvas绘图上下文
  private rows: IRowInfo[] = [] // 渲染的行数据
  private positionList: IPosition[] = [] // 定位元素列表
  private cursorPositionIndex = -1 // 当前光标所在元素索引
  private cursorEl: HTMLElement | null = null // 光标元素
  private cursorTimer: NodeJS.Timeout | undefined = undefined // 光标元素闪烁的定时器
  private textareaEl: HTMLElement | null = null // 文本输入框元素
  private isCompositing = false // 是否正在输入拼音
  private isMousedown = false // 鼠标是否按下
  private range: number[] = [] // 当前选区，第一个元素代表选区开始元素位置，第二个元素代表选区结束元素位置
  private mousemoveTimer: NodeJS.Timeout | undefined = undefined
  private mousemoveEvent!: MouseEvent

  public init(container: HTMLElement, data: IChar[] = [], options = {}): void {
    this.options = Object.assign(this.options, options)
    this.container = container // 容器元素
    this.data = data // 数据
    this.createPage()
    this.render()
    document.body.addEventListener('mousemove', this.onMousemove.bind(this))
    document.body.addEventListener('mouseup', this.onMouseup.bind(this))
  }

  public showTextEditor(x: number, y: number, width: number, height: number) {
    this.clear()
    this.resetCanvasPosition(x, y, width, height)
    this.container.appendChild(this.pageCanvas)
    this.dispatchEvent(TextEditorEvents.SHOWTEXTEDITOR, this.options)
  }

  public finished() {
    this.container.removeChild(this.pageCanvas)
    // 获取
    this.dispatchEvent(TextEditorEvents.FINISHED)
  }

  // 渲染
  public render(notComputeRows = false) {
    this.clear()
    this.positionList = []
    if (!notComputeRows) {
      this.rows = []
      this.computeRows()
    }
    this.renderPage()
  }

  // 清除渲染
  clear() {
    const { canvasWidth, canvasHeight } = this.options
    this.pageCanvasCtx.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  // 渲染页面
  renderPage() {
    const ctx = this.pageCanvasCtx
    // 当前页绘制到的高度
    let renderHeight = 0

    this.rows.forEach((row, index) => {
      // 绘制当前行
      this.renderRow(ctx, renderHeight, row, index)
      // 更新当前页绘制到的高度
      renderHeight += row.height
    })
  }

  // 渲染页面中的一行
  renderRow(ctx: CanvasRenderingContext2D, renderHeight: number, row: IRowInfo, rowIndex: number) {
    const { color, canvasPadding, rangeColor, rangeOpacity } = this.options
    // 内边距
    const offsetX = canvasPadding[3]
    const offsetY = canvasPadding[0]
    // 当前行绘制到的宽度
    let renderWidth = offsetX
    renderHeight += offsetY
    row.elementList.forEach((item) => {
      // 收集positionList
      this.positionList.push({
        ...item,
        rowIndex, // 所在行
        rect: {
          // 包围框
          leftTop: [renderWidth, renderHeight],
          leftBottom: [renderWidth, renderHeight + row.height],
          rightTop: [renderWidth + item.info.width, renderHeight],
          rightBottom: [renderWidth + item.info.width, renderHeight + row.height],
        },
      })
      // 跳过换行符
      if (item.value === '\n') {
        return
      }
      ctx.save()
      // 渲染背景
      if (item.background) {
        ctx.save()
        ctx.beginPath()
        ctx.fillStyle = item.background
        ctx.fillRect(renderWidth, renderHeight, item.info.width, row.height)
        ctx.restore()
      }
      // 渲染下划线
      if (item.underline) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(renderWidth, renderHeight + row.height)
        ctx.lineTo(renderWidth + item.info.width, renderHeight + row.height)
        ctx.stroke()
        ctx.restore()
      }
      // 渲染删除线
      if (item.linethrough) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(renderWidth, renderHeight + row.height / 2)
        ctx.lineTo(renderWidth + item.info.width, renderHeight + row.height / 2)
        ctx.stroke()
        ctx.restore()
      }
      // 渲染文字
      ctx.font = item.font as string
      ctx.fillStyle = item.color || color
      ctx.fillText(item.value, renderWidth, renderHeight + row.height - (row.height - row.originHeight) / 2 - row.descent)
      // 渲染选区
      if (this.range.length === 2 && this.range[0] !== this.range[1]) {
        // 根据鼠标前后位置调整选区位置
        const range = this.getRange()
        const positionIndex = this.positionList.length - 1
        if (positionIndex >= range[0] && positionIndex <= range[1]) {
          ctx.save()
          ctx.beginPath()
          ctx.globalAlpha = rangeOpacity
          ctx.fillStyle = rangeColor
          ctx.fillRect(renderWidth, renderHeight, item.info.width, row.height)
          ctx.restore()
        }
      }
      // 更新当前行绘制到的宽度
      renderWidth += item.info.width
      ctx.restore()
    })
  }

  // 获取选区
  getRange() {
    if (this.range.length < 2) {
      return []
    }
    if (this.range[1] > this.range[0]) {
      // 鼠标结束元素在开始元素后面，那么排除开始元素
      return [this.range[0] + 1, this.range[1]]
    } else if (this.range[1] < this.range[0]) {
      // 鼠标结束元素在开始元素前面，那么排除结束元素
      return [this.range[1] + 1, this.range[0]]
    } else {
      return []
    }
  }

  // 清除选区
  clearRange() {
    if (this.range.length > 0) {
      this.range = []
      this.render()
    }
  }

  // 计算行渲染数据
  computeRows() {
    const { canvasWidth, canvasPadding, lineHeight, fontSize } = this.options
    // 实际内容可用宽度
    const contentWidth = canvasWidth - canvasPadding[1] - canvasPadding[3]
    // 创建一个临时canvas用来测量文本宽高
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 行数据
    const rows: IRowInfo[] = []
    rows.push({
      width: 0,
      height: 0,
      originHeight: 0, // 没有应用行高的原始高度
      descent: 0, // 行内元素最大的descent
      elementList: [],
    })
    this.data.forEach((item) => {
      const { value, lineHeight: itemlLineHeight } = item
      // 实际行高倍数
      const actLineHeight = itemlLineHeight || lineHeight
      // 获取文本宽高
      const font = this.getFontStr(item)
      // 尺寸信息
      const info = {
        width: 0,
        height: 0,
        ascent: 0,
        descent: 0,
      }
      if (value === '\n') {
        // 如果是换行符，那么宽度为0，高度为字号
        info.height = fontSize
      } else {
        // 其他字符
        ctx.font = font
        const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } = ctx.measureText(value)
        info.width = width
        info.height = actualBoundingBoxAscent + actualBoundingBoxDescent
        info.ascent = actualBoundingBoxAscent
        info.descent = actualBoundingBoxDescent
      }
      // 完整数据
      const element: IEelement = {
        ...item,
        info,
        font,
      }
      // 判断当前行是否能容纳
      const curRow = rows[rows.length - 1]
      if (curRow.width + info.width <= contentWidth && value !== '\n') {
        curRow.elementList.push(element)
        curRow.width += info.width
        curRow.height = Math.max(curRow.height, info.height * actLineHeight) // 保存当前行实际最高的文本高度
        curRow.originHeight = Math.max(curRow.originHeight, info.height) // 保存当前行原始最高的文本高度
        curRow.descent = Math.max(curRow.descent, info.descent) // 保存当前行最大的descent
      } else {
        rows.push({
          width: info.width,
          height: info.height * actLineHeight,
          originHeight: info.height,
          elementList: [element],
          descent: info.descent,
        })
      }
    })
    this.rows = rows
  }

  // 拼接font字符串
  getFontStr(element: IChar): ICtxFont {
    const { fontSize, fontFamily } = this.options
    return `${element.italic ? 'italic ' : ''} ${element.bold ? 'bold ' : ''} ${element.fontSize || fontSize}px  ${element.fontFamily || fontFamily} `
  }

  // 创建页面
  private createPage() {
    const { canvasWidth, canvasHeight, canvasLeft, canvasTop } = this.options
    this.pageCanvas = document.createElement('canvas')
    const dpr = this.envConfig.dpr
    this.pageCanvas.width = canvasWidth * dpr
    this.pageCanvas.height = canvasHeight * dpr
    this.pageCanvas.style.position = 'absolute'
    this.resetCanvasPosition(canvasLeft, canvasTop, canvasWidth, canvasHeight)
    this.pageCanvas.style.zIndex = '4'
    this.pageCanvas.style.cursor = 'text'
    this.pageCanvas.style.backgroundColor = 'transparent'
    this.pageCanvas.style.boxShadow = '#9ea1a566 0 2px 12px'
    this.pageCanvas.addEventListener('mousedown', (e) => {
      this.onMousedown(e)
    })

    this.pageCanvasCtx = this.pageCanvas.getContext('2d') as CanvasRenderingContext2D
    // this.pageCanvasCtx.scale(dpr, dpr)
    this.pageCanvasCtx.imageSmoothingEnabled = true
    ;(this.pageCanvasCtx as any).webkitFontSmoothing = 'antialiased' // Safari 私有属性
  }

  private resetCanvasPosition(x: number, y: number, width: number, height: number) {
    this.pageCanvas.style.left = x + 'px'
    this.pageCanvas.style.top = y + 'px'
    this.pageCanvas.style.width = width + 'px'
    this.pageCanvas.style.height = height + 'px'
  }

  // 页面鼠标按下事件
  onMousedown(e: MouseEvent) {
    this.isMousedown = true
    // 鼠标按下位置相对于页面canvas的坐标
    const { x, y } = this.windowToCanvas(e, this.pageCanvas)
    // 计算该坐标对应的元素索引
    const positionIndex = this.getPositionByPos(x, y)
    // 更新光标位置
    this.cursorPositionIndex = positionIndex
    // 计算光标位置及渲染
    this.computeAndRenderCursor(positionIndex)
    this.range[0] = positionIndex
    this.dispatchEvent(TextEditorEvents.POSITIONINDEXUPDATE, positionIndex)
  }

  // 鼠标移动事件
  onMousemove(e: MouseEvent) {
    this.mousemoveEvent = e
    if (this.mousemoveTimer) {
      return
    }
    this.mousemoveTimer = setTimeout(() => {
      this.mousemoveTimer = undefined
      if (!this.isMousedown) {
        return
      }
      e = this.mousemoveEvent
      // 鼠标位置相对于页面canvas的坐标
      const { x, y } = this.windowToCanvas(e, this.pageCanvas)
      // 鼠标位置对应的元素索引
      const positionIndex = this.getPositionByPos(x, y)
      if (positionIndex !== -1) {
        this.range[1] = positionIndex
        this.dispatchEvent(TextEditorEvents.RANGECHAGE, this.getRange())

        if (Math.abs(this.range[1] - this.range[0]) > 0) {
          // 选区大于1，光标就不显示
          this.cursorPositionIndex = -1
          this.hideCursor()
        }
        this.render(true)
      }
    }, 100)
  }

  // 鼠标松开事件
  onMouseup() {
    this.isMousedown = false
  }

  // 获取某个坐标所在的元素
  getPositionByPos(x: number, y: number) {
    // 是否点击在某个元素内
    for (let i = 0; i < this.positionList.length; i++) {
      const cur = this.positionList[i]
      if (x >= cur.rect.leftTop[0] && x <= cur.rect.rightTop[0] && y >= cur.rect.leftTop[1] && y <= cur.rect.leftBottom[1]) {
        // 如果是当前元素的前半部分则点击元素为前一个元素
        if (x < cur.rect.leftTop[0] + cur.info.width / 2) {
          return i - 1
        }
        return i
      }
    }
    // 是否点击在某一行
    let index = -1
    for (let i = 0; i < this.positionList.length; i++) {
      const cur = this.positionList[i]
      if (y >= cur.rect.leftTop[1] && y <= cur.rect.leftBottom[1]) {
        index = i
      }
    }
    if (index !== -1) {
      return index
    }
    // 返回当前页的最后一个元素
    for (let i = 0; i < this.positionList.length; i++) {
      index = i
    }
    return index
  }

  // 获取光标位置信息
  getCursorInfo(positionIndex: number): ICursorInfo {
    const position = this.positionList[positionIndex]
    const { fontSize, canvasPadding, lineHeight } = this.options
    // 光标高度在字号的基础上再高一点
    const height = (position ? position.fontSize : null) || fontSize
    const plusHeight = height / 2
    const actHeight = height + plusHeight
    if (!position) {
      // 当前光标位置处没有元素
      const next = this.positionList[positionIndex + 1]
      if (next) {
        // 存在下一个元素
        const nextCursorInfo = this.getCursorInfo(positionIndex + 1)
        return {
          x: canvasPadding[3],
          y: nextCursorInfo.y,
          height: nextCursorInfo.height,
        }
      } else {
        // 不存在下一个元素，即文档为空
        return {
          x: canvasPadding[3],
          y: canvasPadding[0] + (height * lineHeight - actHeight) / 2,
          height: actHeight,
        }
      }
    }
    // 是否是换行符
    const isNewlineCharacter = position.value === '\n'
    // 元素所在行
    const row = this.rows[position.rowIndex]
    return {
      x: isNewlineCharacter ? position.rect.leftTop[0] : position.rect.rightTop[0],
      y: position.rect.rightTop[1] + row.height - (row.height - row.originHeight) / 2 - actHeight + (actHeight - Math.max(height, position.info.height)) / 2,
      height: actHeight,
    }
  }

  // 计算光标位置及渲染光标
  computeAndRenderCursor(positionIndex: number) {
    // 根据元素索引计算出光标位置和高度信息
    const cursorInfo = this.getCursorInfo(positionIndex)
    // 渲染光标
    const cursorPos = this.canvasToContainer(cursorInfo.x, cursorInfo.y, this.pageCanvas)
    this.setCursor(cursorPos.x, cursorPos.y, cursorInfo.height)
  }

  // 设置光标
  setCursor(left: number, top: number, height: number) {
    this.clearRange()
    clearTimeout(this.cursorTimer)
    if (!this.cursorEl) {
      this.cursorEl = document.createElement('div')
      this.cursorEl.style.position = 'absolute'
      this.cursorEl.style.width = '1px'
      this.cursorEl.style.zIndex = '5'
      this.cursorEl.style.backgroundColor = '#fff'
      this.container.appendChild(this.cursorEl)
    }
    this.cursorEl.style.left = left + 'px'
    this.cursorEl.style.top = top + 'px'
    this.cursorEl.style.height = height + 'px'
    this.cursorEl.style.opacity = 1 + ''
    const timer = setTimeout(() => {
      this.focus()
      if (this.cursorEl) {
        this.cursorEl.style.display = 'block'
      }
      this.blinkCursor('0')
      clearTimeout(timer)
    }, 0)
  }

  // 隐藏光标
  hideCursor() {
    clearTimeout(this.cursorTimer)
    if (this.cursorEl) {
      this.cursorEl.style.display = 'none'
    }
  }

  // 光标闪烁
  blinkCursor(opacity: string) {
    this.cursorTimer = setTimeout(() => {
      if (this.cursorEl) {
        this.cursorEl.style.opacity = opacity
        this.blinkCursor(opacity === '0' ? '1' : '0')
      }
    }, 600)
  }

  // 聚焦
  focus() {
    if (!this.textareaEl) {
      this.textareaEl = document.createElement('textarea')
      this.textareaEl.style.position = 'fixed'
      this.textareaEl.style.left = '-99999px'
      this.textareaEl.addEventListener('input', (e: Event) => {
        this.onInput(e as InputEvent)
      })
      this.textareaEl.addEventListener('compositionstart', () => {
        this.isCompositing = true
      })
      this.textareaEl.addEventListener('compositionend', () => {
        this.isCompositing = false
      })
      this.textareaEl.addEventListener('keydown', this.onKeydown.bind(this))
      this.textareaEl.addEventListener('blur', () => {
        this.hideCursor()
      })
      document.body.appendChild(this.textareaEl)
    }
    this.textareaEl.focus()
  }

  // 失焦
  blur() {
    if (!this.textareaEl) {
      return
    }
    this.textareaEl.blur()
  }

  // 输入事件
  onInput(e: InputEvent) {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      const data = e.data
      if (!data || this.isCompositing) {
        return
      }
      // 插入字符
      const arr = data.split('')
      const length = arr.length
      const range = this.getRange()
      if (range.length > 0) {
        // 存在选区，则替换选区的内容
        this.delete()
      }
      const cur = this.positionList[this.cursorPositionIndex]
      this.data.splice(
        this.cursorPositionIndex + 1,
        0,
        ...arr.map((item) => {
          return {
            ...(cur || {}),
            value: item,
          }
        }),
      )
      // 重新渲染
      this.render()
      // 更新光标
      this.cursorPositionIndex += length
      this.computeAndRenderCursor(this.cursorPositionIndex)
    }, 0)
  }

  // 按键事件
  onKeydown(e: KeyboardEvent) {
    if (e.keyCode === 8) {
      this.delete()
    } else if (e.keyCode === 13) {
      this.newLine()
    }
  }

  // 删除
  delete() {
    if (this.cursorPositionIndex < 0) {
      const range = this.getRange()
      if (range.length > 0) {
        // 存在选区，删除选区内容
        const length = range[1] - range[0] + 1
        this.data.splice(range[0], length)
        this.cursorPositionIndex = range[0] - 1
      } else {
        return
      }
    } else {
      // 删除数据
      this.data.splice(this.cursorPositionIndex, 1)
      // 重新渲染
      this.render()
      // 更新光标
      this.cursorPositionIndex--
    }
    this.computeAndRenderCursor(this.cursorPositionIndex)
  }

  // 换行
  newLine() {
    this.data.splice(this.cursorPositionIndex + 1, 0, {
      value: '\n',
    } as IChar)
    this.render()
    this.cursorPositionIndex++
    this.computeAndRenderCursor(this.cursorPositionIndex)
  }

  // 将相对于浏览器窗口的坐标转换成相对于页面canvas
  windowToCanvas(e: MouseEvent, canvas: HTMLCanvasElement) {
    const { left, top } = canvas.getBoundingClientRect()
    return {
      x: e.clientX - left,
      y: e.clientY - top,
    }
  }

  // 将相对于页面canvas的坐标转换成相对于容器元素的
  canvasToContainer(x: number, y: number, canvas: HTMLCanvasElement) {
    return {
      x: x + canvas.offsetLeft,
      y: y + canvas.offsetTop,
    }
  }
}
