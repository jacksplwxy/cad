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
  console.log('devicePixelRatio', devicePixelRatio)
  ctx.canvas.width = 1500 * devicePixelRatio
  ctx.canvas.height = 1000 * devicePixelRatio
  ctx.scale(10, 10)
  ctx.strokeStyle = 'lightblue' // 例如，设置为浅蓝色
  ctx.strokeRect(0, 0, 200, 200)
  ctx.scale(1, 1)
  ctx.strokeStyle = 'green'
  ctx.strokeRect(100, 100, 400, 400)
  ctx.font = '24px STheiti, SimHei'
  ctx.fillText('王兴宇wangxingyu', 10, 10)
  drawTeacup(ctx)
})

function drawTeacup (ctx) {
  ctx.translate(-100, -100)
  // 绘制茶杯的杯身
  ctx.beginPath()
  ctx.moveTo(100, 200) // 左上角起点
  ctx.bezierCurveTo(100, 100, 300, 100, 300, 200) // 贝塞尔曲线
  ctx.lineTo(300, 250) // 右下角
  ctx.bezierCurveTo(300, 350, 100, 350, 100, 250) // 贝塞尔曲线
  ctx.closePath()
  ctx.fillStyle = 'brown' // 茶杯颜色
  ctx.fill()

  // 绘制茶杯的把手
  ctx.beginPath()
  ctx.moveTo(150, 225) // 把手起点
  ctx.quadraticCurveTo(200, 180, 250, 225) // 二次贝塞尔曲线
  ctx.strokeStyle = 'black' // 把手颜色
  ctx.lineWidth = 10 // 把手线宽
  ctx.stroke()
}

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 1500px;
  height: 1000px;
}
</style>
