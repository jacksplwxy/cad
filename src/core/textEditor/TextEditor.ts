import { injectable } from 'inversify'
import { BaseEventBus } from '@/core/helper/BaseEventBus'
import { PointCalculator } from '@/core/utils/math/PointCalculator'
import { areAllPropertiesEqual } from '@/core/utils/utils'

@injectable()
export class TextEditor extends BaseEventBus {
  private _paragraphSpace = 0 //段间距
  private _rowSpace = 0 //行间距
  private _charSpace = 0 //字间距
  private _container!: HTMLElement
  private _richTextDocument!: RichTextDocument
  private _pageCanvas!: HTMLCanvasElement // 页面画布元素
  private _pageCanvasCtx!: CanvasRenderingContext2D // 画布的2D渲染上下文
  private _interactionCanvas!: HTMLCanvasElement //交互画布
  private _interactionCtx!: CanvasRenderingContext2D // 交互画布的2D渲染上下文
  private _cursor!: Cursor
  private _selectionRange!: SelectionRange
  private _textareaEl: HTMLElement | null = null // 文本输入区域元素
  private _isCompositing = false // 是否正在输入组合字符（如中文输入法）
  private _isMousedown = false // 是否按下鼠标
  private _mousemoveTimer!: NodeJS.Timeout | undefined

  constructor(
    public pageWidth = 794,
    public pageHeight = 1123,
  ) {
    super()
    this._richTextDocument = new RichTextDocument(20, 20, this.pageWidth - 40, this.pageHeight - 40)
    const firstChar = new Char('')
    const firstCharBlock = new CharBlock(this._richTextDocument.styles.currentStyleId)
    firstCharBlock.chars.push(firstChar)
    const firstRow = new Row()
    firstRow.charBlocks.push(firstCharBlock)
    const firstParagraph = new Paragraph(0, 0, this._richTextDocument.width, 0)
    firstParagraph.rows.push(firstRow)
    this._richTextDocument.paragraphs.push(firstParagraph)
  }

  // 初始化编辑器
  public init(container: HTMLElement): void {
    this._container = container
    this.createPage() // 创建页面画布
    this.createInteractionPage() // 创建页面画布
    this.renderDocument() // 渲染页面
  }

  // 初始化数据
  public setRichTextDocument(richTextDocument: RichTextDocument): void {
    this._richTextDocument = richTextDocument
    this.renderDocument()
  }

  // 创建页面画布
  createPage() {
    this._pageCanvas = document.createElement('canvas') // 创建画布元素
    const dpr = window.devicePixelRatio // 获取设备像素比
    this._pageCanvas.width = this.pageWidth * dpr // 设置画布宽度（考虑像素比）
    this._pageCanvas.height = this.pageHeight * dpr // 设置画布高度（考虑像素比）
    this._pageCanvas.style.width = `${this.pageWidth}px` // 设置CSS宽度
    this._pageCanvas.style.height = `${this.pageHeight}px` // 设置CSS高度
    this._pageCanvas.style.position = 'absolute'
    this._pageCanvas.style.top = '100px'
    this._pageCanvas.style.left = '0'
    this._pageCanvas.style.zIndex = '1'
    this._pageCanvas.style.cursor = 'none' // 设置光标样式为文本输入
    this._pageCanvas.style.backgroundColor = '#000' // 设置背景色为黑色
    this._pageCanvas.style.boxShadow = '#9ea1a566 0 2px 12px' // 设置阴影效果
    this._container.appendChild(this._pageCanvas) // 将画布添加到容器
    this._pageCanvasCtx = this._pageCanvas.getContext('2d') as CanvasRenderingContext2D // 获取2D上下文
    this._pageCanvasCtx.scale(dpr, dpr) // 根据像素比缩放画布
  }
  createInteractionPage() {
    this._interactionCanvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio
    this._interactionCanvas.width = this.pageWidth * dpr
    this._interactionCanvas.height = this.pageHeight * dpr
    this._interactionCanvas.style.width = `${this.pageWidth}px`
    this._interactionCanvas.style.height = `${this.pageHeight}px`
    this._interactionCanvas.style.position = 'absolute'
    this._interactionCanvas.style.top = '100px'
    this._interactionCanvas.style.left = '0'
    this._interactionCanvas.style.zIndex = '2'
    this._interactionCanvas.style.cursor = 'text' // 设置光标样式为文本输入
    this._interactionCanvas.style.backgroundColor = 'rgba(0,255,255,0.2)' // 设置背景色为白色
    this._interactionCanvas.addEventListener('mousedown', this.onMousedown.bind(this)) // 监听鼠标按下事件
    this._interactionCanvas.addEventListener('mousemove', this.onMousemove.bind(this)) // 监听全局鼠标移动事件
    this._interactionCanvas.addEventListener('mouseup', this.onMouseup.bind(this)) // 监听全局鼠标松开事件
    this._container.appendChild(this._interactionCanvas) // 将画布添加到容器
    this._interactionCtx = this._interactionCanvas.getContext('2d') as CanvasRenderingContext2D // 获取2D上下文
    this._interactionCtx.scale(dpr, dpr) // 根据像素比缩放画布
    this._cursor = new Cursor(this._interactionCtx)
    this._selectionRange = new SelectionRange(this._interactionCtx)
  }

