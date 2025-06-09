<template>
  <div>scale和devicePixelRatio</div>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const devicePixelRatio = window.devicePixelRatio || 1 // 获取设备像素比
  ctx.canvas.width = 1000 * devicePixelRatio
  ctx.canvas.height = 1000 * devicePixelRatio
  ctx.fillStyle = 'lightblue' // 例如，设置为浅蓝色
  ctx.fillRect(0, 0, 200, 200)
  ctx.fillStyle = 'green'
  ctx.fillRect(20, 20, 400, 400)
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 1000px;
  height: 1000px;
}
</style>
