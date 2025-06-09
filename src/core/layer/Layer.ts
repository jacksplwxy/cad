import { generateUniqueId } from '@/core/utils/utils'
export interface ILayer {
  id: string
  status: boolean
  name: string
  on: boolean
  frozen: boolean
  locked: boolean
  color: string
  lineType: string
  lineWeight: number
  printStyle: string
  print: boolean
  description: string
  entityList: any[]
}

export class Layer implements ILayer {
  id: string = generateUniqueId()
  status: boolean = false
  name: string = ''
  on: boolean = true
  frozen: boolean = false
  locked: boolean = false
  color: string = '#fff'
  lineType: string = ''
  lineWeight: number = 0
  printStyle: string = '#fff'
  print: boolean = true
  description: string = ''
  entityList: string[] = []
}
