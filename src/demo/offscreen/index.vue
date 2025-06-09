<template>
    <div>
      <h1>Canvas Rendering Examples</h1>

      <!-- 常规Canvas渲染 -->
      <h2>Regular Canvas Rendering</h2>
      <canvas ref="regularCanvas" @mousemove="regularMouseMove" width="400" height="200"></canvas>

      <!-- Canvas离屏渲染 -->
      <h2>Offscreen Canvas Rendering</h2>
      <canvas ref="offscreenCanvas" @mousemove="offscreenMouseMove" width="400" height="200"></canvas>
    </div>
  </template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup () {
    // 常规Canvas渲染
    const regularCanvas = ref(null)
    let regularCtx

    // Canvas离屏渲染
    const offscreenCanvas = ref(null)
    let offscreenCtx

    const regularMouseMove = (event) => {
      const x = event.clientX - regularCanvas.value.getBoundingClientRect().left
      const y = event.clientY - regularCanvas.value.getBoundingClientRect().top

      // 清空画布
      regularCtx.clearRect(0, 0, regularCanvas.value.width, regularCanvas.value.height)

      // 绘制背景
      regularCtx.fillStyle = 'lightgray'
      regularCtx.fillRect(0, 0, regularCanvas.value.width, regularCanvas.value.height)

      // 绘制移动的圆圈
      regularCtx.fillStyle = 'blue'
      regularCtx.beginPath()
      regularCtx.arc(x, y, 20, 0, Math.PI * 2)
      regularCtx.fill()
    }

    const offscreenMouseMove = (event) => {
      const x = event.clientX - offscreenCanvas.value.getBoundingClientRect().left
      const y = event.clientY - offscreenCanvas.value.getBoundingClientRect().top

      // 清空离屏画布
      offscreenCtx.clearRect(0, 0, offscreenCanvas.value.width, offscreenCanvas.value.height)

      // 绘制背景（在离屏画布上进行渲染）
      offscreenCtx.fillStyle = 'lightgray'
      offscreenCtx.fillRect(0, 0, offscreenCanvas.value.width, offscreenCanvas.value.height)

      // 绘制移动的圆圈（在离屏画布上进行渲染）
      offscreenCtx.fillStyle = 'blue'
      offscreenCtx.beginPath()
      offscreenCtx.arc(x, y, 20, 0, Math.PI * 2)
      offscreenCtx.fill()

      // 将离屏画布的内容绘制到主画布上
      const mainCtx = regularCanvas.value.getContext('2d')
      mainCtx.clearRect(0, 0, regularCanvas.value.width, regularCanvas.value.height)
      mainCtx.drawImage(offscreenCanvas.value, 0, 0)
    }

    onMounted(() => {
      // 获取Canvas上下文
      regularCtx = regularCanvas.value.getContext('2d')
      offscreenCtx = offscreenCanvas.value.getContext('2d')
    })

    return {
      regularCanvas,
      offscreenCanvas,
      regularMouseMove,
      offscreenMouseMove
    }
  }
}
</script>

  <style scoped>
  canvas {
    border: 1px solid #000;
    margin-bottom: 20px;
  }
  </style>
