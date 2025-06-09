import { inject, injectable } from 'inversify'
import { DataManager, IEntity } from '../data/DataManager'
import { CommandHistoryManager } from './CommandHistoryManager'
import { IAABB } from '../helper/BoundingBox'
import { SystemConfig } from '../store/system/SystemConfig'
import { Mouse } from '../interaction/Mouse'
import { Tween } from '../utils/Tween'

@injectable()
export class InteractionCommand {
  @inject(SystemConfig) protected systemConfig!: SystemConfig
  @inject(Mouse) protected mouse!: Mouse
  @inject(DataManager) protected dataManager!: DataManager
  @inject(CommandHistoryManager) protected commandHistoryManager!: CommandHistoryManager

  // 光标碰撞检测
  public cursorCollisionDetect(x: number, y: number): void {
    const entityArr: IEntity[] = []
    // 存在collisionEntity时，清除掉
    const collisionEntity = this.dataManager.collisionEntity
    if (collisionEntity?.other) {
      collisionEntity.other.collisioned = false
      entityArr.push(collisionEntity)
    }
    const halfSquareLength = this.systemConfig.squareLength / 2 / this.mouse.visualWorkerView.a
    const entity = this.dataManager.cursorCollisionDetect([
      [x - halfSquareLength, y - halfSquareLength],
      [x + halfSquareLength, y + halfSquareLength],
    ])
    // 存在碰撞实体时，则更新数据和渲染
    if (entity) {
      // 两者为同一个实体时则什么也不做
      if (collisionEntity?.id === entity.id) {
        return
      }
      // 当前为被选中图形则什么也不做
      if (entity.other?.boxSelected) {
        return
      }
      if (entity.other) {
        if (!entity.other.boxSelected) {
          entity.other.collisioned = true
        }
      } else {
        entity.other = {
          collisioned: true,
        }
      }
      entityArr.push(entity)
    }

    if (entityArr.length) {
      this.dataManager.editEntitiesData(entityArr)
      // this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeEdited, entityArr)
    }
  }

  // 单选
  public setSingleSelectionBox(isShiftKeyPressed: boolean): void {
    const collisionEntity: IEntity = this.dataManager.collisionEntity as IEntity
    let entityArr: IEntity[] = [] // this.dataManager.selectionBoxEntities
    // 当按住shift时，说明是之前选择的实体仍然有效
    // 如果没按住shift，则将原来的选中的实体设为不选中
    if (!isShiftKeyPressed) {
      entityArr = this.dataManager.selectionBoxEntities.map((entity) => {
        if (entity.other) {
          entity.other.boxSelected = false
        }
        return entity
      })
    }
    // 设置碰撞实体为（不）选中
    if (collisionEntity.other) {
      collisionEntity.other.collisioned = false
      collisionEntity.other.boxSelected = !collisionEntity.other.boxSelected
    } else {
      collisionEntity.other = {
        boxSelected: true,
      }
    }
    // 无需去重
    entityArr.push(collisionEntity)
    if (entityArr.length) {
      this.dataManager.editEntitiesData(entityArr)
      // this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeEdited, entityArr)
    }
  }