  // 根据鼠标位置获取与字符相关的画布坐标
  private _getCursonInfoByMousePosition(x: number, y: number): IcursorInfo {
    const cursorInfo: IcursorInfo = {
      x: 0,
      y: 0,
      paragraphIndex: 0,
      rowIndex: 0,
      charBlockIndex: 0,
      charIndex: 0,
      rowHegiht: 0,
    }
    const pointCalculator = new PointCalculator([x, y])

    const paragraphIndexRes = this._richTextDocument.paragraphs.some((paragraph, paragraphIndex) => {
      if (pointCalculator.isInside([paragraph.x, paragraph.y], [paragraph.x + paragraph.width, paragraph.y + paragraph.height])) {
        cursorInfo.paragraphIndex = paragraphIndex
        const rowIndexRes = paragraph.rows.some((row, rowIndex) => {
          if (pointCalculator.isInside([row.x, row.y], [row.x + row.width, row.y + row.height])) {
            cursorInfo.rowIndex = rowIndex
            const charBlockIndexRes = row.charBlocks.some((charBlock, charBlockIndex) => {
              if (pointCalculator.isInside([charBlock.x, row.y], [charBlock.x + charBlock.width, row.y + row.height])) {
                cursorInfo.charBlockIndex = charBlockIndex
                let charsX = charBlock.x
                const style = this._richTextDocument.styles.getStyle(charBlock.styleId) as Style
                const charIndexRes = charBlock.chars.some((char, charIndex) => {
                  char = this._geSizeInitChar(char, style)
                  if (pointCalculator.isInside([charsX, row.y], [charsX + char.tempWidth, row.y + row.height])) {
                    cursorInfo.charIndex = charIndex
                    cursorInfo.x = charsX + char.tempWidth
                    cursorInfo.y = row.y
                    cursorInfo.rowHegiht = row.height
                    return true
                  }
                  charsX += char.tempWidth
                })
                if (!charIndexRes) {
                  cursorInfo.charIndex = charBlock.chars.length - 1
                  cursorInfo.x = charBlock.x + charBlock.width
                  cursorInfo.y = row.y
                  cursorInfo.rowHegiht = row.height
                }
                return true
              }
            })
            if (!charBlockIndexRes) {
              cursorInfo.charBlockIndex = row.charBlocks.length - 1
              cursorInfo.charIndex = row.charBlocks[cursorInfo.charBlockIndex].chars.length - 1
              cursorInfo.x = row.charBlocks[cursorInfo.charBlockIndex].x + row.charBlocks[cursorInfo.charBlockIndex].width
              cursorInfo.y = row.y
              cursorInfo.rowHegiht = row.height
            }
            return true
          }
        })
        if (!rowIndexRes) {
          cursorInfo.rowIndex = paragraph.rows.length - 1
          cursorInfo.charBlockIndex = paragraph.rows[cursorInfo.rowIndex].charBlocks.length - 1
          cursorInfo.charIndex = paragraph.rows[cursorInfo.rowIndex].charBlocks[cursorInfo.charBlockIndex].chars.length - 1
          const lastCharBlock = paragraph.rows[cursorInfo.rowIndex].charBlocks[cursorInfo.charBlockIndex]
          cursorInfo.x = lastCharBlock.x + lastCharBlock.width
          cursorInfo.y = paragraph.rows[cursorInfo.rowIndex].y
          cursorInfo.rowHegiht = paragraph.rows[cursorInfo.rowIndex].height
        }
        return true
      }
    })
    if (!paragraphIndexRes) {
      cursorInfo.paragraphIndex = this._richTextDocument.paragraphs.length - 1
      cursorInfo.rowIndex = this._richTextDocument.paragraphs[cursorInfo.paragraphIndex].rows.length - 1
      cursorInfo.charBlockIndex = this._richTextDocument.paragraphs[cursorInfo.paragraphIndex].rows[cursorInfo.rowIndex].charBlocks.length - 1
      cursorInfo.charIndex = this._richTextDocument.paragraphs[cursorInfo.paragraphIndex].rows[cursorInfo.rowIndex].charBlocks[cursorInfo.charBlockIndex].chars.length - 1
      const lastRow = this._richTextDocument.paragraphs[cursorInfo.paragraphIndex].rows[cursorInfo.rowIndex]
      const lastCharBlock = lastRow.charBlocks[cursorInfo.charBlockIndex]
      cursorInfo.x = lastCharBlock.x + lastCharBlock.width
      cursorInfo.y = lastRow.y
      cursorInfo.rowHegiht = lastRow.height
    }

    return cursorInfo
  }

