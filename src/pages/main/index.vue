<template>
  <div class="container">
    <div id="cad">
      <TextEditor></TextEditor>
    </div>
  </div>
  <div class="help">
    <div class="title">快捷键说明</div>
    <p>左框选：鼠标左键，选中框内</p>
    <p>右框选：鼠标左键，选中框相交</p>
    <p>平移：长按滚轮</p>
    <p>缩放：滚动滚轮</p>
    <p>缩放居中：双击滚轮</p>
    <p>直线：L 或 LINE</p>
    <p>圆：C 或 CIRCLE</p>
    <p>圆弧：ARC</p>
    <p>终止指令：ESC</p>
    <p>移动：AS 或 M 或 MOVE，支持输入距离</p>
    <p>复制：CC 或 COPY，支持输入距离</p>
    <p>删除：DEL 或 DELETE</p>
    <p>编辑：拖拽节点</p>
    <p>继续上次指令：空格</p>
    <p>撤销：CTRL+Z</p>
    <p>重做：CTRL+Y</p>
    <p>全选：CTRL+A</p>
    <p>缓存：CTRL+S</p>
    <p>开启/关闭RTree视图：RTV</p>
    <p>子命令：部分实现</p>
    <p>其他：todo..</p>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue'
import { cad } from '@/core/cad'
import TextEditor from './components/textEditor/index.vue'

onMounted(() => {
  cad.init(document.getElementById('cad') as HTMLDivElement)
})
</script>

<style lang="less" scoped>
.container {
  width: 100vw;
  height: 100vh;
  #cad {
    width: 1000px;
    height: 800px;
    position: absolute;
    left: 10px;
    top: 10px;
  }
}
.help {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 14px;
  .title {
    width: 100%;
    font-weight: bold;
    line-height: 26px;
  }
  p {
    line-height: 20px;
  }
}
</style>
