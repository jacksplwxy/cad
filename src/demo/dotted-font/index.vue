<template>
<canvas id="myCanvas" width="400" height="400" style="border:1px solid #000;"></canvas>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('myCanvas')
  const context = canvas.getContext('2d')

  function drawDashedText (text, x, y, dashLength) {
    // const dashArray = text.split('').map(char => {
    //   console.log(111111, context.measureText(char))
    //   return context.measureText(char).width + dashLength
    // })
    // const currentX = x

    context.beginPath()
    // for (let i = 0; i < text.length; i++) {
    //   context.moveTo(currentX, y)
    //   context.lineTo(currentX + context.measureText(text[i]).width, y)
    //   currentX += dashArray[i]
    // }

    context.strokeStyle = 'black'
    // context.setLineDash([dashLength, dashLength])
    context.setLineDash([20, 3, 3, 3, 3, 3, 3, 3])
    context.font = '100px serif'
    context.strokeText(text, x, y)
    // context.setLineDash([])
  }

  drawDashedText('ABCDefg', 50, 100, 2)
})
</script>
<style lang="less" scoped>
#canvas{
border: 1px solid red;
width: 400px;
height: 400px;
}
</style>