  // 处理鼠标按下事件
  onMousedown(e: MouseEvent) {
    this._isMousedown = true // 设置鼠标按下状态
    const { x, y } = this.windowToCanvas(e, this._pageCanvas) // 将窗口坐标转换为画布坐标
    const cursonInfo = this._getCursonInfoByMousePosition(x, y)
    this._cursor.updatePosition(cursonInfo.x, cursonInfo.y)
    this._selectionRange.clearArea()
    this._selectionRange.setStartCursorInfo(cursonInfo)
    this._selectionRange.setEndCursorInfo(null)
    this.focus()
  }

  // 处理鼠标移动事件
  onMousemove(e: MouseEvent) {
    if (!this._selectionRange.startCursorInfo) {
      return
    }
    if (this._mousemoveTimer || !this._isMousedown) {
      return
    }
    this._mousemoveTimer = setTimeout(() => {
      clearTimeout(this._mousemoveTimer)
      this._mousemoveTimer = undefined // 清除定时器
      const { x, y } = this.windowToCanvas(e, this._pageCanvas)
      const cursonInfo = this._getCursonInfoByMousePosition(x, y)
      this._cursor.hideCursor()
      this._selectionRange.setEndCursorInfo(cursonInfo)
      this._selectionRange.updateArea(this._richTextDocument)
    }, 100)
  }

  // 处理鼠标松开事件
  onMouseup() {
    this._isMousedown = false // 设置鼠标松开状态
  }

