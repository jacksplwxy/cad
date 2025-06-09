import { DataManager, type IEntityTemp, type IEntity, DataManagerEvent } from '../data/DataManager'
import { type IAABB } from '../helper/BoundingBox'
import { inject, injectable } from 'inversify'
import { EnvConfig } from '../store/env/EnvConfig'
import { DomManager } from '../dom/DomManager'
import { IView, Mouse, MyMouseEvent } from '@/core/interaction/Mouse'
import { SystemConfig } from '@/core/store/system/SystemConfig'
import { ExecuteLatestStrategy, MessageQueue } from '../helper/MessageQueue'

@injectable()
export class DataVisual {
  @inject(EnvConfig) private envConfig!: EnvConfig
  // @wxy：这里直接注入DomManager会导致绘制图像有时候不展示，原因待查证
  @inject(DomManager) private domManager!: DomManager
  @inject(DataManager) private dataManager!: DataManager
  @inject(Mouse) private mouse!: Mouse
  @inject(SystemConfig) private systemConfig!: SystemConfig

  private renderWorker!: Worker
  private queue = new MessageQueue(new ExecuteLatestStrategy())

  public init() {
    this.canvasInit()
    this.eventInit()
    this.dataManagerListenerInit()
  }

  private canvasInit(): void {
    const canvas: HTMLCanvasElement = this.domManager.dataCanvas
    canvas.width = Math.ceil(canvas.offsetWidth * this.envConfig.dpr)
    canvas.height = Math.ceil(canvas.offsetHeight * this.envConfig.dpr)
    // 创建离屏Canvas并传递给Worker
    const offscreen = canvas.transferControlToOffscreen()
    this.renderWorker = new Worker(new URL('../render/canvas/DataRender', import.meta.url), {
      type: 'module',
      name: 'visual',
    })
    this.renderWorker.postMessage({ event: 'INIT', canvas: offscreen, dpr: this.envConfig.dpr, selectedNodeSize: this.systemConfig.selectedNodeSize }, [offscreen])
  }

  private dataManagerListenerInit(): void {
    this.dataManager.addEventListener(DataManagerEvent.ADD, (entityArr: IEntity[]) => {
      this.render(entityArr)
    })
    this.dataManager.addEventListener(DataManagerEvent.EDIT, (entityArr: IEntity[], options) => {
      // 获取包含所有entity的范围
      let entityArrAABB = options.oldAABB
      const { a } = this.mouse.visualWorkerView
      const halfNodeSize = this.systemConfig.selectedNodeSize / 2 / a
      // 包含绘制了节点的区域
      entityArrAABB = [
        [entityArrAABB[0][0] - halfNodeSize, entityArrAABB[0][1] - halfNodeSize],
        [entityArrAABB[1][0] + halfNodeSize, entityArrAABB[1][1] + halfNodeSize],
      ]
      // 移除包围盒影响图形，重绘包围盒影响图形
      const entitySet = new Set(entityArr.map((entity) => entity.id))
      const boundingBoxEffectEntities: IEntity[] = this.dataManager.getEntityByAABB(entityArrAABB as IAABB).filter((entity) => {
        return !entitySet.has(entity.id)
      })

      // 再次绘制受清空待编辑图形影响到的其他图形和重新绘制待编辑图形
      this.clearArea(this.affineTransformAABB(entityArrAABB))
      this.render([...boundingBoxEffectEntities, ...entityArr])
    })
    this.dataManager.addEventListener(DataManagerEvent.DELETE, (entityArr: IEntity[], options) => {
      // 获取包含所有entity的范围
      let entityArrAABB = options.oldAABB
      const halfNodeSize = this.systemConfig.selectedNodeSize / 2
      // 包含绘制了节点的区域
      entityArrAABB = [
        [entityArrAABB[0][0] - halfNodeSize, entityArrAABB[0][1] - halfNodeSize],
        [entityArrAABB[1][0] + halfNodeSize, entityArrAABB[1][1] + halfNodeSize],
      ]
      // 移除包围盒影响图形，重绘包围盒影响图形
      const entitySet = new Set(entityArr.map((entity) => entity.id))
      const boundingBoxEffectEntities: IEntity[] = this.dataManager.getEntityByAABB(entityArrAABB as IAABB).filter((entity) => {
        return !entitySet.has(entity.id)
      })
      // 再次绘制受清空待编辑图形影响到的其他图形
      this.clearArea(this.affineTransformAABB(entityArrAABB))
      this.render(boundingBoxEffectEntities)
    })
  }

  // watch初始化
  private eventInit(): void {
    this.mouse.addEventListener(MyMouseEvent.VisualWorkerViewChange, this.addTask)
  }

  private addTask = () => {
    this.queue.addTask(this.VisualWorkerViewChangeHandler.bind(this))
  }
  private VisualWorkerViewChangeHandler() {
    this.clearArea([
      [0, 0],
      [this.domManager.dataCanvas.width, this.domManager.dataCanvas.height],
    ])
    // @wxy：all()可以优化为变换后屏幕可视范围内的数据
    const allData = this.dataManager.all()
    this.render(allData)
  }

  // 图形创建
  private render(entityArr: Array<IEntity | IEntityTemp>, viewInfo?: IView): void {
    if (!viewInfo) {
      const { a, b, c, d, e, f } = this.mouse.visualWorkerView
      viewInfo = { a, b, c, d, e, f } // { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    }
    this.renderWorker.postMessage({
      event: 'RENDER',
      entityArr,
      viewInfo,
      renderShapeSelectedNode: this.dataManager.selectionBoxEntities.length < this.systemConfig.maxNodeEntityShowNum,
    })
  }

  // 清除ctx上的区域
  public clearArea(clearArea: IAABB): void {
    this.renderWorker.postMessage({
      event: 'CLEAR',
      clearArea: clearArea,
    })
  }

  // AABB仿射变换
  private affineTransformAABB(AABB: IAABB): IAABB {
    return AABB.map((point) => {
      return this.mouse.affineTransformPoint(point)
    }) as IAABB
  }
}
