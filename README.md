# web-cad

使用canvas完整实现autocad2007

## 原理

- 技术栈：typescript + canvas
- 分层 + 单向依赖：交互层、指令层、数据层、渲染层
- 高性能：
  - 数据：RTree
  - 渲染：worker + offscreen canvas
- 算法：线性代数 + 计算几何

## 截图

![demo](./documents/demo.gif)

## 体验

https://jacksplwxy.github.io/cad/index.html

## 开发

- nodejs版本：>=16
- 安装依赖：pnpm i
- 开发环境：pnpm dev
- 构建：pnpm build

## todo

- 图形：矩形、椭圆、样条曲线等
- 操作：镜像、旋转、偏移、拉伸等
- 追踪捕捉
- 富文本
- 极轴
- 性能：计算、webgl等
- 本地存储
