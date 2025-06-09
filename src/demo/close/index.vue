<template>
  <canvas id="myCanvas" width="400" height="400" style="border:1px solid #000;"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('myCanvas')
  const ctx = canvas.getContext('2d')

  // Example line data (replace with your actual data)
  const lines = [
    { startX: 100, startY: 100, endX: 200, endY: 100 },
    { startX: 200, startY: 100, endX: 250, endY: 230 },
    { startX: 400, startY: 500, endX: 100, endY: 200 },
    { startX: 100, startY: 200, endX: 100, endY: 100 },
    { startX: 120, startY: 300, endX: 100, endY: 100 }
  ]

  // Draw lines on the canvas
  ctx.beginPath()
  lines.forEach(line => {
    ctx.moveTo(line.startX, line.startY)
    ctx.lineTo(line.endX, line.endY)
  })
  ctx.stroke()

  document.addEventListener('click', (e) => {
    const pickPoint = { x: e.clientX, y: e.clientY } // Example pick point
    const isInsideClosedRegion = checkIfInsideClosedRegion(pickPoint, lines)
    console.log('Is Inside Closed Region:', isInsideClosedRegion)
  })
  // Check if the pick point is inside a closed region

  function checkIfInsideClosedRegion (point, lines) {
  // Implement your logic to check if the point is inside a closed region
  // You may use algorithms like ray casting or winding number to determine this
  // For simplicity, this example checks if the point is inside a rectangle
    return (
      point.x > 100 &&
        point.x < 200 &&
        point.y > 100 &&
        point.y < 200
    )
  }
})
</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 400px;
  height: 400px;
}
</style>
