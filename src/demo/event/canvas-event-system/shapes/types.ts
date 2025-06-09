export interface Shape {
  draw: (ctx: CanvasRenderingContext2D, osCtx: OffscreenCanvasRenderingContext2D) => void

  on: (name: string, listener: Listener) => void

  getListeners: () => Record<string, Listener[]>

  getId: () => string
}

export type Listener = (evt: MouseEvent) => void

export enum EventNames {
  click = 'click',
  mousedown = 'mousedown',
  mousemove = 'mousemove',
  mouseup = 'mouseup',
  mouseenter = 'mouseenter',
  mouseleave = 'mouseleave',
}