  // 应用样式到选区
  applyStyleToRange(style: Style) {
    // 如果不存在则新建
    const newStyleId = this._richTextDocument.styles.addStyle(style)
    // 遍历将原来block变为新block
    if (this._selectionRange.startCursorInfo && this._selectionRange.endCursorInfo) {
      this._richTextDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
        // 同一段落时
        if (paragraphIndex === (this._selectionRange.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex === (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row, rowIndex) => {
            // 同一行时
            if (rowIndex === this._selectionRange.startCursorInfo?.rowIndex && rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (newStyleId === charBlock.styleId) {
                  return
                }
                //同一个block时
                if (charBlockIndex === this._selectionRange.startCursorInfo?.charBlockIndex && charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  const left = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  left.chars = charBlock.chars.slice(0, this._selectionRange.startCursorInfo?.charIndex)
                  left.styleId = charBlock.styleId
                  const newArray = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  newArray.chars = charBlock.chars.slice(this._selectionRange.startCursorInfo?.charIndex, this._selectionRange.endCursorInfo?.charIndex)
                  newArray.styleId = newStyleId
                  const right = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  right.chars = charBlock.chars.slice(this._selectionRange.endCursorInfo?.charIndex)
                  right.styleId = charBlock.styleId
                  row.charBlocks.splice(charBlockIndex, 1, left, newArray, right)
                } else if (charBlockIndex > (this._selectionRange.startCursorInfo?.charBlockIndex as number) && charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.styleId = newStyleId
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  const newArray = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  newArray.chars = charBlock.chars.slice(0, this._selectionRange.endCursorInfo?.charIndex)
                  newArray.styleId = newStyleId
                  const right = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  right.chars = charBlock.chars.slice(this._selectionRange.endCursorInfo?.charIndex)
                  right.styleId = charBlock.styleId
                  row.charBlocks.splice(charBlockIndex, 1, newArray, right)
                }
              })
            } else if (rowIndex > (this._selectionRange.startCursorInfo?.rowIndex as number) && rowIndex < (this._selectionRange.endCursorInfo?.rowIndex as number)) {
              row.charBlocks.forEach((charBlock) => {
                if (newStyleId === charBlock.styleId) {
                  return
                }
                charBlock.styleId = newStyleId
              })
            } else if (rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (newStyleId === charBlock.styleId) {
                  return
                }
                if (charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.styleId = newStyleId
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  const newArray = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  newArray.chars = charBlock.chars.slice(0, this._selectionRange.endCursorInfo?.charIndex)
                  newArray.styleId = newStyleId
                  const right = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  right.chars = charBlock.chars.slice(this._selectionRange.endCursorInfo?.charIndex)
                  right.styleId = charBlock.styleId
                  row.charBlocks.splice(charBlockIndex, 1, newArray, right)
                }
              })
            }
          })
        } else if (paragraphIndex > (this._selectionRange.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex < (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row) => {
            row.charBlocks.forEach((charBlock) => {
              if (newStyleId === charBlock.styleId) {
                return
              }
              charBlock.styleId = newStyleId
            })
          })
        } else if (paragraphIndex === (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row, rowIndex) => {
            if (rowIndex < (this._selectionRange.endCursorInfo?.rowIndex as number)) {
              row.charBlocks.forEach((charBlock) => {
                if (newStyleId === charBlock.styleId) {
                  return
                }
                charBlock.styleId = newStyleId
              })
            } else if (rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (newStyleId === charBlock.styleId) {
                  return
                }
                if (charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.styleId = newStyleId
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  const newArray = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  newArray.chars = charBlock.chars.slice(0, this._selectionRange.endCursorInfo?.charIndex)
                  newArray.styleId = newStyleId
                  const right = new CharBlock(this._richTextDocument.styles.currentStyleId)
                  right.chars = charBlock.chars.slice(this._selectionRange.endCursorInfo?.charIndex)
                  right.styleId = charBlock.styleId
                  row.charBlocks.splice(charBlockIndex, 1, newArray, right)
                }
              })
            }
          })
        }
      })
    }
    //重新排列
    this._richTextDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
      this.computeParagraph(paragraph)
    })
    //重新渲染
    this._renderRichTextDocument()
  }

  // 获取字体样式字符串
  private _getFontStr(style: Style) {
    return `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize}px ${style.fontFamily}` // 拼接字体样式
  }

  // 获取经过尺寸初始化后的字符数据
  private _geSizeInitChar(char: Char, style: Style): Char {
    if (!char.tempWidth) {
      this._pageCanvasCtx.font = this._getFontStr(style)
      const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } = this._pageCanvasCtx.measureText(char.val)
      char.tempWidth = width
      char.tempHeight = actualBoundingBoxAscent + actualBoundingBoxDescent
      char.tempAscent = actualBoundingBoxAscent
      char.tempDescent = actualBoundingBoxDescent
    }
    return char
  }

  /**
   * 计算段落中的数据
   * @param paragraph 段落对象
   * @param startRowIndex 从第几行开始计算
   */
  private computeParagraph(paragraph: Paragraph, startRowIndex = 0) {
    paragraph.rows = paragraph.rows.slice(0, startRowIndex)
    const rows = paragraph.rows.slice(startRowIndex)
    // 字符数据收集
    const chars: Char[] = []
    rows.forEach((row: Row) => {
      row.charBlocks.forEach((charBlock: CharBlock) => {
        const style = this._richTextDocument.styles.getStyle(charBlock.styleId) as Style
        charBlock.chars.forEach((char) => {
          char.tempStyleId = charBlock.styleId
          char = this._geSizeInitChar(char, style)
          chars.push(char)
        })
      })
    })
    // 字符数据重新摆放
    const newRows: Row[] = []
    newRows.push(new Row())
    chars.forEach((char) => {
      const currentNewRow = newRows[newRows.length - 1]
      if (currentNewRow.charBlocks.length === 0) {
        currentNewRow.charBlocks.push(new CharBlock(this._richTextDocument.styles.currentStyleId))
      }
      const cureentCharBlock = currentNewRow.charBlocks[currentNewRow.charBlocks.length - 1]
      if (!cureentCharBlock.styleId) {
        cureentCharBlock.styleId = char.tempStyleId
      }
      // 开发将char放置到合适位置
      if (currentNewRow.width + char.tempWidth <= paragraph.width && char.val !== '\n') {
        if (cureentCharBlock.styleId === char.tempStyleId) {
          cureentCharBlock.chars.push(char)
          cureentCharBlock.width += char.tempWidth
        } else {
          currentNewRow.charBlocks.push(cureentCharBlock)
        }
        const style = this._richTextDocument.styles.getStyle(char.tempStyleId) as Style
        currentNewRow.width += char.tempWidth
        currentNewRow.height = Math.max(currentNewRow.height, char.tempHeight * style.lineHeight) // 保存当前行实际最高的文本高度
        currentNewRow.originHeight = Math.max(currentNewRow.originHeight, char.tempHeight) // 保存当前行原始最高的文本高度
        currentNewRow.descent = Math.max(currentNewRow.descent, char.tempDescent) // 保存当前行最大的descent
      } else {
        newRows.push(currentNewRow)
      }
    })
    paragraph.rows.concat(newRows)
  }

  // 处理输入事件
  onInput(e: InputEvent) {
    const data = e.data // 获取输入的数据
    if (!data || this._isCompositing) {
      return
    }

    this._deleteRnageChars()
    const charBlock = new CharBlock(this._richTextDocument.styles.currentStyleId)
    data.split('').forEach((val) => {
      charBlock.chars.push(new Char(val))
    })

    this._richTextDocument.paragraphs[this._selectionRange.startCursorInfo?.paragraphIndex as number].rows[this._selectionRange.startCursorInfo?.rowIndex as number].charBlocks.splice(
      this._selectionRange.startCursorInfo?.charBlockIndex as number,
      0,
      charBlock,
    )
    this.computeParagraph(this._richTextDocument.paragraphs[this._selectionRange.startCursorInfo?.paragraphIndex as number])
    this._renderRichTextDocument()
    const startCursorInfo = this._selectionRange.startCursorInfo as IcursorInfo
    startCursorInfo.charBlockIndex = startCursorInfo?.charBlockIndex + 1
    this._selectionRange.updateArea(this._richTextDocument)
  }

  // 聚焦输入
  focus() {
    if (!this._textareaEl) {
      // 如果文本输入元素不存在
      this._textareaEl = document.createElement('textarea')
      this._textareaEl.style.position = 'fixed'
      this._textareaEl.style.left = '-99999px'
      this._textareaEl.style.top = '5px'
      this._textareaEl.style.left = '5px'
      this._textareaEl.style.zIndex = '99999'
      this._textareaEl.style.background = 'red'
      this._textareaEl.addEventListener('input', (e: Event) => {
        console.log(705, e)
        this.onInput(e as InputEvent)
      }) // 监听输入事件
      this._textareaEl.addEventListener('compositionstart', () => (this._isCompositing = true)) // 监听组合输入开始
      this._textareaEl.addEventListener('compositionend', () => (this._isCompositing = false)) // 监听组合输入结束
      this._textareaEl.addEventListener('keydown', this.onKeydown.bind(this)) // 监听按键事件
      this._textareaEl.addEventListener('blur', () => this._cursor.hideCursor()) // 监听失焦事件
      document.body.appendChild(this._textareaEl) // 添加到body
      const timer = setTimeout(() => {
        ;(this._textareaEl as HTMLElement).focus() // 聚焦文本输入元素
        clearTimeout(timer)
      }, 20)
    } else {
      this._textareaEl.focus()
    }
  }

  // 失焦
  blur() {
    // 如果存在文本输入元素，使其失焦
    if (this._textareaEl) {
      this._textareaEl.blur()
    }
  }

  // 处理按键事件
  onKeydown(e: KeyboardEvent) {
    switch (
      e.key // 根据按键执行不同操作
    ) {
      case 'Backspace': // 退格键
        this._deleteRnageChars() // 删除操作
        break
      case 'Enter': // 回车键
        this.newLine() // 换行操作
        break
      case 'ArrowLeft': // 左箭头
        break
      case 'ArrowRight': // 右箭头
        break
      case 'ArrowUp': // 上箭头
        this.moveCursorVertically(-1) // 向上移动光标
        break
      case 'ArrowDown': // 下箭头
        this.moveCursorVertically(1) // 向下移动光标
        break
    }
  }

  // 删除范围字符
  private _deleteRnageChars() {
    if (this._selectionRange.startCursorInfo && this._selectionRange.endCursorInfo) {
      this._richTextDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
        // 同一段落时
        if (paragraphIndex === (this._selectionRange.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex === (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row, rowIndex) => {
            // 同一行时
            if (rowIndex === this._selectionRange.startCursorInfo?.rowIndex && rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (charBlockIndex === this._selectionRange.startCursorInfo?.charBlockIndex && charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  charBlock.chars.splice(
                    this._selectionRange.startCursorInfo?.charIndex as number,
                    (this._selectionRange.endCursorInfo?.charIndex as number) - (this._selectionRange.startCursorInfo?.charIndex as number),
                  )
                } else if (charBlockIndex > (this._selectionRange.startCursorInfo?.charBlockIndex as number) && charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.chars.splice(0)
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  charBlock.chars.splice(0, this._selectionRange.endCursorInfo?.charIndex as number)
                }
              })
            } else if (rowIndex > (this._selectionRange.startCursorInfo?.rowIndex as number) && rowIndex < (this._selectionRange.endCursorInfo?.rowIndex as number)) {
              row.charBlocks.forEach((charBlock) => {
                charBlock.chars.splice(0)
              })
            } else if (rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.chars.splice(0)
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  charBlock.chars.splice(0, this._selectionRange.endCursorInfo?.charIndex as number)
                }
              })
            }
          })
        } else if (paragraphIndex > (this._selectionRange.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex < (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row) => {
            row.charBlocks.forEach((charBlock) => {
              charBlock.chars.splice(0)
            })
          })
        } else if (paragraphIndex === (this._selectionRange.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row, rowIndex) => {
            if (rowIndex < (this._selectionRange.endCursorInfo?.rowIndex as number)) {
              row.charBlocks.forEach((charBlock) => {
                charBlock.chars.splice(0)
              })
            } else if (rowIndex === this._selectionRange.endCursorInfo?.rowIndex) {
              row.charBlocks.forEach((charBlock, charBlockIndex) => {
                if (charBlockIndex < (this._selectionRange.endCursorInfo?.charBlockIndex as number)) {
                  charBlock.chars.splice(0)
                } else if (charBlockIndex === this._selectionRange.endCursorInfo?.charBlockIndex) {
                  charBlock.chars.splice(0, this._selectionRange.endCursorInfo?.charIndex as number)
                }
              })
            }
          })
        }
      })
    }
  }

  // 换行操作
  newLine() {
    if (this._selectionRange.startCursorInfo) {
      const row = this._richTextDocument.paragraphs[this._selectionRange.startCursorInfo.paragraphIndex].rows[this._selectionRange.startCursorInfo.rowIndex]
      const charBlocks = row.charBlocks
      const keyCharBlock = charBlocks[this._selectionRange.startCursorInfo.charBlockIndex]
      const charBlockPrev = new CharBlock(this._richTextDocument.styles.currentStyleId)
      charBlockPrev.chars = keyCharBlock.chars.slice(0, this._selectionRange.startCursorInfo.charIndex)
      const n = new Char('\n')
      charBlockPrev.chars.push(n)
      const charBlockAfter = new CharBlock(this._richTextDocument.styles.currentStyleId)
      charBlockAfter.chars = keyCharBlock.chars.slice(this._selectionRange.startCursorInfo.charIndex)
      // 更新row
      row.charBlocks = row.charBlocks.slice(0, this._selectionRange.startCursorInfo.charBlockIndex)
      row.charBlocks[row.charBlocks.length - 1] = charBlockPrev
      //新建row
      const newRow = new Row()
      newRow.charBlocks = row.charBlocks.slice(this._selectionRange.startCursorInfo.charBlockIndex)
      newRow.charBlocks[newRow.charBlocks.length - 1] = charBlockAfter
      this._richTextDocument.paragraphs[this._selectionRange.startCursorInfo.paragraphIndex].rows.splice(this._selectionRange.startCursorInfo.rowIndex, 0, newRow)

      this.computeParagraph(this._richTextDocument.paragraphs[this._selectionRange.startCursorInfo?.paragraphIndex as number])
      this._renderRichTextDocument()
    }
  }

  // 垂直移动光标
  moveCursorVertically(direction: number) {}

  private _renderRichTextDocument() {
    this._richTextDocument.paragraphs.forEach((paragraph) => {
      paragraph.rows.forEach((row) => {
        row.charBlocks.forEach((charBlock) => {
          const style = this._richTextDocument.styles.getStyle(charBlock.styleId) as Style
          this._pageCanvasCtx.font = this._getFontStr(style)
          this._pageCanvasCtx.fillStyle = style.color
          const rowRealY = paragraph.y + row.y
          this._pageCanvasCtx.fillText(charBlock.chars.join(''), charBlock.width, rowRealY + row.height - (row.height - row.originHeight) / 2 - row.descent)
        })
      })
    })
  }

  // 渲染页面
  renderDocument() {
    // 参数控制是否重新计算行信息
    this.clear() // 清除画布
    this._renderRichTextDocument()
  }

  // 清除画布内容
  clear() {
    this._pageCanvasCtx.clearRect(0, 0, this.pageWidth, this.pageHeight) // 清除画布上的所有内容
  }

  // 将窗口坐标转换为画布坐标
  windowToCanvas(e: MouseEvent, canvas: HTMLCanvasElement) {
    const { left, top } = canvas.getBoundingClientRect() // 获取画布在窗口中的位置
    return { x: e.clientX - left, y: e.clientY - top } // 计算画布坐标
  }

  // 将画布坐标转换为容器坐标
  canvasToContainer(x: number, y: number, canvas: HTMLCanvasElement) {
    return { x: x + canvas.offsetLeft, y: y + canvas.offsetTop } // 计算容器坐标
  }
}

