<template>
  <div v-if="showToolbar" class="toolbar" :style="{ left: toolbarX + 'px', top: toolbarY + 'px' }">
    <select v-model="fontFamily" style="width: 100px; margin-right: 6px" @change="exec('fontFamily')">
      <option v-for="item in fontFamilyList" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
    <div class="btn sizeAdd" @click="exec('sizeAdd')">字体+</div>
    <div class="btn sizeMinus" @click="exec('sizeMinus')">字体-</div>
    <div class="btn bold" :class="{ active: isBold }" @click="exec('bold')">字体粗</div>
    <div class="btn italic" :class="{ active: isItalic }" @click="exec('italic')">字体斜</div>
    <div class="btn underline" :class="{ active: isUnderline }" @click="exec('underline')">下划线</div>
    <div class="btn linethrough" :class="{ active: isLinethrough }" @click="exec('linethrough')">删除线</div>
    <input v-model="color" type="color" @input="exec('color')" />
    <input v-model="background" type="color" @input="exec('background')" />
    <select v-model="lineHeight" @change="exec('lineHeight')">
      <option v-for="item in lineHeightList" :key="item.value" :value="item.value">{{ item.label }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, Ref } from 'vue'
import { IChar, ITextEditorOptions, TextEditorEvents } from '@/core/text/TextEditor'
import { textEditor } from '@/core/cad'
import data from './mock'

const fontFamilyList = [
  {
    label: '微软雅黑',
    value: 'Yahei',
  },
  {
    label: '宋体',
    value: '宋体',
  },
  {
    label: '黑体',
    value: '黑体',
  },
  {
    label: '仿宋',
    value: '仿宋',
  },
  {
    label: '楷体',
    value: '楷体',
  },
  {
    label: '华文琥珀',
    value: '华文琥珀',
  },
  {
    label: '华文楷体',
    value: '华文楷体',
  },
  {
    label: '华文隶书',
    value: '华文隶书',
  },
  {
    label: '华文新魏',
    value: '华文新魏',
  },
  {
    label: '华文行楷',
    value: '华文行楷',
  },
  {
    label: '华文中宋',
    value: '华文中宋',
  },
  {
    label: '华文彩云',
    value: '华文彩云',
  },
  {
    label: 'Arial',
    value: 'Arial',
  },
  {
    label: 'Segoe UI',
    value: 'Segoe UI',
  },
  {
    label: 'Ink Free',
    value: 'Ink Free',
  },
  {
    label: 'Fantasy',
    value: 'Fantasy',
  },
]

const lineHeightList = [
  {
    label: '1',
    value: 1,
  },
  {
    label: '1.25',
    value: 1.25,
  },
  {
    label: '1.5',
    value: 1.5,
  },
  {
    label: '1.75',
    value: 1.75,
  },
  {
    label: '2',
    value: 2,
  },
  {
    label: '2.5',
    value: 2.5,
  },
  {
    label: '3',
    value: 3,
  },
]

const showToolbar = ref(false)
const toolbarX = ref(0)
const toolbarY = ref(0)
const fontFamily = ref('Yahei')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isLinethrough = ref(false)
const color = ref('')
const background = ref('')
const lineHeight = ref(1.5)

onMounted(() => {
  textEditor.removeAllListeners()
  textEditor.addEventListener(TextEditorEvents.SHOWTEXTEDITOR, (options: ITextEditorOptions) => {
    toolbarX.value = options.canvasLeft
    toolbarY.value = options.canvasTop - 50
    showToolbar.value = true
  })
  textEditor.addEventListener(TextEditorEvents.POSITIONINDEXUPDATE, (positionIndex: number) => {
    checkStyle(textEditor.data[positionIndex])
  })
  textEditor.addEventListener(TextEditorEvents.RANGECHAGE, (range: [number, number]) => {
    if (range.length > 0) {
      let { color: defaultColor, fontFamily: defaultFontFamily } = textEditor.options
      let first = textEditor.data[range[0]]
      fontFamily.value = first.fontFamily || defaultFontFamily
      color.value = first.color || defaultColor
      background.value = first.background || ''
      let isAllBold = true
      let isAllItalic = true
      let isAllUnderline = true
      let isAllLinethrough = true
      for (let i = range[0]; i <= range[1]; i++) {
        let cur = textEditor.data[i]
        if (!cur.bold) {
          isAllBold = false
        }
        if (!cur.italic) {
          isAllItalic = false
        }
        if (!cur.underline) {
          isAllUnderline = false
        }
        if (!cur.linethrough) {
          isAllLinethrough = false
        }
      }
      isBold.value = isAllBold
      isItalic.value = isAllItalic
      isUnderline.value = isAllUnderline
      isLinethrough.value = isAllLinethrough
    }
  })
})

function checkStyle(item: IChar) {
  if (item) {
    let { color: defaultColor, fontFamily: defaultFontFamily, lineHeight: defaultLineHeight } = textEditor.options
    fontFamily.value = item.fontFamily || defaultFontFamily
    isBold.value = !!item.bold
    isItalic.value = !!item.italic
    isUnderline.value = !!item.underline
    isLinethrough.value = !!item.linethrough
    color.value = item.color || defaultColor
    background.value = item.background || ''
    lineHeight.value = item.lineHeight || defaultLineHeight
  }
}

function exec(command: string) {
  let range = textEditor.getRange()
  if (range.length > 0) {
    if (command === 'bold') {
      isBold.value = !isBold.value
    } else if (command === 'italic') {
      isItalic.value = !isItalic.value
    } else if (command === 'underline') {
      isUnderline.value = !isUnderline.value
    } else if (command === 'linethrough') {
      isLinethrough.value = !isLinethrough.value
    }
    for (let i = range[0]; i <= range[1]; i++) {
      let cur = textEditor.data[i]
      switch (command) {
        case 'fontFamily':
          cur.fontFamily = fontFamily.value
          break
        case 'sizeAdd':
          cur.fontSize = (cur.fontSize || textEditor.options.fontSize) + 1
          break
        case 'sizeMinus':
          cur.fontSize = (cur.fontSize || textEditor.options.fontSize) - 1
          break
        case 'bold':
          cur.bold = isBold.value
          break
        case 'italic':
          cur.italic = isItalic.value
          break
        case 'underline':
          cur.underline = isUnderline.value
          break
        case 'linethrough':
          cur.linethrough = isLinethrough.value
          break
        case 'color':
          cur.color = color.value
          break
        case 'background':
          cur.background = background.value
          break
        case 'lineHeight':
          cur.lineHeight = lineHeight.value
          break
        default:
          break
      }
    }
  }
  textEditor.render()
}
</script>

<style scoped>
.toolbar {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 6px 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #efefef;
  z-index: 999;
  font-size: 12px;
}

.toolbar .btn {
  width: 40px;
  height: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 1px;
}

.toolbar .btn:hover,
.toolbar .btn.active {
  background: rgba(25, 55, 88, 0.04);
}

.toolbar .btn i {
  width: 10px;
  height: 10px;
  display: inline-block;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.sizeAdd i {
  background-image: url('./assets/image/size-add.svg');
}

.sizeMinus i {
  background-image: url('./assets/image/size-minus.svg');
}

.bold i {
  background-image: url('./assets/image/bold.svg');
}

.italic i {
  background-image: url('./assets/image/italic.svg');
}

.underline i {
  background-image: url('./assets/image/underline.svg');
}

.linethrough i {
  background-image: url('./assets/image/strikeout.svg');
}
</style>
