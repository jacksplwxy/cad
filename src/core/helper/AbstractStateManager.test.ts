import { AbstractStateManager } from './AbstractStateManager'

// 具体实现类
class Env1 extends AbstractStateManager {
  protected state = { dpr: 2, test: 'initial' }

  // 获取dpr
  get dpr(): number {
    return this.state.dpr
  }

  // 设置dpr，并通知观察者
  set dpr(dpr: number) {
    this.setState('dpr', dpr)
  }

  // 获取test
  get test(): string {
    return this.state.test
  }

  // 设置test，并通知观察者
  set test(test: string) {
    this.setState('test', test)
  }
}