class RichTextDocument {
  public paragraphs: Paragraph[] = [] // 文档的段落数组
  public styles: RichTextStyleSheet = new RichTextStyleSheet() // 文档的样式表

  /**
   * RichTextDocument构造函数
   * @param x 相对于页面内边距左上角起点的偏移量
   * @param y 相对于页面内边距左上角起点的偏移量
   * @param width 自定义文档宽度，不能超过页面宽度
   * @param height 文档自增长高度
   */
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}
}

class Paragraph {
  public rows: Row[] = []
  public offscreenCanvasCache: OffscreenCanvas | null = null //绘制缓存
  /**
   * 构造函数
   * @param x 相对于文档起点，通常恒定为0。缩进偏移距离由indentLevel决定
   * @param y 相对于文档起点的y轴位置
   * @param width 恒定为页面宽度100%
   * @param height 跟随rows而自动增长
   */
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}
  public indentLevel = 0 // 缩进级别，默认0
}

class Row {
  public charBlocks: CharBlock[] = [] // 段落内的文本块数组
  public x = 0 // 距离段落起点x轴的偏移量，通常为0
  public y = 0 // 距离段落起点y轴的偏移量
  public width = 0 // 随着CharBlock变化而变化
  public height = 0 //应用行高最大（字符）高度
  public originHeight = 0 // 没有应用行高的最大（字符）原始高度
  public descent = 0 //最大descent值
}

