import { injectable } from 'inversify'

@injectable()
export class DAO {
  public getData(): any {
    return {
      code: 0,
      msg: '从DAO获取的数据！',
    }
  }
}
