import { inject, injectable } from 'inversify'
import { Service } from './Service'

@injectable()
export class Controller {
  constructor(@inject(Service) private service: Service) {}

  getData() {
    return this.service.getData()
  }
}