// 定义文本块类，表示一段带有样式的文本
class CharBlock {
  public chars: Char[] = []
  public styleId = '' // 关联的样式ID
  public x = 0
  public width = 0
  constructor(styleId: string) {
    this.styleId = styleId
  }
}

export class Style {
  public fontFamily = 'Arial' // 字体，默认Arial
  public fontSize = 16 // 字体大小，默认16px
  public bold = false // 是否粗体，默认否
  public italic = false // 是否斜体，默认否
  public underline = false // 是否下划线，默认否
  public strikethrough = false // 是否删除线，默认否
  public color = '#ff0000' // 文本颜色，默认红色（之前代码中是#000000，这里改为#ff0000）
  public alignment: 'left' | 'center' | 'right' | 'justify' = 'left' // 文本对齐方式，默认左对齐
  public lineHeight = 1.5 // 行高，默认1.5倍字体大小
  public letterSpacing = 0 // 字符间距，默认0
  public superscript = false // 是否上标，默认否
  public subscript = false // 是否下标，默认否
}

// 定义样式表类，用于管理多种样式
export class RichTextStyleSheet {
  private _styles: Map<string, Style> = new Map() // 使用Map存储样式，键为样式ID，值为Style对象
  public currentStyleId!: string
  constructor() {
    this.addStyle(new Style())
  }
  public addStyle(newStyle: Style): string {
    for (const [key, style] of this._styles) {
      if (areAllPropertiesEqual(style, newStyle)) {
        this.currentStyleId = key
        return key
      }
    }
    // 添加新样式并返回唯一ID
    const id = `style_${this._styles.size}` // 生成样式ID，如style_0, style_1等
    this._styles.set(id, newStyle) // 将样式存入Map
    this.currentStyleId = id
    return id // 返回生成的ID
  }
  public getStyle(id: string): Style | undefined {
    // 根据ID获取样式
    return this._styles.get(id) // 返回对应的Style对象，若不存在则返回undefined
  }
}

