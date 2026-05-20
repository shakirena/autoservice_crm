import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn((...args) => args),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}))

vi.mock('../../lib/firebase.js', () => ({ db: {} }))

import { getDocs, addDoc, updateDoc } from 'firebase/firestore'
import {
  getVehicles,
  getVehiclesByClient,
  createVehicle,
  updateVehicle,
} from '../vehiclesService.js'

function makeTs(ms) {
  return { toMillis: () => ms }
}

function makeSnap(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d })) }
}

describe('getVehicles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает массив автомобилей с id', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'v1', make: 'Toyota', model: 'Camry', year: 2020, licensePlate: '10-AA-001', createdAt: makeTs(1000) }]),
    )
    const result = await getVehicles()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('v1')
    expect(result[0].make).toBe('Toyota')
  })

  it('сортирует по createdAt desc (новые первые)', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'old', make: 'Lada', model: 'Niva', year: 2010, createdAt: makeTs(1000) },
        { id: 'new', make: 'BMW', model: 'X5', year: 2023, createdAt: makeTs(2000) },
      ]),
    )
    const result = await getVehicles()
    expect(result[0].id).toBe('new')
    expect(result[1].id).toBe('old')
  })

  it('возвращает пустой массив если коллекция пуста', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    expect(await getVehicles()).toEqual([])
  })

  it('обрабатывает автомобили без createdAt', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'noTs', make: 'Kia', model: 'Rio', year: 2019 },
        { id: 'withTs', make: 'Hyundai', model: 'Accent', year: 2021, createdAt: makeTs(500) },
      ]),
    )
    const result = await getVehicles()
    expect(result[0].id).toBe('withTs')
  })
})

describe('getVehiclesByClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает автомобили конкретного клиента', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'v1', clientId: 'c1', make: 'Toyota', createdAt: makeTs(2000) },
        { id: 'v2', clientId: 'c1', make: 'Honda', createdAt: makeTs(1000) },
      ]),
    )
    const result = await getVehiclesByClient('c1')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('v1')
  })

  it('возвращает пустой массив если у клиента нет авто', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    expect(await getVehiclesByClient('c99')).toEqual([])
  })
})

describe('createVehicle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает addDoc с обязательными полями и возвращает id', async () => {
    addDoc.mockResolvedValue({ id: 'newVehicleId' })

    const result = await createVehicle({
      clientId: 'c1',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: '10-AA-001',
    })

    expect(addDoc).toHaveBeenCalledOnce()
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.clientId).toBe('c1')
    expect(payload.make).toBe('Toyota')
    expect(payload.model).toBe('Camry')
    expect(payload.year).toBe(2022)
    expect(payload.licensePlate).toBe('10-AA-001')
    expect(payload.createdAt).toBe('SERVER_TS')
    expect(result).toEqual({ id: 'newVehicleId' })
  })

  it('year конвертируется в Number', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createVehicle({ clientId: 'c1', make: 'BMW', model: 'X5', year: '2020', licensePlate: '00-BB-000' })
    const [, payload] = addDoc.mock.calls[0]
    expect(typeof payload.year).toBe('number')
    expect(payload.year).toBe(2020)
  })

  it('vin устанавливается как пустая строка если не передан', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createVehicle({ clientId: 'c1', make: 'Kia', model: 'Rio', year: 2020, licensePlate: '00-KK-000' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.vin).toBe('')
  })

  it('сохраняет переданный VIN', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createVehicle({ clientId: 'c1', make: 'Kia', model: 'Rio', year: 2020, licensePlate: '00-KK-000', vin: 'WVWZZZ3CZ5E123456' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.vin).toBe('WVWZZZ3CZ5E123456')
  })
})

describe('updateVehicle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('обновляет make', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateVehicle('v1', { make: 'Mercedes' })
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.make).toBe('Mercedes')
    expect(payload.model).toBeUndefined()
  })

  it('обновляет несколько полей', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateVehicle('v1', { make: 'BMW', model: 'X3', year: 2023 })
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.make).toBe('BMW')
    expect(payload.model).toBe('X3')
    expect(payload.year).toBe(2023)
  })

  it('year конвертируется в Number при обновлении', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateVehicle('v1', { year: '2021' })
    const [, payload] = updateDoc.mock.calls[0]
    expect(typeof payload.year).toBe('number')
    expect(payload.year).toBe(2021)
  })

  it('не включает в payload поля которые не переданы', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateVehicle('v1', { licensePlate: 'NEW-001' })
    const [, payload] = updateDoc.mock.calls[0]
    expect('make' in payload).toBe(false)
    expect('model' in payload).toBe(false)
    expect(payload.licensePlate).toBe('NEW-001')
  })
})
