<template>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import * as math from '../../core/utils/math/math'
import { get2linesAngle, getArcParamsBy3Points, getLineSlope, rotatePointByOrigin } from '../../core/utils/math/math'
onMounted(() => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const devicePixelRatio = window.devicePixelRatio || 1 // 获取设备像素比
  console.log('devicePixelRatio', devicePixelRatio)
  ctx.canvas.width = 800 * devicePixelRatio
  ctx.canvas.height = 400 * devicePixelRatio

  const p1 = { x: 300, y: 200 } // 设置点p1的坐标
  const p2 = { x: 200, y: 300 } // 设置点p2的坐标

  // 绘制直线p1-p2
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()

  // 监听鼠标移动事件
  canvas.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX - canvas.getBoundingClientRect().left) * devicePixelRatio
    const mouseY = (e.clientY - canvas.getBoundingClientRect().top) * devicePixelRatio
    const p3 = { x: mouseX, y: mouseY }
    // 线段与水平线之间的夹角弧度
    const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    // 旋转坐标，便于计算
    const [p1new, p2new, p3new] = [p1, p2, p3].map(point => {
      return rotatePointByOrigin(point, p1, -radians)
    })
    const distance = math.calculateDistance(p2new, p3new)
    // 计算圆的半径
    const radius = Math.abs((distance / 2) / Math.sin(get2linesAngle(p1new, p2new, p2new, p3new)))

    // 清除画布并重新绘制圆
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制直线p1-p2
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()

    // 绘制圆弧
    ctx.beginPath()
    let newCenter
    let anticlockwise = false
    if (p3new.y < p2new.y) {
      newCenter = { x: p2new.x, y: p2new.y - radius }
      if (p2new.x < p1new.x) {
        anticlockwise = false
      } else {
        anticlockwise = true
      }
    } else {
      newCenter = { x: p2new.x, y: p2new.y + radius }
      if (p2new.x < p1new.x) {
        anticlockwise = true
      } else {
        anticlockwise = false
      }
    }

    // 旋转回去
    const [p2old, p3old, center] = [p2new, p3new, newCenter].map(point => {
      return rotatePointByOrigin(point, p1new, radians)
    })
    const params = getArcParamsBy3Points(center, p2old, p3old, anticlockwise)
    ctx.arc(...params)
    ctx.stroke()
  })
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 800px;
  height: 400px;
}
</style>
