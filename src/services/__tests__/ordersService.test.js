import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}))

vi.mock('../../lib/firebase.js', () => ({ db: {} }))

import { getDocs, getDoc, addDoc, updateDoc } from 'firebase/firestore'
import {
  getOrders,
  getOrdersByMechanic,
  getOrder,
  createOrder,
  updateOrderStatus,
} from '../ordersService.js'

function makeSnap(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d })) }
}

function makeDocSnap(data, exists = true) {
  return { exists: () => exists, id: data?.id ?? 'x', data: () => data }
}

function makeTs(ms) {
  return { toMillis: () => ms }
}

describe('getOrders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает массив заказов с id', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'o1', clientId: 'c1', date: '2026-05-20', status: 'draft' }]),
    )
    const result = await getOrders()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('o1')
  })

  it('сортирует по date desc (новые первые)', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'old', date: '2026-01-01', status: 'completed' },
        { id: 'new', date: '2026-05-21', status: 'draft' },
      ]),
    )
    const result = await getOrders()
    expect(result[0].id).toBe('new')
    expect(result[1].id).toBe('old')
  })

  it('при одинаковой дате сортирует по createdAt', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'first', date: '2026-05-21', createdAt: makeTs(1000) },
        { id: 'second', date: '2026-05-21', createdAt: makeTs(2000) },
      ]),
    )
    const result = await getOrders()
    expect(result[0].id).toBe('second')
  })

  it('возвращает пустой массив если нет заказов', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    expect(await getOrders()).toEqual([])
  })
})

describe('getOrdersByMechanic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает только заказы конкретного механика', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'o1', createdBy: 'uid-mech', date: '2026-05-20' },
        { id: 'o2', createdBy: 'uid-other', date: '2026-05-19' },
      ]),
    )
    const result = await getOrdersByMechanic('uid-mech')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('o1')
  })

  it('возвращает пустой массив если у механика нет заказов', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    expect(await getOrdersByMechanic('uid-x')).toEqual([])
  })
})

describe('getOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает заказ по id', async () => {
    getDoc.mockResolvedValue(makeDocSnap({ id: 'o1', status: 'draft', clientId: 'c1' }))
    const result = await getOrder('o1')
    expect(result.id).toBe('o1')
    expect(result.status).toBe('draft')
  })

  it('бросает ошибку если заказ не найден', async () => {
    getDoc.mockResolvedValue(makeDocSnap(null, false))
    await expect(getOrder('nonexistent')).rejects.toThrow('not found')
  })
})

describe('createOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('создаёт заказ и возвращает id', async () => {
    addDoc.mockResolvedValue({ id: 'newOrderId' })

    const result = await createOrder({
      clientId: 'c1',
      vehicleId: 'v1',
      vehicleComponent: 'engine',
      componentParams: { oilType: '5W-30' },
      services: [{ serviceId: 's1', name: 'Замена масла', price: 500 }],
      totalAmount: 500,
      date: '2026-05-21',
      createdBy: 'uid-admin',
    })

    expect(addDoc).toHaveBeenCalledOnce()
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.clientId).toBe('c1')
    expect(payload.vehicleId).toBe('v1')
    expect(payload.vehicleComponent).toBe('engine')
    expect(payload.status).toBe('draft')
    expect(payload.completedAt).toBeNull()
    expect(payload.createdAt).toBe('SERVER_TS')
    expect(result).toEqual({ id: 'newOrderId' })
  })

  it('totalAmount конвертируется в Number', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createOrder({ clientId: 'c1', vehicleId: 'v1', vehicleComponent: 'engine', componentParams: {}, services: [], totalAmount: '750', date: '2026-05-21', createdBy: 'uid' })
    const [, payload] = addDoc.mock.calls[0]
    expect(typeof payload.totalAmount).toBe('number')
    expect(payload.totalAmount).toBe(750)
  })

  it('status по умолчанию — draft', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createOrder({ clientId: 'c1', vehicleId: 'v1', vehicleComponent: 'engine', componentParams: {}, services: [], totalAmount: 0, date: '2026-05-21', createdBy: 'uid' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.status).toBe('draft')
  })

  it('принимает явный статус in_progress', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createOrder({ clientId: 'c1', vehicleId: 'v1', vehicleComponent: 'engine', componentParams: {}, services: [], totalAmount: 0, date: '2026-05-21', createdBy: 'uid', status: 'in_progress' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.status).toBe('in_progress')
  })
})

describe('updateOrderStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('устанавливает completedAt при completed', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateOrderStatus('o1', 'completed', 'uid-mech')
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.status).toBe('completed')
    expect(payload.completedAt).toBe('SERVER_TS')
  })

  it('сбрасывает completedAt при in_progress', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateOrderStatus('o1', 'in_progress', 'uid-admin')
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.status).toBe('in_progress')
    expect(payload.completedAt).toBeNull()
  })

  it('сбрасывает completedAt при draft', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateOrderStatus('o1', 'draft', 'uid-admin')
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.completedAt).toBeNull()
  })
})
