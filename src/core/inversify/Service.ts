import { inject, injectable } from 'inversify'
import { DAO } from './DAO'

@injectable()
export class Service {
  constructor(@inject(DAO) private dao: DAO) {}

  getData() {
    return this.dao.getData()
  }
}
