<template>
  <div>save和store</div>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted, withCtx } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D
  const devicePixelRatio = window.devicePixelRatio || 1 // 获取设备像素比

  console.log('devicePixelRatio', devicePixelRatio)
  ctx.canvas.width = 1000
  ctx.canvas.height = 1000
  // ctx.scale(50, 50)

  ctx.fillStyle = 'lightblue'
  ctx.fillRect(0, 0, 100, 100)

  ctx.save()
  ctx.translate(50, 50)
  ctx.fillStyle = 'yellow'
  ctx.fillRect(0, 0, 100, 100)
  ctx.fillStyle = 'blue'
  ctx.fillRect(50, 50, 100, 100)
  ctx.restore()
  ctx.fillRect(150, 150, 100, 100)
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 1000px;
  height: 1000px;
}
</style>
