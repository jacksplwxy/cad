<template>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  // B-Spline Curve Function
  function bSpline (t, p0, p1, p2, p3) {
    const c0 = (1 - t) ** 3 / 6
    const c1 = (3 * t ** 3 - 6 * t ** 2 + 4) / 6
    const c2 = (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6
    const c3 = t ** 3 / 6

    const x = c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x
    const y = c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y

    return { x, y }
  }

  // Draw B-Spline Curve
  function drawBSplineCurve (points) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    for (let i = 0; i < points.length - 3; i++) {
      for (let t = 0; t <= 1; t += 0.01) {
        const p = bSpline(t, points[i], points[i + 1], points[i + 2], points[i + 3])
        ctx.lineTo(p.x, p.y)
      }
    }

    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Example Control Points
  const controlPoints = [
    { x: 0, y: 0 },
    { x: 50, y: 20 },
    { x: 100, y: 50 },
    { x: 50, y: 100 },
    { x: 20, y: 20 }
  ]

  drawBSplineCurve(controlPoints)
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 400px;
  height: 400px;
}
</style>
