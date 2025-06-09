type EasingFunction = (t: number) => number
type UpdateCallback = (object: any) => void

export class Tween {
  private startTime: number
  private duration: number
  private easingFunction: EasingFunction
  private onUpdateCallback: UpdateCallback | null
  private readonly startObject: any
  private endObject: any

  constructor(startObject: any) {
    this.startTime = 0
    this.duration = 0
    this.easingFunction = (t: number) => t
    this.onUpdateCallback = null
    this.startObject = startObject
    this.endObject = {}
  }

  static Linear = {
    None: (t: number) => t,
  }

  static Quadratic = {
    In: (t: number) => t * t,
    Out: (t: number) => t * (2 - t),
    InOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  }

  static Cubic = {
    In: (t: number) => t * t * t,
    Out: (t: number) => --t * t * t + 1,
    InOut: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  }

  static Elastic = {
    In: (t: number) => -Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1.075) * (2 * Math.PI)) / 0.3),
    Out: (t: number) => Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1,
    InOut: (t: number) =>
      (t /= 0.5) < 1 ? -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1.075) * (2 * Math.PI)) / 0.3) : 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin(((t - 1.075) * (2 * Math.PI)) / 0.3) + 1,
  }

  to(endObject: any, duration: number): this {
    this.endObject = endObject
    this.duration = duration // 毫秒
    return this
  }

  easing(easingFunction: EasingFunction): this {
    this.easingFunction = easingFunction
    return this
  }

  onUpdate(callback: UpdateCallback): this {
    this.onUpdateCallback = callback
    return this
  }

  start(): void {
    this.startTime = performance.now()
    this.update()
  }

  update(): void {
    const currentTime = performance.now()
    const elapsed = currentTime - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)

    const easedValue = this.easingFunction(progress)
    const interpolatedObject: any = {}

    for (const key in this.startObject) {
      if (this.startObject.hasOwnProperty(key) && this.endObject.hasOwnProperty(key)) {
        const startValue = this.startObject[key]
        const endValue = this.endObject[key]
        const interpolatedValue = this.interpolate(startValue, endValue, easedValue)
        interpolatedObject[key] = interpolatedValue
      }
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback(interpolatedObject)
    }

    if (progress < 1) {
      requestAnimationFrame(() => {
        this.update()
      })
    }
  }

  interpolate(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }
}

// 使用示例
// const output = document.getElementById('output')!
// const tween = new Tween({x:100})
// tween
//   .to({ x: 400 }, 2)
//   .easing(Tween.Quadratic.InOut)
//   .onUpdate((object) => {
//     output.innerHTML = 'x == ' + Math.round(object.x)
//     const transform = 'translateX(' + object.x + 'px)'
//     output.style.webkitTransform = transform
//     output.style.transform = transform
//   })
//   .start()
