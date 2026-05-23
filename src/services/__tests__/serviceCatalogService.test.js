import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args) => args),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  orderBy: vi.fn((field, dir) => ({ orderBy: field, dir })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}))

vi.mock('../../lib/firebase.js', () => ({ db: {} }))

import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getServices,
  createService,
  updateService,
  archiveService,
  VEHICLE_COMPONENTS,
} from '../serviceCatalogService.js'

function makeSnap(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d })), empty: docs.length === 0 }
}

describe('VEHICLE_COMPONENTS', () => {
  it('содержит 8 узлов', () => {
    expect(VEHICLE_COMPONENTS).toHaveLength(8)
    expect(VEHICLE_COMPONENTS).toContain('engine')
    expect(VEHICLE_COMPONENTS).toContain('other')
  })
})

describe('getCategories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает массив категорий с id', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'cat1', name: 'ТО', vehicleComponent: 'engine' }]),
    )
    const result = await getCategories()
    expect(result).toEqual([{ id: 'cat1', name: 'ТО', vehicleComponent: 'engine' }])
  })

  it('возвращает пустой массив если коллекция пуста', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    const result = await getCategories()
    expect(result).toEqual([])
  })

  it('сортирует категории по имени', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'b', name: 'Шины' },
        { id: 'a', name: 'Двигатель' },
      ]),
    )
    const result = await getCategories()
    expect(result[0].name).toBe('Двигатель')
    expect(result[1].name).toBe('Шины')
  })
})

describe('createCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает addDoc с корректными полями и возвращает id', async () => {
    addDoc.mockResolvedValue({ id: 'newCatId' })

    const result = await createCategory({ name: 'ТО', vehicleComponent: 'engine' })

    expect(addDoc).toHaveBeenCalledOnce()
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.name).toBe('ТО')
    expect(payload.vehicleComponent).toBe('engine')
    expect(payload.description).toBe('')
    expect(payload.createdAt).toBe('SERVER_TS')
    expect(payload.updatedAt).toBe('SERVER_TS')
    expect(result).toEqual({ id: 'newCatId' })
  })

  it('использует переданный description', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createCategory({ name: 'ТО', description: 'Техническое обслуживание', vehicleComponent: 'engine' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.description).toBe('Техническое обслуживание')
  })
})

describe('updateCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает updateDoc с переданными полями + updatedAt', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateCategory('cat1', { name: 'Новое название' })

    expect(updateDoc).toHaveBeenCalledOnce()
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.name).toBe('Новое название')
    expect(payload.updatedAt).toBe('SERVER_TS')
  })
})

describe('deleteCategory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('удаляет категорию если нет активных услуг', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    deleteDoc.mockResolvedValue(undefined)

    await deleteCategory('cat1')
    expect(deleteDoc).toHaveBeenCalledOnce()
  })

  it('бросает ошибку если есть активные услуги', async () => {
    getDocs.mockResolvedValue(makeSnap([{ id: 'svc1', name: 'Замена масла', archived: false, categoryId: 'cat1' }]))

    await expect(deleteCategory('cat1')).rejects.toThrow('Нельзя удалить категорию')
    expect(deleteDoc).not.toHaveBeenCalled()
  })
})

describe('getServices', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает массив услуг с id', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'svc1', name: 'Замена масла', price: 500, archived: false }]),
    )
    const result = await getServices()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('svc1')
    expect(result[0].name).toBe('Замена масла')
  })

  it('возвращает пустой массив если нет услуг', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    const result = await getServices()
    expect(result).toEqual([])
  })

  it('передаёт where-условие categoryId если фильтр задан', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    await getServices({ categoryId: 'cat1' })
    const { where: whereMock } = await import('firebase/firestore')
    const categoryCalls = whereMock.mock.calls.filter(([f]) => f === 'categoryId')
    expect(categoryCalls.length).toBeGreaterThan(0)
  })

  it('передаёт where-условие vehicleComponent если фильтр задан', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    await getServices({ vehicleComponent: 'engine' })
    const { where: whereMock } = await import('firebase/firestore')
    const componentCalls = whereMock.mock.calls.filter(([f]) => f === 'vehicleComponent')
    expect(componentCalls.length).toBeGreaterThan(0)
  })

  it('сортирует услуги по имени', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'b', name: 'Шиномонтаж', archived: false },
        { id: 'a', name: 'Замена масла', archived: false },
      ]),
    )
    const result = await getServices()
    expect(result[0].name).toBe('Замена масла')
    expect(result[1].name).toBe('Шиномонтаж')
  })

  it('включает archived услуги при archived=true', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'svc2', name: 'Архивная', archived: true }]),
    )
    const result = await getServices({ archived: true })
    expect(result[0].archived).toBe(true)
  })
})

describe('createService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает addDoc с archived=false и возвращает id', async () => {
    addDoc.mockResolvedValue({ id: 'newSvcId' })

    const result = await createService({
      name: 'Замена масла',
      price: 500,
      categoryId: 'cat1',
      vehicleComponent: 'engine',
    })

    const [, payload] = addDoc.mock.calls[0]
    expect(payload.archived).toBe(false)
    expect(payload.name).toBe('Замена масла')
    expect(payload.price).toBe(500)
    expect(payload.createdAt).toBe('SERVER_TS')
    expect(result).toEqual({ id: 'newSvcId' })
  })

  it('сохраняет price=null если цена не передана', async () => {
    addDoc.mockResolvedValue({ id: 'svcNullPrice' })

    await createService({
      name: 'Диагностика',
      categoryId: 'cat2',
      vehicleComponent: 'other',
      // price не передаётся
    })

    const [, payload] = addDoc.mock.calls[0]
    expect(payload.price).toBeNull()
  })

  it('сохраняет price=null если передан null явно', async () => {
    addDoc.mockResolvedValue({ id: 'x' })

    await createService({
      name: 'Диагностика',
      price: null,
      categoryId: 'cat2',
      vehicleComponent: 'other',
    })

    const [, payload] = addDoc.mock.calls[0]
    expect(payload.price).toBeNull()
  })
})

describe('updateService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает updateDoc с переданными полями + updatedAt', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateService('svc1', { name: 'Замена масла премиум', price: 700 })

    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.name).toBe('Замена масла премиум')
    expect(payload.price).toBe(700)
    expect(payload.updatedAt).toBe('SERVER_TS')
  })
})

describe('archiveService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('устанавливает archived=true при архивировании', async () => {
    updateDoc.mockResolvedValue(undefined)
    await archiveService('svc1', true)

    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.archived).toBe(true)
    expect(payload.updatedAt).toBe('SERVER_TS')
  })

  it('устанавливает archived=false при восстановлении', async () => {
    updateDoc.mockResolvedValue(undefined)
    await archiveService('svc1', false)

    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.archived).toBe(false)
  })
})