class Char {
  public val = '' // 单个字符的值
  // private _x = 0 //绘制文字位置与x无关
  // private _y = 0 //绘制文字位置与y无关
  public tempStyleId = '' //临时记录StyleId，便于分Block
  public tempWidth = 0 //临时记录
  public tempHeight = 0 //临时记录行高，便于CharBlock计算行高
  public tempAscent = 0 //临时记录
  public tempDescent = 0 //临时记录
  constructor(val: string) {
    this.val = val
  }
}

// 定义光标位置类，用于跟踪光标在文档中的位置
interface IcursorInfo {
  x: number
  y: number
  paragraphIndex: number
  rowIndex: number
  charBlockIndex: number
  charIndex: number
  rowHegiht: number
}

// 定义选区类，用于存储框选的起始和结束坐标
class SelectionRange {
  public startCursorInfo: IcursorInfo | null = null
  public endCursorInfo: IcursorInfo | null = null
  private _rangeColor = '#0f0' // 选区高亮颜色（CSS颜色值）
  private _rangeOpacity = 0.5 // 选区透明度（0到1之间的值）
  constructor(private _ctx: CanvasRenderingContext2D) {}
  public setStartCursorInfo(cursorInfo: IcursorInfo): void {
    this.startCursorInfo = cursorInfo
  }
  public setEndCursorInfo(cursorInfo: IcursorInfo | null): void {
    if (cursorInfo && this.startCursorInfo) {
      if (
        cursorInfo.paragraphIndex === this.startCursorInfo.paragraphIndex ||
        cursorInfo.rowIndex === this.startCursorInfo.rowIndex ||
        cursorInfo.charBlockIndex === this.startCursorInfo.charBlockIndex ||
        cursorInfo.charIndex === this.startCursorInfo.charIndex ||
        cursorInfo.charIndex < this.startCursorInfo.charIndex
      ) {
        return
      } else if (
        cursorInfo.paragraphIndex < this.startCursorInfo.paragraphIndex ||
        cursorInfo.rowIndex < this.startCursorInfo.rowIndex ||
        cursorInfo.charBlockIndex < this.startCursorInfo.charBlockIndex ||
        cursorInfo.charIndex < this.startCursorInfo.charIndex ||
        cursorInfo.charIndex < this.startCursorInfo.charIndex
      ) {
        this.endCursorInfo = this.startCursorInfo
        this.startCursorInfo = cursorInfo
      } else {
        this.endCursorInfo = cursorInfo
      }
    } else {
      this.endCursorInfo = null
    }
  }
  public updateArea(richTextDocument: RichTextDocument): void {
    // 清除之前的选区
    this.clearArea()
    // 开始绘制选区
    this._ctx.beginPath()
    this._ctx.globalAlpha = this._rangeOpacity
    this._ctx.fillStyle = this._rangeColor
    const drawFullRow = (row: Row) => {
      const x = row.x
      const y = row.y
      const width = row.width
      const height = row.height
      this._ctx.rect(x, y, width, height)
    }
    // 遍历段落和行，绘制选中的区域
    if (this.startCursorInfo && this.endCursorInfo) {
      richTextDocument.paragraphs.forEach((paragraph, paragraphIndex) => {
        // 同一段落时
        if (paragraphIndex === (this.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex === (this.endCursorInfo as IcursorInfo).paragraphIndex) {
          //每个有效段落中绘制
          paragraph.rows.forEach((row, rowIndex) => {
            // 同一行时
            if (rowIndex === this.startCursorInfo?.rowIndex && rowIndex === this.endCursorInfo?.rowIndex) {
              this._ctx.rect(this.startCursorInfo.x, this.startCursorInfo.y, this.endCursorInfo.x - this.startCursorInfo.x, this.startCursorInfo.rowHegiht)
            } else if (rowIndex > (this.startCursorInfo?.rowIndex as number) && rowIndex < (this.endCursorInfo?.rowIndex as number)) {
              drawFullRow(row)
            } else if (rowIndex === this.endCursorInfo?.rowIndex) {
              const x = row.x
              const y = row.y
              const width = this.endCursorInfo.x - x
              const height = row.height
              this._ctx.rect(x, y, width, height)
            }
          })
        } else if (paragraphIndex > (this.startCursorInfo as IcursorInfo).paragraphIndex && paragraphIndex < (this.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row) => {
            drawFullRow(row)
          })
        } else if (paragraphIndex === (this.endCursorInfo as IcursorInfo).paragraphIndex) {
          paragraph.rows.forEach((row, rowIndex) => {
            if (rowIndex < (this.endCursorInfo?.rowIndex as number)) {
              drawFullRow(row)
            } else if (rowIndex === this.endCursorInfo?.rowIndex) {
              const x = row.x
              const y = row.y
              const width = this.endCursorInfo.x - x
              const height = row.height
              this._ctx.rect(x, y, width, height)
            }
          })
        }
      })

      // 填充选区
      this._ctx.fill()
    }
  }
  public clearArea(): void {
    if (this.startCursorInfo && this.endCursorInfo) {
      this._ctx.clearRect(this.startCursorInfo.x, this.startCursorInfo.y, this.endCursorInfo.x - this.startCursorInfo.x, this.endCursorInfo.y + this.endCursorInfo.rowHegiht - this.startCursorInfo.y)
    }
  }
}

