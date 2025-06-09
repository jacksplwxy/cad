<template>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  const devicePixelRatio = window.devicePixelRatio || 1 // 获取设备像素比
  ctx.canvas.width = 1500 * devicePixelRatio
  ctx.canvas.height = 1000 * devicePixelRatio
  // ctx.translate(-100, -100)
  // ctx.scale(10)
  const controlPoints = [

    // { x: 200, y: 200 },
    // { x: 300, y: 100 },
    // { x: 400, y: 200 }
    // { x: 500, y: 100 }
    { x: 100, y: 100 },
    { x: 100, y: 100 },
    { x: 200, y: 200 },
    { x: 300, y: 100 }
    // { x: 0, y: 0 }
    // { x: 400, y: 0 }
    // { x: 200, y: 300 },
    // { x: 100, y: 100 }
  ]

  // 根据控制点绘制 B 样条曲线
  function drawBSpline () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.moveTo(controlPoints[0].x, controlPoints[0].y)

    const n = controlPoints.length - 1

    for (let i = 0; i < n - 2; i++) {
      const p0 = controlPoints[i]
      const p1 = controlPoints[i + 1]
      const p2 = controlPoints[i + 2]
      const p3 = controlPoints[i + 3]

      ctx.bezierCurveTo(
        p1.x, p1.y,
        p2.x, p2.y,
        p3.x, p3.y
      )
    }

    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // 调用绘制 B 样条曲线函数
  drawBSpline()
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 1500px;
  height: 1000px;
}
</style>
