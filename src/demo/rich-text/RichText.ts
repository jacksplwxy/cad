export class RichText {
  constructor(container, data, options = {}) {
    this.container = container // 容器元素
    this.data = data // 数据
    this.options = Object.assign(
      {
        pageWidth: 794, // 纸张宽度
        pageHeight: 1123, // 纸张高度
        pagePadding: [100, 120, 100, 120], // 纸张内边距，分别为：上、右、下、左
        pageMargin: 20, // 页面之间的间隔
        pagePaddingIndicatorSize: 35, // 纸张内边距指示器的大小，也就是四个直角的边长
        pagePaddingIndicatorColor: '#BABABA', // 纸张内边距指示器的颜色，也就是四个直角的边颜色
        color: '#333', // 文字颜色
        fontSize: 16, // 字号
        fontFamily: 'Yahei', // 字体
        lineHeight: 1.5, // 行高，倍数
        rangeColor: '#bbdfff', // 选区颜色
        rangeOpacity: 0.6, // 选区透明度
      },
      options,
    )
    this.pageCanvasList = [] // 页面canvas列表
    this.pageCanvasCtxList = [] // 页面canvas绘图上下文列表
    this.rows = [] // 渲染的行数据
    this.positionList = [] // 定位元素列表
    this.cursorPositionIndex = -1 // 当前光标所在元素索引
    this.cursorEl = null // 光标元素
    this.cursorTimer = null // 光标元素闪烁的定时器
    this.textareaEl = null // 文本输入框元素
    this.isCompositing = false // 是否正在输入拼音
    this.isMousedown = false // 鼠标是否按下
    this.range = [] // 当前选区，第一个元素代表选区开始元素位置，第二个元素代表选区结束元素位置
    this.mousemoveTimer = null
    this.listeners = {
      mousedown: null,
      rangeChange: null,
    }

    this.createPage(0)
    this.render()
    document.body.addEventListener('mousemove', this.onMousemove.bind(this))
    document.body.addEventListener('mouseup', this.onMouseup.bind(this))
  }

  // 渲染
  render(notComputeRows) {
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
    let { pageWidth, pageHeight } = this.options
    this.pageCanvasCtxList.forEach((item) => {
      item.clearRect(0, 0, pageWidth, pageHeight)
    })
  }

  // 渲染页面
  renderPage() {
    let { pageHeight, pagePadding } = this.options
    // 页面内容实际可用高度
    let contentHeight = pageHeight - pagePadding[0] - pagePadding[2]
    // 从第一页开始绘制
    let pageIndex = 0
    let ctx = this.pageCanvasCtxList[pageIndex]
    // 当前页绘制到的高度
    let renderHeight = 0
    // 绘制四个角
    this.renderPagePaddingIndicators(pageIndex)
    this.rows.forEach((row, index) => {
      if (renderHeight + row.height > contentHeight) {
        // 当前页绘制不下，需要创建下一页
        pageIndex++
        // 下一页没有创建则先创建
        let page = this.pageCanvasList[pageIndex]
        if (!page) {
          this.createPage(pageIndex)
        }
        this.renderPagePaddingIndicators(pageIndex)
        ctx = this.pageCanvasCtxList[pageIndex]
        renderHeight = 0
      }
      // 绘制当前行
      this.renderRow(ctx, renderHeight, row, pageIndex, index)
      // 更新当前页绘制到的高度
      renderHeight += row.height
    })
  }

  // 渲染页面中的一行
  renderRow(ctx, renderHeight, row, pageIndex, rowIndex) {
    let { color, pagePadding, rangeColor, rangeOpacity } = this.options
    // 内边距
    let offsetX = pagePadding[3]
    let offsetY = pagePadding[0]
    // 当前行绘制到的宽度
    let renderWidth = offsetX
    renderHeight += offsetY
    row.elementList.forEach((item) => {
      // 收集positionList
      this.positionList.push({
        ...item,
        pageIndex, // 所在页
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
      ctx.font = item.font
      ctx.fillStyle = item.color || color
      ctx.fillText(item.value, renderWidth, renderHeight + row.height - (row.height - row.originHeight) / 2 - row.descent)
      // 渲染选区
      if (this.range.length === 2 && this.range[0] !== this.range[1]) {
        // 根据鼠标前后位置调整选区位置
        let range = this.getRange()
        let positionIndex = this.positionList.length - 1
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
    // 辅助线
    // ctx.beginPath()
    // ctx.moveTo(pagePadding[3], renderHeight + row.height)
    // ctx.lineTo(673, renderHeight + row.height)
    // ctx.stroke()
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
    let { pageWidth, pagePadding, lineHeight, fontSize } = this.options
    // 实际内容可用宽度
    let contentWidth = pageWidth - pagePadding[1] - pagePadding[3]
    // 创建一个临时canvas用来测量文本宽高
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // 行数据
    let rows = []
    rows.push({
      width: 0,
      height: 0,
      originHeight: 0, // 没有应用行高的原始高度
      descent: 0, // 行内元素最大的descent
      elementList: [],
    })
    this.data.forEach((item) => {
      let { value, lineheight } = item
      // 实际行高倍数
      let actLineHeight = lineheight || lineHeight
      // 获取文本宽高
      let font = this.getFontStr(item)
      // 尺寸信息
      let info = {
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
        let { width, actualBoundingBoxAscent, actualBoundingBoxDescent } = ctx.measureText(value)
        info.width = width
        info.height = actualBoundingBoxAscent + actualBoundingBoxDescent
        info.ascent = actualBoundingBoxAscent
        info.descent = actualBoundingBoxDescent
      }
      // 完整数据
      let element = {
        ...item,
        info,
        font,
      }
      // 判断当前行是否能容纳
      let curRow = rows[rows.length - 1]
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
  getFontStr(element) {
    let { fontSize, fontFamily } = this.options
    return `${element.italic ? 'italic ' : ''} ${element.bold ? 'bold ' : ''} ${element.size || fontSize}px  ${element.fontfamily || fontFamily} `
  }

  // 创建页面
  createPage(pageIndex) {
    let { pageWidth, pageHeight, pageMargin } = this.options
    let canvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio
    canvas.width = pageWidth * dpr
    canvas.height = pageHeight * dpr
    canvas.style.width = pageWidth + 'px'
    canvas.style.height = pageHeight + 'px'
    canvas.style.cursor = 'text'
    canvas.style.backgroundColor = '#fff'
    canvas.style.boxShadow = '#9ea1a566 0 2px 12px'
    canvas.style.marginBottom = pageMargin + 'px'
    canvas.addEventListener('mousedown', (e) => {
      this.onMousedown(e, pageIndex)
    })
    this.container.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    this.pageCanvasList.push(canvas)
    this.pageCanvasCtxList.push(ctx)
  }

  // 页面鼠标按下事件
  onMousedown(e, pageIndex) {
    this.isMousedown = true
    // 鼠标按下位置相对于页面canvas的坐标
    let { x, y } = this.windowToCanvas(e, this.pageCanvasList[pageIndex])
    // 计算该坐标对应的元素索引
    let positionIndex = this.getPositionByPos(x, y, pageIndex)
    this.cursorPositionIndex = positionIndex
    // 计算光标位置及渲染
    this.computeAndRenderCursor(positionIndex, pageIndex)
    this.range[0] = positionIndex
    if (this.listeners.mousedown) {
      this.listeners.mousedown(positionIndex)
    }
    // 光标测试辅助线
    // let ctx = this.pageCanvasCtxList[pageIndex]
    // ctx.moveTo(cursorInfo.x, cursorInfo.y)
    // ctx.lineTo(cursorInfo.x, cursorInfo.y + cursorInfo.height)
    // ctx.stroke()
  }

  // 鼠标移动事件
  onMousemove(e) {
    this.mousemoveEvent = e
    if (this.mousemoveTimer) {
      return
    }
    this.mousemoveTimer = setTimeout(() => {
      this.mousemoveTimer = null
      if (!this.isMousedown) {
        return
      }
      e = this.mousemoveEvent
      // 鼠标当前所在页面
      let pageIndex = this.getPosInPageIndex(e.clientX, e.clientY)
      if (pageIndex === -1) {
        return
      }
      // 鼠标位置相对于页面canvas的坐标
      let { x, y } = this.windowToCanvas(e, this.pageCanvasList[pageIndex])
      // 鼠标位置对应的元素索引
      let positionIndex = this.getPositionByPos(x, y, pageIndex)
      if (positionIndex !== -1) {
        this.range[1] = positionIndex
        if (this.listeners.rangeChange) {
          this.listeners.rangeChange(this.getRange())
        }
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
  getPositionByPos(x, y, pageIndex) {
    // 是否点击在某个元素内
    for (let i = 0; i < this.positionList.length; i++) {
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
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
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
      if (y >= cur.rect.leftTop[1] && y <= cur.rect.leftBottom[1]) {
        index = i
      }
    }
    if (index !== -1) {
      return index
    }
    // 返回当前页的最后一个元素
    for (let i = 0; i < this.positionList.length; i++) {
      let cur = this.positionList[i]
      if (cur.pageIndex !== pageIndex) {
        continue
      }
      index = i
    }
    return index
  }

  // 获取光标位置信息
  getCursorInfo(positionIndex) {
    let position = this.positionList[positionIndex]
    let { fontSize, pagePadding, lineHeight } = this.options
    // 光标高度在字号的基础上再高一点
    let height = (position ? position.size : null) || fontSize
    let plusHeight = height / 2
    let actHeight = height + plusHeight
    if (!position) {
      // 当前光标位置处没有元素
      let next = this.positionList[positionIndex + 1]
      if (next) {
        // 存在下一个元素
        let nextCursorInfo = this.getCursorInfo(positionIndex + 1)
        return {
          x: pagePadding[3],
          y: nextCursorInfo.y,
          height: nextCursorInfo.height,
        }
      } else {
        // 不存在下一个元素，即文档为空
        return {
          x: pagePadding[3],
          y: pagePadding[0] + (height * lineHeight - actHeight) / 2,
          height: actHeight,
        }
      }
    }
    // 是否是换行符
    let isNewlineCharacter = position.value === '\n'
    // 元素所在行
    let row = this.rows[position.rowIndex]
    return {
      x: isNewlineCharacter ? position.rect.leftTop[0] : position.rect.rightTop[0],
      y: position.rect.rightTop[1] + row.height - (row.height - row.originHeight) / 2 - actHeight + (actHeight - Math.max(height, position.info.height)) / 2,
      height: actHeight,
    }
  }

  // 计算光标位置及渲染光标
  computeAndRenderCursor(positionIndex, pageIndex) {
    // 根据元素索引计算出光标位置和高度信息
    let cursorInfo = this.getCursorInfo(positionIndex)
    // 渲染光标
    let cursorPos = this.canvasToContainer(cursorInfo.x, cursorInfo.y, this.pageCanvasList[pageIndex])
    this.setCursor(cursorPos.x, cursorPos.y, cursorInfo.height)
  }

  // 设置光标
  setCursor(left, top, height) {
    this.clearRange()
    clearTimeout(this.cursorTimer)
    if (!this.cursorEl) {
      this.cursorEl = document.createElement('div')
      this.cursorEl.style.position = 'absolute'
      this.cursorEl.style.width = '1px'
      this.cursorEl.style.backgroundColor = '#000'
      this.container.appendChild(this.cursorEl)
    }
    this.cursorEl.style.left = left + 'px'
    this.cursorEl.style.top = top + 'px'
    this.cursorEl.style.height = height + 'px'
    this.cursorEl.style.opacity = 1
    setTimeout(() => {
      this.focus()
      this.cursorEl.style.display = 'block'
      this.blinkCursor(0)
    }, 0)
  }

  // 隐藏光标
  hideCursor() {
    clearTimeout(this.cursorTimer)
    this.cursorEl.style.display = 'none'
  }

  // 光标闪烁
  blinkCursor(opacity) {
    this.cursorTimer = setTimeout(() => {
      this.cursorEl.style.opacity = opacity
      this.blinkCursor(opacity === 0 ? 1 : 0)
    }, 600)
  }

  // 聚焦
  focus() {
    if (!this.textareaEl) {
      this.textareaEl = document.createElement('textarea')
      this.textareaEl.style.position = 'fixed'
      this.textareaEl.style.left = '-99999px'
      this.textareaEl.addEventListener('input', this.onInput.bind(this))
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
  onInput(e) {
    setTimeout(() => {
      let data = e.data
      if (!data || this.isCompositing) {
        return
      }
      // 插入字符
      let arr = data.split('')
      let length = arr.length
      let range = this.getRange()
      if (range.length > 0) {
        // 存在选区，则替换选区的内容
        this.delete()
      }
      let cur = this.positionList[this.cursorPositionIndex]
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
      this.computeAndRenderCursor(this.cursorPositionIndex, this.positionList[this.cursorPositionIndex].pageIndex)
    }, 0)
  }

  // 按键事件
  onKeydown(e) {
    if (e.keyCode === 8) {
      this.delete()
    } else if (e.keyCode === 13) {
      this.newLine()
    }
  }

  // 删除
  delete() {
    if (this.cursorPositionIndex < 0) {
      let range = this.getRange()
      if (range.length > 0) {
        // 存在选区，删除选区内容
        let length = range[1] - range[0] + 1
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
    let position = this.positionList[this.cursorPositionIndex]
    this.computeAndRenderCursor(this.cursorPositionIndex, position ? position.pageIndex : 0)
  }

  // 换行
  newLine() {
    this.data.splice(this.cursorPositionIndex + 1, 0, {
      value: '\n',
    })
    this.render()
    this.cursorPositionIndex++
    let position = this.positionList[this.cursorPositionIndex]
    this.computeAndRenderCursor(this.cursorPositionIndex, position.pageIndex)
  }

  // 获取一个坐标在哪个页面
  getPosInPageIndex(x, y) {
    let { left, top, right, bottom } = this.container.getBoundingClientRect()
    // 不在容器范围内
    if (x < left || x > right || y < top || y > bottom) {
      return -1
    }
    let { pageHeight, pageMargin } = this.options
    let scrollTop = this.container.scrollTop
    // 鼠标的y坐标相对于容器顶部的距离
    let totalTop = y - top + scrollTop
    for (let i = 0; i < this.pageCanvasList.length; i++) {
      let pageStartTop = i * (pageHeight + pageMargin)
      let pageEndTop = pageStartTop + pageHeight
      if (totalTop >= pageStartTop && totalTop <= pageEndTop) {
        return i
      }
    }
    return -1
  }

  // 将相对于浏览器窗口的坐标转换成相对于页面canvas
  windowToCanvas(e, canvas) {
    let { left, top } = canvas.getBoundingClientRect()
    return {
      x: e.clientX - left,
      y: e.clientY - top,
    }
  }

  // 将相对于页面canvas的坐标转换成相对于容器元素的
  canvasToContainer(x, y, canvas) {
    return {
      x: x + canvas.offsetLeft,
      y: y + canvas.offsetTop,
    }
  }

  // 绘制页面四个直角指示器
  renderPagePaddingIndicators(pageNo) {
    let ctx = this.pageCanvasCtxList[pageNo]
    if (!ctx) {
      return
    }
    let { pageWidth, pageHeight, pagePaddingIndicatorColor, pagePadding, pagePaddingIndicatorSize } = this.options
    ctx.save()
    ctx.strokeStyle = pagePaddingIndicatorColor
    let list = [
      // 左上
      [
        [pagePadding[3], pagePadding[0] - pagePaddingIndicatorSize],
        [pagePadding[3], pagePadding[0]],
        [pagePadding[3] - pagePaddingIndicatorSize, pagePadding[0]],
      ],
      // 右上
      [
        [pageWidth - pagePadding[1], pagePadding[0] - pagePaddingIndicatorSize],
        [pageWidth - pagePadding[1], pagePadding[0]],
        [pageWidth - pagePadding[1] + pagePaddingIndicatorSize, pagePadding[0]],
      ],
      // 左下
      [
        [pagePadding[3], pageHeight - pagePadding[2] + pagePaddingIndicatorSize],
        [pagePadding[3], pageHeight - pagePadding[2]],
        [pagePadding[3] - pagePaddingIndicatorSize, pageHeight - pagePadding[2]],
      ],
      // 右下
      [
        [pageWidth - pagePadding[1], pageHeight - pagePadding[2] + pagePaddingIndicatorSize],
        [pageWidth - pagePadding[1], pageHeight - pagePadding[2]],
        [pageWidth - pagePadding[1] + pagePaddingIndicatorSize, pageHeight - pagePadding[2]],
      ],
    ]
    list.forEach((item) => {
      item.forEach((point, index) => {
        if (index === 0) {
          ctx.beginPath()
          ctx.moveTo(...point)
        } else {
          ctx.lineTo(...point)
        }
        if (index >= item.length - 1) {
          ctx.stroke()
        }
      })
    })
    ctx.restore()
  }
}
