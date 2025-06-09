<template>
  <div>
    <!-- 设置页面标题 -->
    <title>RBush Tree Visualization</title>

    <!-- 创建画布 -->
    <canvas id="canvas" width="601" height="601" style="border: 1px solid #000;;"></canvas>
    <br />

    <!-- 插入按钮，用于插入不同数量的数据 -->
    <button id="insert1">Insert 50000</button>
    <button id="insert2">Insert 1000</button>
    <button id="insert3">Bulk-insert 50000</button>
    <button id="insert4">Bulk-insert 1000</button>

    <!-- 移除按钮，用于移除左侧的10000个数据 -->
    <button id="remove">Remove leftmost 10000</button>
  </div>
</template>

<script setup lang="ts">
import { RTree, type Node } from '@/core/data/RTree'
import { onMounted } from 'vue'

interface Point { x: number, y: number }
interface ClusterBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  item: boolean
  id: string
}

onMounted(() => {
  // 设置画布大小和上下文
  const W = 600
  const canvas = document.getElementById('canvas') as unknown as HTMLCanvasElement // 获取画布元素
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D // 获取2D绘图上下文

  // 根据设备像素比例调整画布大小和上下文尺寸
  if (window.devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px'
    canvas.style.height = canvas.height + 'px'
    canvas.width = canvas.width * 2
    canvas.height = canvas.height * 2
    ctx.scale(2, 2)
  }

  // 生成随机聚类点
  function randClusterPoint (dist: number): Point {
    const x = dist + Math.random() * (W - dist * 2)
    const y = dist + Math.random() * (W - dist * 2)
    return { x, y }
  }

  // 生成随机聚类矩形框
  function randClusterBox (cluster: Point, dist: number, size: number): ClusterBox {
    const x =
      cluster.x -
      dist +
      (2 * dist * (Math.random() + Math.random() + Math.random())) / 3
    const y =
      cluster.y -
      dist +
      (2 * dist * (Math.random() + Math.random() + Math.random())) / 3
    return {
      minX: x,
      minY: y,
      maxX: x + size * Math.random(),
      maxY: y + size * Math.random(),
      item: true,
      id: Math.random().toString()
    }
  }

  // 定义颜色数组
  const colors = ['#f40', '#0b0', '#37f']
  let rects: Array<Array<string | number | number[]>>

  // 绘制树结构
  function drawTree (node: Node, level: number): void {
    if (!node) {
      return
    }
    const rect = []
    // 设置矩形框属性
    rect.push(level ? colors[(node.height - 1) % colors.length] : 'grey') // 矩形框颜色
    rect.push(level ? 1 / Math.pow(level, 1.2) : 0.2) // 矩形框透明度
    rect.push([
      Math.round(node.minX),
      Math.round(node.minY),
      Math.round(node.maxX - node.minX),
      Math.round(node.maxY - node.minY)
    ]) // 矩形框位置和大小
    rects.push(rect)
    // 如果是叶子节点则返回，否则继续绘制子节点
    if (node.leaf) return
    if (level === 6) {
      return
    }
    for (let i = 0; i < node.children.length; i++) {
      drawTree(node.children[i], level + 1)
    }
  }

  // 绘制函数
  function draw (): void {
    rects = []
    drawTree(tree.toJSON(), 0) // 绘制树结构
    ctx.clearRect(0, 0, W + 1, W + 1) // 清除画布
    // 绘制矩形框
    for (let i = rects.length - 1; i >= 0; i--) {
      ctx.strokeStyle = rects[i][0] as string // 设置边框颜色
      ctx.globalAlpha = rects[i][1] as number // 设置透明度
      ctx.strokeRect.apply(ctx, rects[i][2] as [x: number, y: number, w: number, h: number]) // 绘制矩形框
    }
  }

  // 搜索函数
  function search (e: { clientX: number, clientY: number }): void {
    console.time('1 pixel search')
    tree.search({
      minX: e.clientX,
      minY: e.clientY,
      maxX: e.clientX + 1,
      maxY: e.clientY + 1
    }) // 搜索指定位置的矩形框
    console.timeEnd('1 pixel search')
  }

  // 移除函数
  function remove (): void {
    data.sort(tree.compareMinX) // 根据最小 X 坐标排序数据
    console.time('remove 10000')
    for (let i = 0; i < 10000; i++) {
      tree.remove(data[i]) // 移除指定数据
    }
    console.timeEnd('remove 10000')
    data.splice(0, 10000) // 移除数据数组中的前10000个数据
    draw() // 重新绘制
  }

  /*********************************************************************************/

  // 定义生成数据的参数
  const N = 1000 // 要生成的矩形数量
  const M = 300 // 聚类的数量
  const R = 30 // 聚类的半径
  // 创建RBush树实例和数据数组
  const tree = new RTree(10) // RBush树实例
  let data: ClusterBox[] = [] // 聚类数据数组
  genBulkInsert(N, M)()

  // 生成数据函数
  function genData (N: number, M: number, R: number): ClusterBox[] {
    const data = []
    for (let i = 0; i < M; i++) {
      const cluster: Point = randClusterPoint(R) // 生成聚类点
      const size = Math.min(Math.ceil(N / M), N - data.length)
      for (let j = 0; j < size; j++) {
        data.push(randClusterBox(cluster, R, 1)) // 生成聚类矩形框
      }
    }
    return data
  }

  /**
   * 生成批量插入数据函数
   * @param K 与N一样的要生成的矩形数量
   * @param M 聚类的数量
   */
  function genBulkInsert (K: number, M: number) {
    return function () {
      const data2 = genData(K, M, R) // 生成数据
      console.time('bulk-insert ' + K + ' items') // 计时开始
      tree.load(data2) // 批量插入数据
      console.timeEnd('bulk-insert ' + K + ' items') // 计时结束
      data = data.concat(data2) // 将生成的数据合并到数据数组中
      draw() // 绘制树结构
    }
  }

  // 绑定按钮点击事件，分别执行批量插入不同数量的数据操作
  document.getElementById('insert1').onclick = genBulkInsert(50000, M)
  document.getElementById('insert2').onclick = genBulkInsert(1000, 1)
  document.getElementById('insert3').onclick = genBulkInsert(50000, M)
  document.getElementById('insert4').onclick = genBulkInsert(1000, 1)

  // 绑定画布点击事件，执行搜索操作
  document.getElementById('canvas').onclick = search

  // 绑定移除按钮点击事件，执行移除操作
  document.getElementById('remove').onclick = remove
})
</script>
