import { Container } from 'inversify'
import { DomManager } from './dom/DomManager'
import { Main } from './Main'
import { BaseEventBus } from './helper/BaseEventBus'
import { EnvConfig } from './store/env/EnvConfig'
import { CommandVisual } from './visual/CommandVisual'
import { BaseCommand } from './command/BaseCommand'
import { CommandRegistry } from './command/CommandRegistry'
import { CommandManager } from './command/CommandManager'
import { EntitiesKeyNodeManager } from './data/EntitiesKeyNodeManager'
import { DataVisual } from './visual/DataVisual'
import { RtreeVisual } from './visual/RtreeVisual'
import { DataManager } from './data/DataManager'
import { InteractionManager } from './interaction/InteractionManager'
import { Mouse } from './interaction/Mouse'
import { InteractionVisual } from './visual/InteractionVisual'
import { Keyboard } from './interaction/Keyboard'
import { ShortcutManager } from './interaction/ShortcutManager'
import { SystemConfig } from './store/system/SystemConfig'
import { Snap } from './interaction/Snaps'
import { CommandHistoryManager } from './command/CommandHistoryManager'
import { InteractionCommand } from './command/InteractionCommand'
import { LayerContainer } from './layer/LayerContainer'
import { ShapeIdManager } from './command/ShapeIdManager'
import { BoundingBox } from './helper/BoundingBox'
import { ComputGeometry } from './utils/math/ComputGeometry'
import { TextEditor } from './text/TextEditor'

const iocContainer = new Container()
iocContainer.bind(EnvConfig).toSelf().inSingletonScope()
iocContainer.bind(SystemConfig).toSelf().inSingletonScope()
iocContainer.bind(BaseEventBus).toSelf().inSingletonScope()
iocContainer.bind(DomManager).toSelf().inSingletonScope()
iocContainer.bind(Mouse).toSelf().inSingletonScope()
iocContainer.bind(Keyboard).toSelf().inSingletonScope()
iocContainer.bind(BaseCommand).toSelf()
iocContainer.bind(CommandManager).toSelf().inSingletonScope()
iocContainer.bind(ShortcutManager).toSelf().inSingletonScope()
iocContainer.bind(Snap).toSelf().inSingletonScope()
iocContainer.bind(InteractionVisual).toSelf().inSingletonScope()
iocContainer.bind(Main).toSelf().inSingletonScope()
iocContainer.bind(DataVisual).toSelf().inSingletonScope()
iocContainer.bind(RtreeVisual).toSelf().inSingletonScope()
iocContainer.bind(CommandHistoryManager).toSelf().inSingletonScope()
iocContainer.bind(InteractionCommand).toSelf().inSingletonScope()
iocContainer.bind(EntitiesKeyNodeManager).toSelf().inSingletonScope()
iocContainer.bind(DataManager).toSelf().inSingletonScope()
iocContainer.bind(CommandVisual).toSelf().inSingletonScope()
iocContainer.bind(InteractionManager).toSelf().inSingletonScope()
iocContainer.bind(LayerContainer).toSelf().inSingletonScope()
iocContainer.bind(ShapeIdManager).toSelf().inSingletonScope()
iocContainer.bind(BoundingBox).toSelf().inSingletonScope()
iocContainer.bind(ComputGeometry).toSelf()
iocContainer.bind(TextEditor).toSelf().inSingletonScope()
iocContainer
  .bind(CommandRegistry)
  .toDynamicValue(() => {
    return new CommandRegistry(iocContainer)
  })
  .inSingletonScope()
export { iocContainer }