  // 框选
  public setSelectionBox(start: number[], end: number[], isShiftKeyPressed: boolean): void {
    const entityArr: IEntity[] = this.dataManager.selectionBoxEntities
    // 当按住shift时，说明是之前选择的实体仍然有效
    // 如果没按住shift，则将原来的选中的实体设为不选中
    if (!isShiftKeyPressed) {
      entityArr.forEach((entity) => {
        if (entity.other) {
          entity.other.boxSelected = false
        }
      })
    }
    // 设置框选的数据状态
    let entities = []
    start = [start[0], start[1]]
    end = [end[0], end[1]]
    const AABB = [
      [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
      [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
    ] as IAABB
    // 向左框选
    if (start[0] > end[0]) {
      console.time('向左框选')
      entities = this.dataManager.getEntityByAABB(AABB, true)
      console.timeEnd('向左框选')
    } else {
      console.time('向右框选')
      entities = this.dataManager.getEntityByAABBAllIn(AABB)
      console.timeEnd('向右框选')
    }
    entities.forEach((entity) => {
      if (entity.other) {
        entity.other.collisioned = false
        entity.other.boxSelected = !entity.other.boxSelected
      } else {
        entity.other = {
          boxSelected: true,
        }
      }
    })
    const result = arrRemoveDuplic([...entityArr, ...entities])
    if (result.length) {
      this.dataManager.editEntitiesData(result)
      // this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeEdited, result)
    }

    // 高效去重
    function arrRemoveDuplic(arr: IEntity[]): IEntity[] {
      const map = new Map()
      const array: IEntity[] = [] // 数组用于返回结果
      for (let i = 0; i < arr.length; i++) {
        if (map.has(arr[i].id)) {
          // 如果有该key值
          map.set(arr[i].id, true)
        } else {
          map.set(arr[i].id, false) // 如果没有该key值
          array.push(arr[i])
        }
      }
      return array
    }
  }

  // 清除所有已被框选的图形
  public clearSelectionBox(): void {
    const selectionBoxEntities = this.dataManager.selectionBoxEntities
    selectionBoxEntities.forEach((entity) => {
      if (entity.other?.boxSelected) {
        entity.other.boxSelected = false
      }
    })
    if (selectionBoxEntities.length) {
      this.dataManager.editEntitiesData(selectionBoxEntities)
      // this.commandHistoryManager.add(CommandHistoryManagerEvent.ShapeEdited, selectionBoxEntities)
    }
  }

  // 将所有图形缩放居中
  public zoomCenter(canvasWidth: number, canvasHeight: number): void {
    // 获取图形范围
    const { minX, minY, maxX, maxY } = this.getAllShapesRange(canvasWidth, canvasHeight)
    const graphWidth = maxX - minX
    const graphHeight = maxY - minY
    const graphAspectRatio = graphWidth / graphHeight
    const canvasAspectRatio = canvasWidth / canvasHeight
    let scale = 1
    if (graphAspectRatio > canvasAspectRatio) {
      scale = canvasWidth / graphWidth
    } else {
      scale = canvasHeight / graphHeight
    }
    const offsetX = (canvasWidth - graphWidth * scale) / 2 - minX * scale
    const offsetY = (canvasHeight - graphHeight * scale) / 2 - minY * scale
    const targetView = {
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: offsetX,
      f: offsetY,
    }
    const tween = new Tween(this.mouse.visualWorkerView)
    tween
      .to(targetView, 1000)
      .easing(Tween.Quadratic.InOut)
      .onUpdate((val) => {
        // console.log(152, val)
      })
      .start()
    this.mouse.setVisualWorkerView(targetView)
  }

  // 获取所有图形的极限范围
  private getAllShapesRange(canvasWidth: number, canvasHeight: number): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Number.MAX_VALUE
    let minY = Number.MAX_VALUE
    let maxX = -Number.MAX_VALUE
    let maxY = -Number.MAX_VALUE
    this.dataManager.all().forEach((entity) => {
      const AABB = entity.AABB as IAABB
      minX = Math.min(minX, AABB[0][0])
      minY = Math.min(minY, AABB[0][1])
      maxX = Math.max(maxX, AABB[1][0])
      maxY = Math.max(maxY, AABB[1][1])
    })
    if (minX === Number.MAX_VALUE) {
      minX = 0
    }
    if (minY === Number.MAX_VALUE) {
      minY = 0
    }
    if (maxX === -Number.MAX_VALUE) {
      maxX = canvasWidth
    }
    if (maxY === -Number.MAX_VALUE) {
      maxY = canvasHeight
    }
    return { minX, minY, maxX, maxY }
  }
}
