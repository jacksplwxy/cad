<template>
  <div>save和store</div>
  <canvas id="canvas"></canvas>
</template>
<script setup lang="ts">
import { onMounted, withCtx } from 'vue'
onMounted(() => {
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  // 绘制一个矩形
  ctx.fillStyle = 'blue'
  ctx.fillRect(50, 50, 100, 50)

  // 保存当前绘图状态
  ctx.save()

  // 旋转坐标系（以矩形的中心点为旋转中心）
  ctx.translate(100, 75) // 将坐标系原点移动到矩形中心
  ctx.rotate(Math.PI / 4) // 旋转45度

  // 重新绘制矩形
  ctx.fillStyle = 'red'
  ctx.fillRect(-50, -25, 100, 50) // 注意坐标是相对于旋转后的坐标系的

  // 恢复先前保存的绘图状态
  ctx.restore()
})

</script>
<style lang="less" scoped>
#canvas{
  border: 1px solid red;
  width: 1000px;
  height: 1000px;
}
</style>
