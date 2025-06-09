import { describe, expect, test } from '@jest/globals'
import { AngleUnit, get2linesAngle, degreesToRadians, rotatePointByOrigin, getLineSlope, radiansToDegrees, calculateDistance, getArcParamsBy3Points, normalizeAngle0To90 } from './math'

describe('getLineSlope', () => {
  test('getLineSlope', () => {
    expect(getLineSlope({ x: 0, y: 0 }, { x: 400, y: 300 })).toBe(3 / 4)
  })
})

describe('get2linesAngle', () => {
  test('get2linesAngle夹角1（度数）：', () => {
    const pointA = { x: 0, y: 0 }
    const pointB = { x: 1, y: 3 }
    const pointC = { x: 0, y: 0 }
    const pointD = { x: 1, y: 3 }
    expect(get2linesAngle(pointA, pointB, pointC, pointD, AngleUnit.Degrees).toFixed(2)).toBe('0.00')
  })
  test('get2linesAngle夹角2（度数）：', () => {
    const pointA = { x: 0, y: 0 }
    const pointB = { x: 1, y: 3 }
    const pointC = { x: 0, y: 0 }
    const pointD = { x: -1, y: -3 }
    expect(get2linesAngle(pointA, pointB, pointC, pointD, AngleUnit.Degrees).toFixed(2)).toBe('180.00')
  })
  test('get2linesAngle夹角3（度数）：', () => {
    const pointA = { x: 0, y: 0 }
    const pointB = { x: 1, y: 3 }
    const pointC = { x: 0, y: 0 }
    const pointD = { x: -2, y: -2 }
    expect(get2linesAngle(pointA, pointB, pointC, pointD, AngleUnit.Degrees).toFixed(2)).toBe('153.43')
  })
  test('get2linesAngle夹角3（度数）：', () => {
    const pointA = { x: 0, y: 0 }
    const pointB = { x: 1, y: 3 }
    const pointC = { x: 0, y: 0 }
    const pointD = { x: -2, y: 2 }
    expect(get2linesAngle(pointA, pointB, pointC, pointD, AngleUnit.Degrees).toFixed(2)).toBe('63.43')
  })
})

describe('rotatePoints', () => {
  const pointA = { x: 370, y: 1250 }
  test('pointA', () => {
    const res = rotatePointByOrigin(pointA, pointA, degreesToRadians(30))
    expect(res.x.toFixed(2)).toBe('370.00')
    expect(res.y.toFixed(2)).toBe('1250.00')
  })
  test('pointB', () => {
    const pointB = { x: 400, y: 1250 }
    const res = rotatePointByOrigin(pointB, pointA, degreesToRadians(30))
    expect(res.x.toFixed(2)).toBe('395.98')
    expect(res.y.toFixed(2)).toBe('1265.00')
  })
  test('pointC', () => {
    const pointC = { x: 410, y: 1230 }
    const res = rotatePointByOrigin(pointC, pointA, degreesToRadians(30))
    expect(res.x.toFixed(2)).toBe('414.64')
    expect(res.y.toFixed(2)).toBe('1252.68')
  })
  test('pointD', () => {
    const pointC = { x: 400, y: 1250 }
    const res = rotatePointByOrigin(pointC, pointA, degreesToRadians(45))
    expect(res.x.toFixed(2)).toBe('391.21')
    expect(res.y.toFixed(2)).toBe('1271.21')
  })
})

describe('normalizeAngle0To90', () => {
  test('normalizeAngle0To90', () => {
    expect(normalizeAngle0To90(120)).toBe(60)
    expect(normalizeAngle0To90(180)).toBe(0)
    expect(normalizeAngle0To90(20)).toBe(20)
    expect(normalizeAngle0To90(-20)).toBe(20)
    expect(normalizeAngle0To90(210)).toBe(30)
    expect(normalizeAngle0To90(300)).toBe(60)
    expect(normalizeAngle0To90(390)).toBe(30)
  })
})

describe('radiansToDegrees', () => {
  test('radiansToDegrees', () => {
    expect(radiansToDegrees(Math.PI / 2)).toBe(90)
  })
})

describe('degreesToRadians', () => {
  test('degreesToRadians', () => {
    expect(degreesToRadians(90)).toBe(Math.PI / 2)
  })
})

describe('calculateDistance', () => {
  test('calculateDistance', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 400, y: 300 })).toBe(500)
  })
})

describe('getArcParamsBy3Points', () => {
  test('getArcParamsBy3Points', () => {
    const res = getArcParamsBy3Points({ x: 360, y: 1189.3807 }, { x: 360, y: 1233.7497 }, { x: 404.3689, y: 1189.3807 })?.slice(0, 5) as [number, number, number, number, number]
    expect(res?.map((item) => item.toFixed(2))).toStrictEqual([360, 1189.3807, 44.36789, Math.PI / 2, 0].map((item) => item.toFixed(2)))
  })
  test('getArcParamsBy3Points', () => {
    const res = getArcParamsBy3Points({ x: 360, y: 1189.3807 }, { x: 337.8155, y: 1227.8054 }, { x: 398.4246, y: 1167.1963 })?.slice(0, 5) as [number, number, number, number, number]
    expect(res?.map((item) => item.toFixed(2))).toStrictEqual([360, 1189.3807, 44.36789, (Math.PI * 2) / 3, -Math.PI / 6].map((item) => item.toFixed(2)))
  })
  test('getArcParamsBy3Points', () => {
    const res = getArcParamsBy3Points({ x: 360, y: 1189.3807 }, { x: 337.8155, y: 1227.8054 }, { x: 337.8155, y: 1150.9561 })?.slice(0, 5) as [number, number, number, number, number]
    expect(res?.map((item) => item.toFixed(2))).toStrictEqual([360, 1189.3807, 44.36789, (Math.PI * 2) / 3, (Math.PI * 240) / 180].map((item) => item.toFixed(2)))
  })
})
