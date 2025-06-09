import { inject, injectable } from 'inversify'
import { DomManager } from './dom/DomManager'
import { InteractionManager } from '@/core/interaction/InteractionManager'
import { DataVisual } from '@/core/visual/DataVisual'
import { EnvConfig } from './store/env/EnvConfig'
import { RtreeVisual } from './visual/RtreeVisual'
import { SystemConfig } from './store/system/SystemConfig'

@injectable()
export class Main {
  @inject(EnvConfig) private envConfig!: EnvConfig
  @inject(SystemConfig) private systemConfig!: SystemConfig
  @inject(DomManager) private domManager!: DomManager
  @inject(InteractionManager) private interactionManager!: InteractionManager
  @inject(DataVisual) private dataVisual!: DataVisual
  @inject(RtreeVisual) private rtreeVisual!: RtreeVisual

  public init(container: HTMLDivElement): void {
    this.envConfig.setDpr(window.devicePixelRatio)
    this.systemConfig.init()
    this.domManager.init(container)
    this.dataVisual.init()
    this.rtreeVisual.init()
    this.interactionManager.init()
  }
}
