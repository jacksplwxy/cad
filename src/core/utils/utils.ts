// 生成唯一id
function generateUniqueIdFn(): () => string {
  function generateId(length: number): string {
    const randomValues = new Uint8Array(Math.ceil(length / 2))
    crypto.getRandomValues(randomValues)
    let uniqueId = ''
    for (let i = 0; i < randomValues.length; i++) {
      uniqueId += randomValues[i].toString(16).padStart(2, '0')
    }
    return uniqueId.slice(0, length)
  }
  const idPool: Record<string, boolean> = {}
  return (length = 6) => {
    let id = generateId(length)
    while (idPool[id]) {
      id = generateId(length)
    }
    idPool[id] = true
    return id
  }
}
export const generateUniqueId = generateUniqueIdFn()

// 节流函数
type ThrottleFunction<T> = (...args: any[]) => T | null
export function throttle<T>(func: ThrottleFunction<T>, delay: number): ThrottleFunction<T> {
  let lastExecTime = 0
  let lastResult: T | null = null
  let timeoutId: NodeJS.Timeout | null = null
  return function (...args: any[]): T | null {
    const currentTime = Date.now()
    const elapsedTime = currentTime - lastExecTime
    if (elapsedTime > delay) {
      lastExecTime = currentTime
      lastResult = func(...args)
    } else {
      // 如果在延迟期间再次调用，清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      // 设置新的定时器，在延迟结束后执行一次
      timeoutId = setTimeout(() => {
        lastExecTime = Date.now()
        lastResult = func(...args)
        timeoutId = null
      }, delay - elapsedTime)
    }
    return lastResult
  }
}

// 防抖函数
type DebouncedFunction<T extends any[]> = (...args: T) => void

export function debounce<T extends any[]>(func: (...args: T) => void, wait: number): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return function (...args: T): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, wait)
  }
}

// 深拷贝
export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// 判断数字或字符串是否为数字
export function isNumeric(value: string | number): boolean {
  if (typeof value === 'number') {
    return true
  }
  // 使用正则表达式进行匹配
  const numericRegex = /^[-+]?(?:\d*\.\d+|\d+\.\d*|\d+)$/
  return numericRegex.test(value)
}

// 判断数据类型是否为number[]
export function isNumArray(data: any): boolean {
  return Array.isArray(data) && data.every((item) => typeof item === 'number')
}

// 读取本地图片为ImageData
export async function base64ToImageData(path: string): Promise<ImageData | null> {
  return await new Promise((resolve, reject) => {
    const virtualCanvas = document.createElement('canvas')
    const virtualCtx = virtualCanvas.getContext('2d') as CanvasRenderingContext2D
    const img = new Image()
    img.onload = function () {
      virtualCanvas.width = img.width
      virtualCanvas.height = img.height
      virtualCtx.drawImage(img, 0, 0)
      const imageData = virtualCtx.getImageData(0, 0, virtualCanvas.width, virtualCanvas.height)
      resolve(imageData)
    }
    img.onerror = function () {
      resolve(null)
    }
    img.src = path
  })
}

// 判断一个class实例的所有属性与另外一个class实例中的所有属性相等？
export function areAllPropertiesEqual<T>(obj1: T, obj2: T): boolean {
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }
  const keys1 = Object.keys(obj1) as Array<keyof T>
  const keys2 = Object.keys(obj2) as Array<keyof T>
  // 首先检查属性数量是否相同
  if (keys1.length !== keys2.length) {
    return false
  }
  // 检查每个属性是否都存在且值相等
  return keys1.every((key) => {
    return key in obj2 && obj1[key] === obj2[key]
  })
}
