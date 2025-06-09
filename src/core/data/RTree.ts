// https://github.com/mourner/rbush

import { type IEntity } from './DataManager'

// 矩形边界框（Bounding Box）
export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}
// 定义RTree根节点
export interface Node {
  children: Array<Node | IEntity>
  height: number
  leaf: boolean // 是否为叶子节点
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// 返回值为number的函数
type GetNum = (...args: any[]) => number
// 返回值为BBox的函数
type GetBBox = (...args: any[]) => BBox

export class RTree {
  private readonly _maxEntries: number // 最大条目数
  private readonly _minEntries: number // 最小条目数
  private data!: Node // R树的根节点

  /**
   * 构造函数
   * @param maxEntries 可选参数RBush定义树节点中的最大条目数。 9（默认使用）对于大多数应用程序来说是一个合理的选择。较高的值意味着更快的插入和更慢的搜索，反之亦然。
   */
  constructor(maxEntries: number = 9) {
    this._maxEntries = Math.max(4, maxEntries)
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4))
    this.clear()
  }

  // 获取树中所有的条目
  public all(): IEntity[] {
    return this._all(this.data, [])
  }

  // 提供一个全部数据的HASH对象
  public allMap(): Record<string, IEntity> {
    return this._allMap()
  }

  /**
   * 根据矩形边界框搜索树中的条目（相交关系）（向左框选）
   * @param bbox 搜索的矩形范围
   * @param accurateCollision 判断矩形搜索范围与图形是否精准碰撞
   * @returns
   */
  public search(bbox: BBox, accurateCollision: boolean = false): IEntity[] {
    let node: Node | undefined = this.data
    const result: IEntity[] = []
    if (!this.intersects(bbox, node)) return result
    const toBBox = this.toBBox
    const nodesToSearch: Node[] = []
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const childBBox = node.leaf ? toBBox(child) : (child as Node)
        if (accurateCollision) {
          if (this.contains(bbox, childBBox)) {
            if (node.leaf) {
              result.push(child as IEntity)
            } else {
              this._all(child as Node, result)
            }
          } else if (node.leaf) {
            // 精准碰撞判断
            if (this.accurateCollisionFn(bbox, child as IEntity)) {
              result.push(child as IEntity)
            }
          } else if (this.intersects(bbox, childBBox)) {
            nodesToSearch.push(child as Node)
          }
        } else {
          if (this.intersects(bbox, childBBox)) {
            if (node.leaf) {
              result.push(child as IEntity)
            } else if (this.contains(bbox, childBBox)) {
              this._all(child as Node, result)
            } else {
              nodesToSearch.push(child as Node)
            }
          }
        }
      }
      node = nodesToSearch.pop()
    }
    return result
  }

  // 根据矩形边界框搜索树中的条目（包含关系）（向右框选）
  public searchAllIn(bbox: BBox): IEntity[] {
    let node: Node | undefined = this.data
    const result: IEntity[] = []
    if (!this.intersects(bbox, node)) return result
    const toBBox = this.toBBox
    const nodesToSearch: Node[] = []
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const childBBox = node.leaf ? toBBox(child) : (child as Node)
        if (this.contains(bbox, childBBox)) {
          if (node.leaf) {
            result.push(child as IEntity)
          } else {
            this._all(child as Node, result)
          }
        } else if (this.intersects(bbox, childBBox)) {
          if (!node.leaf) {
            nodesToSearch.push(child as Node)
          }
        }
      }
      node = nodesToSearch.pop()
    }
    return result
  }

  // 精准碰撞判断，返回碰撞结果（常用于光标碰撞）
  // 与search(bbox, true)的区别是：collides是找到一个图形立即返回，效率更高；而search是找到所有图形
  public collides(bbox: BBox): IEntity | null {
    let node: Node | undefined = this.data
    if (!this.intersects(bbox, node)) return null
    const nodesToSearch: Node[] = []
    while (node) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const childBBox = node.leaf ? this.toBBox(child) : (child as Node)
        if (this.contains(bbox, childBBox)) {
          if (node.leaf) {
            return child as IEntity
          } else {
            return findEntityInNode(child as Node) as IEntity
          }
        } else if (node.leaf) {
          // 精准碰撞判断
          if (this.accurateCollisionFn(bbox, child as IEntity)) {
            return child as IEntity
          }
        } else if (this.intersects(bbox, childBBox)) {
          nodesToSearch.push(child as Node)
        }
      }
      node = nodesToSearch.pop()
    }
    return null

    // 在节点中找entity
    function findEntityInNode(node: Node): IEntity | Node | null {
      if (node.leaf) {
        return node.children[0]
      } else {
        const child = node.children[0] as Node
        return findEntityInNode(child)
      }
    }
  }

  /**
   * 批量插入数据
   * 将给定数据批量插入到树中：
   * tree.load([item1, item2, ...]);
   * 批量插入通常比逐个插入项目快 2-3 倍。批量加载（批量插入空树）后，后续查询性能也提高了约 20-30%。
   * 请注意，当您批量插入现有树时，它会将给定数据批量加载到单独的树中，并将较小的树插入到较大的树中。这意味着批量插入对于集群数据（一次更新中的项目彼此接近）非常有效，但如果数据分散，则会使查询性能变差。
   * @param data
   * @returns
   */
  public load(data: IEntity[]): this {
    if (!data?.length) return this
    if (data.length < this._minEntries) {
      for (let i = 0; i < data.length; i++) {
        this.insert(data[i])
      }
      return this
    }
    // recursively build the tree with the given data from scratch using OMT algorithm
    let node: Node = this._build(data.slice(), 0, data.length - 1, 0)
    if (!this.data.children.length) {
      // save as is if tree is empty
      this.data = node
    } else if (this.data.height === node.height) {
      // split root if trees have the same height
      this._splitRoot(this.data, node)
    } else {
      if (this.data.height < node.height) {
        // swap trees if inserted one is bigger
        const tmpNode = this.data
        this.data = node
        node = tmpNode
      }
      // insert the small tree into the large tree at appropriate level
      this._insert(node, this.data.height - node.height - 1, true)
    }
    return this
  }

  // 插入一条数据
  public insert(item: IEntity): this {
    if (item) this._insert(item, this.data.height - 1)
    return this
  }

  // 删除所有数据
  public clear(): this {
    this.data = this.createNode([])
    return this
  }

  /**
   * 删除之前插入的项目：
   *   默认情况下，RBush 通过引用删除对象。但是，您可以传递一个自定义equals函数来按值进行比较以进行删除，当您只有需要删除的对象的副本（例如从服务器加载）时，这非常有用：
   *   tree.remove(itemCopy, (a, b) => {
   *       return a.id === b.id;
   *   });
   * @param item  数据
   * @param equalsFn
   * @returns
   */
  public remove(
    item: IEntity,
    equalsFn = (a: IEntity, b: IEntity) => {
      return a.id === b.id
    },
  ): this {
    if (!item) return this
    let node: Node | null | undefined = this.data
    const bbox: BBox = this.toBBox(item)
    const path: Node[] = []
    const indexes: number[] = []
    let i, parent, goingUp
    // depth-first iterative tree traversal
    while (node ?? path.length) {
      if (!node) {
        // go up
        node = path.pop()
        parent = path[path.length - 1]
        i = indexes.pop()
        goingUp = true
      }
      if (node?.leaf) {
        // check current node
        const index = this.findItem(item, node.children as IEntity[], equalsFn)
        if (index !== -1) {
          // item found, remove the item and condense tree upwards
          node.children.splice(index, 1)
          path.push(node)
          this._condense(path)
          return this
        }
      }
      if (node && !goingUp && !node.leaf && this.contains(node, bbox)) {
        // go down
        path.push(node)
        indexes.push(i as number)
        i = 0
        parent = node
        node = node.children[0] as Node
      } else if (parent) {
        // go right
        ;(i as number)++
        node = parent.children[i as number] as Node
        goingUp = false
      } else {
        node = null // nothing found
      }
    }
    return this
  }

  /**
   * 默认情况下，RBush 假定数据点的格式是具有minX、minY和属性maxX的对象maxY。您可以通过重写toBBox,compareMinX和compareMinY方法来自定义它，如下所示：
   *  class MyRBush extends RBush {
   *      toBBox([x, y]) { return {minX: x, minY: y, maxX: x, maxY: y}; }
   *      compareMinX(a, b) { return a.x - b.x; }
   *      compareMinY(a, b) { return a.y - b.y; }
   *  }
   *  const tree = new MyRBush();
   *  tree.insert([20, 50]); // accepts [x, y] points
   * @param item 自定义数据格式
   * @returns
   */
  protected toBBox(item: any): BBox {
    return item
  }

  // x方向排序规则，允许自定义重写
  protected compareMinX(a: any, b: any): number {
    return a.minX - b.minX
  }

  // y方向排序规则，允许自定义重写
  protected compareMinY(a: any, b: any): number {
    return a.minY - b.minY
  }

  // 精准碰撞方法，允许自定义重写
  protected accurateCollisionFn(bbox: BBox, entity: IEntity): boolean {
    throw new Error('accurateCollisionFn方法待实现！')
  }

  public toJSON(): Node {
    return this.data
  }

  public fromJSON(data: Node): this {
    this.data = data
    return this
  }

  private _all(node: Node, result: IEntity[]): IEntity[] {
    const nodesToSearch: Node[] = []
    while (node) {
      if (node.leaf) {
        result.push(...(node.children as IEntity[]))
      } else {
        nodesToSearch.push(...(node.children as Node[]))
      }
      // pop()方法将修改原始数组，删除最后一个元素，并返回该元素的值
      node = nodesToSearch.pop() as Node
    }
    return result
  }

  private _allMap(): Record<string, IEntity> {
    const resultMap: Record<string, IEntity> = {}
    traverse(this.data)
    return resultMap
    function traverse(node: Node | null): void {
      if (node?.leaf) {
        for (const item of node.children as IEntity[]) {
          if (item.id) {
            resultMap[item.id] = item
          }
        }
      } else {
        for (const child of (node?.children as Node[]) ?? []) {
          traverse(child)
        }
      }
    }
  }

  /**
   * 树的构建:通过递归地分割数据项来构建R树，以便高效地存储和检索多维空间中的对象
   * @param items 数据
   * @param left 数组左边界
   * @param right 数组右边界
   * @param height 当前节点的高度
   * @returns
   */
  private _build(items: IEntity[], left: number, right: number, height: number): Node {
    const N: number = right - left + 1 // 计算当前节点所包含的数据项数量
    let M: number = this._maxEntries // 树的最大条目数
    let node: Node
    // 如果节点包含的条目数量小于等于最大条目数，则将其作为叶子节点处理
    if (N <= M) {
      // reached leaf level; return leaf
      node = this.createNode(items.slice(left, right + 1))
      this.calcBBox(node, this.toBBox)
      return node
    }
    // 如果未指定高度，则计算目标高度和根节点的最大条目数以最大化存储利用率
    if (!height) {
      // target height of the bulk-loaded tree
      height = Math.ceil(Math.log(N) / Math.log(M))
      // target number of root entries to maximize storage utilization
      M = Math.ceil(N / Math.pow(M, height - 1))
    }
    // 创建一个非叶子节点
    node = this.createNode([])
    node.leaf = false
    node.height = height
    // split the items into M mostly square tiles
    const N2: number = Math.ceil(N / M) // 确定每个瓦片中包含的数据项数量。它通过将总的数据项数量 N 除以 R 树的最大条目数 M 来计算。这样可以保证每个瓦片大致平均地包含相等数量的数据项
    const N1: number = N2 * Math.ceil(Math.sqrt(M)) // 确定瓦片的数量，以便使得整个数据集能够被分割成近似正方形的瓦片。它通过将 N2 乘以 Math.ceil(Math.sqrt(M)) 来计算。这样可以尽可能地使得瓦片的形状接近正方形，并且覆盖整个数据集
    this.multiSelect(items, left, right, N1, this.compareMinX)
    for (let i = left; i <= right; i += N1) {
      const right2: number = Math.min(i + N1 - 1, right)
      this.multiSelect(items, i, right2, N2, this.compareMinY)
      for (let j = i; j <= right2; j += N2) {
        const right3: number = Math.min(j + N2 - 1, right2)
        // pack each entry recursively
        node.children.push(this._build(items, j, right3, height - 1))
      }
    }
    this.calcBBox(node, this.toBBox)
    return node
  }

  private _chooseSubtree(bbox: BBox, node: Node, level: number, path: Array<Node | IEntity>): Node {
    while (true) {
      path.push(node)
      if (node.leaf || path.length - 1 === level) break
      let minArea: number = Infinity
      let minEnlargement: number = Infinity
      let targetNode: Node | null = null
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as Node
        const area: number = this.bboxArea(child)
        const enlargement: number = this.enlargedArea(bbox, child) - area
        // choose entry with the least area enlargement
        if (enlargement < minEnlargement) {
          minEnlargement = enlargement
          minArea = area < minArea ? area : minArea
          targetNode = child
        } else if (enlargement === minEnlargement) {
          // otherwise choose one with the smallest area
          if (area < minArea) {
            minArea = area
            targetNode = child
          }
        }
      }
      node = targetNode ?? (node.children[0] as Node)
    }
    return node
  }

  private _insert(item: Node | IEntity, level: number, isNode?: boolean): void {
    const bbox: BBox = isNode ? (item as Node) : this.toBBox(item)
    const insertPath: Node[] = [] // 插入路径，用于记录沿途的节点
    // find the best node for accommodating the item, saving all nodes along the path too
    const node: Node = this._chooseSubtree(bbox, this.data, level, insertPath) // 选择插入位置并获取对应的节点
    // put the item into the node
    node.children.push(item)
    this.extend(node, bbox)
    // split on node overflow; propagate upwards if necessary
    while (level >= 0) {
      if (insertPath[level].children.length > this._maxEntries) {
        this._split(insertPath, level)
        level--
      } else break
    }
    // adjust bboxes along the insertion path
    this._adjustParentBBoxes(bbox, insertPath, level)
  }

  private _split(insertPath: Node[], level: number): void {
    const node: Node = insertPath[level]
    const M: number = node.children.length
    const m: number = this._minEntries
    this._chooseSplitAxis(node, m, M)
    const splitIndex: number = this._chooseSplitIndex(node, m, M)
    const newNode: Node = this.createNode(node.children.splice(splitIndex, node.children.length - splitIndex))
    newNode.height = node.height
    newNode.leaf = node.leaf
    this.calcBBox(node, this.toBBox)
    this.calcBBox(newNode, this.toBBox)
    if (level) {
      insertPath[level - 1].children.push(newNode)
    } else {
      this._splitRoot(node, newNode)
    }
  }

  private _splitRoot(node: Node, newNode: Node): void {
    // split root node
    this.data = this.createNode([node, newNode])
    this.data.height = node.height + 1
    this.data.leaf = false
    this.calcBBox(this.data, this.toBBox)
  }

  // 选择分割索引
  private _chooseSplitIndex(node: Node, m: number, M: number): number {
    let index: number | null = null
    let minOverlap: number = Infinity
    let minArea: number = Infinity
    for (let i = m; i <= M - m; i++) {
      const bbox1: BBox = this.distBBox(node, 0, i, this.toBBox)
      const bbox2: BBox = this.distBBox(node, i, M, this.toBBox)
      const overlap: number = this.intersectionArea(bbox1, bbox2)
      const area: number = this.bboxArea(bbox1) + this.bboxArea(bbox2)
      // choose distribution with minimum overlap
      if (overlap < minOverlap) {
        minOverlap = overlap
        index = i
        minArea = area < minArea ? area : minArea
      } else if (overlap === minOverlap) {
        // otherwise choose distribution with minimum area
        if (area < minArea) {
          minArea = area
          index = i
        }
      }
    }
    return index ?? M - m
  }

  // 选择节点分裂的轴：即确定在哪个方向上进行节点的分割，是水平方向（x轴）还是垂直方向（y轴）
  private _chooseSplitAxis(node: Node, m: number, M: number): void {
    const compareMinX = node.leaf ? this.compareMinX : this.compareNodeMinX
    const compareMinY = node.leaf ? this.compareMinY : this.compareNodeMinY
    const xMargin: number = this._allDistMargin(node, m, M, compareMinX)
    const yMargin: number = this._allDistMargin(node, m, M, compareMinY)
    // if total distributions margin value is minimal for x, sort by minX,
    // otherwise it's already sorted by minY
    if (xMargin < yMargin) {
      node.children.sort(compareMinX)
    }
  }

  // 计算节点的所有子节点中，分割后左右两个部分的边界面积之和，以评估分割的质量
  private _allDistMargin(node: Node, m: number, M: number, compare: GetNum): number {
    node.children.sort(compare)
    const toBBox = this.toBBox
    const leftBBox: BBox = this.distBBox(node, 0, m, toBBox)
    const rightBBox: BBox = this.distBBox(node, M - m, M, toBBox)
    let margin: number = this.bboxMargin(leftBBox) + this.bboxMargin(rightBBox)
    for (let i = m; i < M - m; i++) {
      const child = node.children[i]
      this.extend(leftBBox, node.leaf ? toBBox(child) : (child as Node))
      margin += this.bboxMargin(leftBBox)
    }
    for (let i = M - m - 1; i >= m; i--) {
      const child = node.children[i]
      this.extend(rightBBox, node.leaf ? toBBox(child) : (child as Node))
      margin += this.bboxMargin(rightBBox)
    }
    return margin
  }

  private _adjustParentBBoxes(bbox: BBox, path: Node[], level: number): void {
    // adjust bboxes along the given tree path
    for (let i = level; i >= 0; i--) {
      this.extend(path[i], bbox)
    }
  }

  // 在树中向上遍历路径，移除空节点并更新节点的边界框
  private _condense(path: Node[]): void {
    // go through the path, removing empty nodes and updating bboxes
    for (let i = path.length - 1, siblings; i >= 0; i--) {
      if (path[i].children.length === 0) {
        if (i > 0) {
          siblings = path[i - 1].children
          siblings.splice(siblings.indexOf(path[i]), 1)
        } else this.clear()
      } else this.calcBBox(path[i], this.toBBox)
    }
  }

  private findItem(item: IEntity, items: IEntity[], equalsFn?: (a: any, b: any) => boolean): number {
    if (!equalsFn) return items.indexOf(item)
    for (let i = 0; i < items.length; i++) {
      if (equalsFn(item, items[i])) return i
    }
    return -1
  }

  // calculate node's bbox from bboxes of its children
  private calcBBox(node: Node, toBBox: GetBBox): void {
    this.distBBox(node, 0, node.children.length, toBBox, node)
  }

  // min bounding rectangle of node children from k to p-1
  private distBBox(node: Node, k: number, p: number, toBBox: GetBBox, destNode?: Node): Node {
    if (!destNode) {
      destNode = this.createNode([])
    }
    destNode.minX = Infinity
    destNode.minY = Infinity
    destNode.maxX = -Infinity
    destNode.maxY = -Infinity
    for (let i = k; i < p; i++) {
      const child = node.children[i]
      this.extend(destNode, node.leaf ? toBBox(child) : (child as Node))
    }
    return destNode
  }

  //  扩展矩形边界框，使其包含另一个矩形边界框
  private extend(a: BBox, b: BBox): BBox {
    a.minX = Math.min(a.minX, b.minX)
    a.minY = Math.min(a.minY, b.minY)
    a.maxX = Math.max(a.maxX, b.maxX)
    a.maxY = Math.max(a.maxY, b.maxY)
    return a // 返回更新后的矩形边界框
  }

  private compareNodeMinX(a: Node, b: Node): number {
    return a.minX - b.minX
  }

  private compareNodeMinY(a: Node, b: Node): number {
    return a.minY - b.minY
  }

  private bboxArea(a: BBox): number {
    return (a.maxX - a.minX) * (a.maxY - a.minY)
  }

  private bboxMargin(a: BBox): number {
    return a.maxX - a.minX + (a.maxY - a.minY)
  }

  private enlargedArea(a: BBox, b: BBox): number {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY))
  }

  private intersectionArea(a: BBox, b: BBox): number {
    const minX = Math.max(a.minX, b.minX)
    const minY = Math.max(a.minY, b.minY)
    const maxX = Math.min(a.maxX, b.maxX)
    const maxY = Math.min(a.maxY, b.maxY)
    return Math.max(0, maxX - minX) * Math.max(0, maxY - minY)
  }

  // 判断a是不是完全包含或等于b
  private contains(a: BBox, b: BBox): boolean {
    return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY
  }

  // 判断a和b之间是否相交
  private intersects(a: BBox, b: BBox): boolean {
    return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY
  }

  private createNode(children: Array<Node | IEntity>): Node {
    return {
      children,
      height: 1,
      leaf: true,
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  }

  // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
  // combines selection algorithm with binary divide & conquer approach
  private multiSelect(arr: IEntity[], left: number, right: number, n: number, compare: GetNum): void {
    const stack: number[] = [left, right]
    while (stack.length) {
      right = stack.pop() as number
      left = stack.pop() as number
      if (right - left <= n) continue
      const mid: number = left + Math.ceil((right - left) / n / 2) * n
      this.quickselect(arr, mid, left, right, compare)
      stack.push(left, mid, mid, right)
    }
  }

  private quickselect(arr: IEntity[], k: number, left: number, right: number, compare: GetNum): void {
    this.quickselectStep(arr, k, left || 0, right || arr.length - 1, compare || this.defaultCompare)
  }

  private quickselectStep(arr: IEntity[], k: number, left: number, right: number, compare: GetNum): void {
    while (right > left) {
      if (right - left > 600) {
        const n: number = right - left + 1
        const m: number = k - left + 1
        const z: number = Math.log(n)
        const s: number = 0.5 * Math.exp((2 * z) / 3)
        const sd: number = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1)
        const newLeft: number = Math.max(left, Math.floor(k - (m * s) / n + sd))
        const newRight: number = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd))
        this.quickselectStep(arr, k, newLeft, newRight, compare)
      }
      const t: IEntity = arr[k]
      let i: number = left
      let j: number = right
      this.swap(arr, left, k)
      if (compare(arr[right], t) > 0) this.swap(arr, left, right)
      while (i < j) {
        this.swap(arr, i, j)
        i++
        j--
        while (compare(arr[i], t) < 0) i++
        while (compare(arr[j], t) > 0) j--
      }
      if (compare(arr[left], t) === 0) this.swap(arr, left, j)
      else {
        j++
        this.swap(arr, j, right)
      }
      if (j <= k) left = j + 1
      if (k <= j) right = j - 1
    }
  }

  private swap(arr: IEntity[], i: number, j: number): void {
    const tmp: IEntity = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }

  private defaultCompare(a: number, b: number): number {
    return a < b ? -1 : a > b ? 1 : 0
  }
}
