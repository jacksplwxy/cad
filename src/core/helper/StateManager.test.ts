import { StateManager } from './StateManager'

// 具体实现类
class Env {
  public stateManager: StateManager // 状态管理器

  constructor() {
    this.stateManager = new StateManager({
      dpr: 2,
      test: 'initial',
      hasPhoneAuth: true,
      btnPhoneActive: false,
    })
  }
}

function runTests() {
  const env = new Env()
  // 监听dpr和test的变化
  const cancelWatch = env.stateManager.watch(['dpr', 'test'], ([newDpr, newTest], [oldDpr, oldTest]) => {
    console.log(`dpr changed from: ${oldDpr} to: ${newDpr}`)
    console.log(`test changed from: ${oldTest} to: ${newTest}`)
  })
  // 触发变化
  env.stateManager.setData({ dpr: 3 }) // 输出: dpr changed from: 2 to: 3
  env.stateManager.setData({ test: 'updated' }) // 输出: test changed from: initial to: updated
  // 批量更新多个状态
  env.stateManager.setData({
    dpr: 4,
    test: 'new value',
    hasPhoneAuth: false,
    btnPhoneActive: true,
  })
  setInterval(() => {
    const dpr = env.stateManager.getState('dpr') as unknown as number
    const newDpr = dpr + 1
    console.log(124, dpr)
    env.stateManager.setData({
      dpr: newDpr,
    })
    if (newDpr > 10) {
      // 取消监听
      cancelWatch()
    }
  }, 2000)
}

// 在文件的入口位置引入该文件进行测试
runTests()
