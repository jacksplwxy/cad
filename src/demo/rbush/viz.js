// 设置画布大小和上下文
var W = 700,
    canvas = document.getElementById('canvas'), // 获取画布元素
    ctx = canvas.getContext('2d'); // 获取2D绘图上下文

// 根据设备像素比例调整画布大小和上下文尺寸
if (window.devicePixelRatio > 1) {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width = canvas.width * 2;
    canvas.height = canvas.height * 2;
    ctx.scale(2, 2);
}

// 生成随机矩形框
function randBox(size) {
    var x = Math.random() * (W - size),
        y = Math.random() * (W - size);
    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random()
    };
}

// 生成随机聚类点
function randClusterPoint(dist) {
    var x = dist + Math.random() * (W - dist * 2),
        y = dist + Math.random() * (W - dist * 2);
    return {x: x, y: y};
}

// 生成随机聚类矩形框
function randClusterBox(cluster, dist, size) {
    var x = cluster.x - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3,
        y = cluster.y - dist + 2 * dist * (Math.random() + Math.random() + Math.random()) / 3;

    return {
        minX: x,
        minY: y,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random(),
        item: true
    };
}

// 定义颜色数组
var colors = ['#f40', '#0b0', '#37f'],
    rects;

// 绘制树结构
function drawTree(node, level) {
    if (!node) { return; }

    var rect = [];

    // 设置矩形框属性
    rect.push(level ? colors[(node.height - 1) % colors.length] : 'grey'); // 矩形框颜色
    rect.push(level ? 1 / Math.pow(level, 1.2) : 0.2); // 矩形框透明度
    rect.push([
        Math.round(node.minX),
        Math.round(node.minY),
        Math.round(node.maxX - node.minX),
        Math.round(node.maxY - node.minY)
    ]); // 矩形框位置和大小

    rects.push(rect);

    // 如果是叶子节点则返回，否则继续绘制子节点
    if (node.leaf) return;
    if (level === 6) { return; }

    for (var i = 0; i < node.children.length; i++) {
        drawTree(node.children[i], level + 1);
    }
}

// 绘制函数
function draw() {
    rects = [];
    drawTree(tree.data, 0); // 绘制树结构

    ctx.clearRect(0, 0, W + 1, W + 1); // 清除画布

    // 绘制矩形框
    for (var i = rects.length - 1; i >= 0; i--) {
        ctx.strokeStyle = rects[i][0]; // 设置边框颜色
        ctx.globalAlpha = rects[i][1]; // 设置透明度
        ctx.strokeRect.apply(ctx, rects[i][2]); // 绘制矩形框
    }
}

// 搜索函数
function search(e) {
    console.time('1 pixel search');
    tree.search({
        minX: e.clientX,
        minY: e.clientY,
        maxX: e.clientX + 1,
        maxY: e.clientY + 1
    }); // 搜索指定位置的矩形框
    console.timeEnd('1 pixel search');
}

// 移除函数
function remove() {
    data.sort(tree.compareMinX); // 根据最小 X 坐标排序数据
    console.time('remove 10000');
    for (var i = 0; i < 10000; i++) {
        tree.remove(data[i]); // 移除指定数据
    }
    console.timeEnd('remove 10000');

    data.splice(0, 10000); // 移除数据数组中的前10000个数据

    draw(); // 重新绘制
};