class Cursor {
  private _x = 0
  private _y = 0
  private readonly _width = 2 // 光标宽度
  private readonly _height = 10 // 光标高度

  private _cursorImageData!: ImageData
  private _cursorShowTimer!: NodeJS.Timeout
  private _cursorHideTimer!: NodeJS.Timeout
  constructor(private _ctx: CanvasRenderingContext2D) {
    this._initCursorImageData()
  }
  private _initCursorImageData() {
    this._ctx.clearRect(0, 0, this._width, this._height)
    this._ctx.beginPath()
    this._ctx.lineTo(this._width, 0)
    this._ctx.moveTo(this._width / 2, 0)
    this._ctx.lineTo(this._width / 2, this._height)
    this._ctx.moveTo(0, this._height)
    this._ctx.lineTo(this._width, this._height)
    this._ctx.stroke()
    this._cursorImageData = this._ctx.getImageData(0, 0, this._width, this._height)
    this._ctx.clearRect(0, 0, this._width, this._height)
  }
  public updatePosition(x: number, y: number): void {
    this._ctx.clearRect(this._x, this._y, this._width, this._height)
    this._x = x - this._width / 2
    this._y = y - this._height / 2
    this._cursorBlink()
  }
  public hideCursor(): void {
    this._ctx.clearRect(this._x, this._y, this._width, this._height)
    clearInterval(this._cursorShowTimer)
    clearInterval(this._cursorHideTimer)
  }
  private _cursorBlink() {
    if (this._cursorShowTimer) {
      clearInterval(this._cursorShowTimer)
    }
    if (this._cursorHideTimer) {
      clearInterval(this._cursorHideTimer)
    }
    this._ctx.putImageData(this._cursorImageData, this._x, this._y)
    const timer = setTimeout(() => {
      this._cursorShowTimer = setInterval(() => {
        this._ctx.clearRect(this._x, this._y, this._width, this._height)
      }, 500)
      clearTimeout(timer)
    }, 500)
    this._cursorHideTimer = setInterval(() => {
      this._ctx.clearRect(this._x, this._y, this._width, this._height)
    }, 500)
  }
}
