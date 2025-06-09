import '@abraham/reflection'
import { iocContainer } from './inversify.config'
import { Main } from './Main'
import { TextEditor } from './text/TextEditor'
// import './helper/StateManager.test'

export const cad = iocContainer.get(Main)
export const textEditor = iocContainer.get(TextEditor)
