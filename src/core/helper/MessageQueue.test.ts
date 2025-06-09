import { DiscardEvenlyStrategy, ExecuteAllStrategy, ExecuteLatestStrategy, ExecuteRecentStrategy, MessageQueue, NoNewWhileExecutingStrategy } from './MessageQueue'
function test1() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test1')
    }, 3000)
  })
}
function test2() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test2')
    }, 3000)
  })
}
function test3() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test3')
    }, 3000)
  })
}
function test4() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test4')
    }, 3000)
  })
}
function test5() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test5')
    }, 3000)
  })
}
function test6() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test6')
    }, 3000)
  })
}
function test7() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test7')
    }, 3000)
  })
}
function test8() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('test8')
    }, 3000)
  })
}

/**************************************************************/

// const queue = new MessageQueue(new ExecuteAllStrategy())
// queue.addTask(test1).then((res) => {
//   console.log(res)
// })
// queue.addTask(test2).then((res) => {
//   console.log(res)
// })
// queue.addTask(test3).then((res) => {
//   console.log(res)
// })
// queue.addTask(test4).then((res) => {
//   console.log(res)
// })
// queue.addTask(test5).then((res) => {
//   console.log(res)
// })

/**************************************************************/

// const queue = new MessageQueue(new ExecuteLatestStrategy())
// queue.addTask(test1).then((res) => {
//   console.log(res)
// })
// setTimeout(() => {
//   queue.addTask(test2).then((res) => {
//     console.log(res)
//   })
//   queue.addTask(test3).then((res) => {
//     console.log(res)
//   })
//   queue.addTask(test4).then((res) => {
//     console.log(res)
//   })
//   queue.addTask(test5).then((res) => {
//     console.log(res)
//   })
// }, 7000)
// queue.addTask(test5).then((res) => {
//   console.log(res)
// })
// queue.addTask(test6).then((res) => {
//   console.log(res)
// })

/**************************************************************/

// const queue = new MessageQueue(new NoNewWhileExecutingStrategy())
// queue.addTask(test1).then((res) => {
//   console.log(res)
// })
// setTimeout(() => {
//   queue.addTask(test2).then((res) => {
//     console.log(res)
//   })
// }, 500)
// setTimeout(() => {
//   queue.addTask(test3).then((res) => {
//     console.log(res)
//   })
//   queue.addTask(test4).then((res) => {
//     console.log(res)
//   })
//   queue.addTask(test5).then((res) => {
//     console.log(res)
//   })
//   setTimeout(() => {
//     queue.addTask(test6).then((res) => {
//       console.log(res)
//     })
//   }, 2000)
// }, 1500)

/**************************************************************/

// const queue = new MessageQueue(new DiscardEvenlyStrategy(4)) // 最大队列大小为5
// queue.addTask(test1).then((res) => {
//   console.log(11, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(22, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(33, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(44, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(55, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(66, res)
// })
// queue.addTask(test1).then((res) => {
//   console.log(77, res)
// })
// queue.addTask(test2).then((res) => {
//   console.log(res)
// })
// queue.addTask(test3).then((res) => {
//   console.log(res)
// })
// queue.addTask(test4).then((res) => {
//   console.log(res)
// })
// queue.addTask(test5).then((res) => {
//   console.log(res)
// })
// setTimeout(() => {
//   queue.addTask(test6).then((res) => {
//     console.log(res)
//   })
// }, 1000)
// setTimeout(() => {
//   queue.addTask(test7).then((res) => {
//     console.log(res)
//   })
// }, 1000)
// setTimeout(() => {
//   queue.addTask(test8).then((res) => {
//     console.log(res)
//   })
// }, 1000)

/**************************************************************/

const queue = new MessageQueue(new ExecuteRecentStrategy(2)) // 保留最近的3条消息
queue.addTask(test1).then((res) => {
  console.log(res)
})
queue.addTask(test2).then((res) => {
  console.log(res)
})
queue.addTask(test3).then((res) => {
  console.log(res)
})
queue.addTask(test4).then((res) => {
  console.log(res)
})
queue.addTask(test5).then((res) => {
  console.log(res)
})
queue.addTask(test6).then((res) => {
  console.log(res)
})
queue.addTask(test7).then((res) => {
  console.log(res)
})

/**************************************************************/
