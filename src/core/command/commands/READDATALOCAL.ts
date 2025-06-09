import { IEntity } from '@/core/data/DataManager'
import { BaseCommand, type ICommandRule } from '../BaseCommand'
import { ILocalStorageName } from './SAVEDATALOCAL'

export class READDATALOCAL extends BaseCommand {
  protected rule: ICommandRule = {
    action: () => {
      try {
        const allLocalDataString =
          localStorage.getItem(ILocalStorageName.allLocalData) ||
          JSON.stringify([
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [560.7685990200619, 282.626456730535],
                    [623.529322688868, 243.0739120587179],
                  ],
                },
              ],
              id: '87-4-182-255',
              AABB: [
                [559.6435990200619, 241.9489120587179],
                [624.654322688868, 283.751456730535],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [556.8750000000001, 247.5],
                    [594.0894538679736, 306.5507153224364],
                  ],
                },
              ],
              id: '26-149-19-255',
              AABB: [
                [555.7500000000001, 246.375],
                [595.2144538679736, 307.6757153224364],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [567.0118332081142, 250.30362509391432],
                    [604.2262870760877, 309.35434041635074],
                  ],
                },
              ],
              id: '61-121-108-255',
              AABB: [
                [565.8868332081142, 249.17862509391432],
                [605.3512870760877, 310.47934041635074],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [573.7736664162285, 252.83931254695716],
                    [610.988120284202, 311.8900278693936],
                  ],
                },
              ],
              id: '9-253-235-255',
              AABB: [
                [572.6486664162285, 251.71431254695716],
                [612.113120284202, 313.0150278693936],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: true,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [561.9404583020287, 248.61316679188576],
                    [599.1549121700021, 307.6638821143222],
                  ],
                },
              ],
              id: '50-124-63-255',
              AABB: [
                [560.8154583020287, 247.48816679188576],
                [600.2799121700021, 308.7888821143222],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [548.935390905862, 278.4003109754636],
                    [611.6961145746682, 238.8477663036465],
                  ],
                },
              ],
              id: '46-31-226-255',
              AABB: [
                [547.810390905862, 237.7227663036465],
                [612.8211145746682, 279.5253109754636],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [543.8699326038334, 277.2871441835778],
                    [606.6306562726396, 237.73459951176073],
                  ],
                },
              ],
              id: '145-5-252-255',
              AABB: [
                [542.7449326038334, 236.60959951176073],
                [607.7556562726396, 278.4121441835778],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [542.1613720860751, 253.10109906931677],
                    [604.9220957548813, 213.54855439749974],
                  ],
                },
              ],
              id: '80-58-236-255',
              AABB: [
                [541.0363720860751, 212.42355439749974],
                [606.0470957548813, 254.22609906931677],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [554.0067658119476, 280.09076927749214],
                    [616.7674894807537, 240.53822460567505],
                  ],
                },
              ],
              id: '96-73-174-255',
              AABB: [
                [552.8817658119476, 239.41322460567505],
                [617.8924894807537, 281.21576927749214],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [736.5095676218144, 232.78493852575943],
                    [699.2951137538411, 173.7342232033231],
                  ],
                },
              ],
              id: '116-218-93-255',
              AABB: [
                [698.1701137538411, 172.6092232033231],
                [737.6345676218144, 233.90993852575943],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [610.9881202842018, 311.8900278693936],
                    [736.5095676218144, 232.78493852575943],
                  ],
                },
              ],
              id: '130-75-239-255',
              AABB: [
                [609.8631202842018, 231.65993852575943],
                [737.6345676218144, 313.0150278693936],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [724.6763595076146, 228.55879277068803],
                    [687.4619056396413, 169.5080774482517],
                  ],
                },
              ],
              id: '31-202-3-255',
              AABB: [
                [686.3369056396413, 168.3830774482517],
                [725.8013595076146, 229.68379277068803],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [719.6109012055861, 227.44562597880227],
                    [682.3964473376127, 168.39491065636594],
                  ],
                },
              ],
              id: '48-42-128-255',
              AABB: [
                [681.2714473376127, 167.26991065636594],
                [720.7359012055861, 228.57062597880227],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [729.7477344137002, 230.2492510727166],
                    [692.5332805457268, 171.19853575028026],
                  ],
                },
              ],
              id: '235-66-172-255',
              AABB: [
                [691.4082805457268, 170.07353575028026],
                [730.8727344137002, 231.3742510727166],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [594.0894538679735, 306.5507153224364],
                    [719.6109012055861, 227.44562597880227],
                  ],
                },
              ],
              id: '199-62-105-255',
              AABB: [
                [592.9644538679735, 226.32062597880227],
                [720.7359012055861, 307.6757153224364],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [599.154912170002, 307.6638821143222],
                    [724.6763595076146, 228.55879277068803],
                  ],
                },
              ],
              id: '41-216-53-255',
              AABB: [
                [598.029912170002, 227.43379277068803],
                [725.8013595076146, 308.7888821143222],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [604.2262870760876, 309.35434041635074],
                    [729.7477344137002, 230.2492510727166],
                  ],
                },
              ],
              id: '21-38-82-255',
              AABB: [
                [603.1012870760876, 229.1242510727166],
                [730.8727344137002, 310.47934041635074],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [611.6961145746682, 238.8477663036465],
                    [593.0888876406815, 209.32240864242834],
                  ],
                },
              ],
              id: '145-189-176-255',
              AABB: [
                [591.9638876406815, 208.19740864242834],
                [612.8211145746682, 239.9727663036465],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [623.529322688868, 243.0739120587179],
                    [604.9220957548813, 213.54855439749974],
                  ],
                },
              ],
              id: '134-121-231-255',
              AABB: [
                [603.7970957548813, 212.42355439749974],
                [624.654322688868, 244.1989120587179],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: true,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [616.7674894807537, 240.53822460567505],
                    [598.1602625467671, 211.0128669444569],
                  ],
                },
              ],
              id: '145-185-172-255',
              AABB: [
                [597.0352625467671, 209.8878669444569],
                [617.8924894807537, 241.66322460567505],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [535.3995388779608, 250.56541161627393],
                    [554.0067658119476, 280.09076927749214],
                  ],
                },
              ],
              id: '140-186-10-255',
              AABB: [
                [534.2745388779608, 249.44041161627393],
                [555.1317658119476, 281.21576927749214],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [542.1613720860751, 253.10109906931677],
                    [560.7685990200619, 282.626456730535],
                  ],
                },
              ],
              id: '227-108-246-255',
              AABB: [
                [541.0363720860751, 251.97609906931677],
                [561.8935990200619, 283.751456730535],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [525.2627056698468, 247.7617865223596],
                    [543.8699326038335, 277.2871441835778],
                  ],
                },
              ],
              id: '95-185-235-255',
              AABB: [
                [524.1377056698468, 246.6367865223596],
                [544.9949326038335, 278.4121441835778],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [530.3281639718753, 248.87495331424537],
                    [548.935390905862, 278.4003109754636],
                  ],
                },
              ],
              id: '168-162-63-255',
              AABB: [
                [529.2031639718753, 247.74995331424537],
                [550.060390905862, 279.5253109754636],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [606.6306562726396, 237.73459951176073],
                    [588.0234293386529, 208.20924185054258],
                  ],
                },
              ],
              id: '178-213-146-255',
              AABB: [
                [586.8984293386529, 207.08424185054258],
                [607.7556562726396, 238.85959951176073],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [556.8750000000001, 247.50000000000003],
                    [682.3964473376127, 168.39491065636594],
                  ],
                },
              ],
              id: '56-72-149-255',
              AABB: [
                [555.7500000000001, 167.26991065636594],
                [683.5214473376127, 248.62500000000003],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [561.9404583020287, 248.6131667918858],
                    [687.4619056396413, 169.5080774482517],
                  ],
                },
              ],
              id: '62-25-200-255',
              AABB: [
                [560.8154583020287, 168.3830774482517],
                [688.5869056396413, 249.7381667918858],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [567.0118332081142, 250.30362509391435],
                    [692.5332805457268, 171.19853575028026],
                  ],
                },
              ],
              id: '57-167-33-255',
              AABB: [
                [565.8868332081142, 170.07353575028026],
                [693.6582805457268, 251.42862509391435],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [573.7736664162285, 252.8393125469572],
                    [699.2951137538411, 173.7342232033231],
                  ],
                },
              ],
              id: '116-222-73-255',
              AABB: [
                [572.6486664162285, 172.6092232033231],
                [700.4201137538411, 253.9643125469572],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'CIRCLE',
              shape: [
                {
                  type: 'CIRCLE',
                  points: [[573.7736664162284, 252.83931254695716]],
                  r: 49.42323593209979,
                },
              ],
              id: '97-47-118-255',
              AABB: [
                [523.2254304841285, 202.29107661485736],
                [624.3219023483282, 303.38754847905693],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                boxSelected: false,
                collisioned: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [525.2627056698468, 247.7617865223596],
                    [588.0234293386529, 208.20924185054258],
                  ],
                },
              ],
              id: '131-34-239-255',
              AABB: [
                [524.1377056698468, 207.08424185054258],
                [589.1484293386529, 248.8867865223596],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [530.3281639718753, 248.87495331424537],
                    [593.0888876406815, 209.32240864242834],
                  ],
                },
              ],
              id: '54-96-3-255',
              AABB: [
                [529.2031639718753, 208.19740864242834],
                [594.2138876406815, 249.99995331424537],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'LINE',
              shape: [
                {
                  type: 'LINE',
                  points: [
                    [535.3995388779608, 250.56541161627393],
                    [598.1602625467671, 211.0128669444569],
                  ],
                },
              ],
              id: '78-49-246-255',
              AABB: [
                [534.2745388779608, 209.8878669444569],
                [599.2852625467671, 251.69041161627393],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                collisioned: false,
                boxSelected: false,
              },
            },
            {
              type: 'CIRCLE',
              shape: [
                {
                  type: 'CIRCLE',
                  points: [[561.9404583020286, 248.61316679188576]],
                  r: 49.42323593209979,
                },
              ],
              id: '111-221-178-255',
              AABB: [
                [511.39222236992873, 198.06493085978596],
                [612.4886942341284, 299.16140272398553],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                boxSelected: false,
                collisioned: false,
              },
            },
            {
              type: 'CIRCLE',
              shape: [
                {
                  type: 'CIRCLE',
                  points: [[556.875, 247.5]],
                  r: 49.42323593209979,
                },
              ],
              id: '4-156-3-255',
              AABB: [
                [506.3267640679002, 196.9517640679002],
                [607.4232359320998, 298.0482359320998],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                boxSelected: false,
                collisioned: false,
              },
            },
            {
              type: 'CIRCLE',
              shape: [
                {
                  type: 'CIRCLE',
                  points: [[567.0118332081141, 250.30362509391432]],
                  r: 49.42323593209979,
                },
              ],
              id: '85-88-177-255',
              AABB: [
                [516.4635972760143, 199.75538916181452],
                [617.560069140214, 300.8518610260141],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
              other: {
                boxSelected: false,
                collisioned: false,
              },
            },
            {
              type: 'ARC',
              shape: [
                {
                  type: 'ARC',
                  points: [[561.6099986429685, 252.2451492409711]],
                  r: 60.111134818181654,
                  startAngle: 2.820336956647173,
                  endAngle: 1.298768669427688,
                  anticlockwise: true,
                },
              ],
              id: '19-15-139-255',
              AABB: [
                [503.44916934564856, 270.1007368371596],
                [578.8859639622995, 313.48128405915276],
              ],
              layer: {
                id: '7b1764',
                status: true,
                name: '',
                on: true,
                frozen: false,
                locked: false,
                color: '#fff',
                lineType: '',
                lineWeight: 0,
                printStyle: '#fff',
                print: true,
                description: '',
                entityList: [],
              },
            },
          ])

        if (allLocalDataString) {
          const entities = JSON.parse(allLocalDataString) as IEntity[]
          this.shapeCreated(entities)
        }
      } catch (error) {
        console.error(error)
      }
    },
    msg: '读取本地数据',
    next: [],
    subCommand: {},
  }
  protected dispose() {
    // 无需处理
  }
}
