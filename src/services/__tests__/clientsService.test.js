import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}))

vi.mock('../../lib/firebase.js', () => ({ db: {} }))

import { getDocs, addDoc, updateDoc } from 'firebase/firestore'
import { getClients, createClient, updateClient } from '../clientsService.js'

function makeTs(ms) {
  return { toMillis: () => ms }
}

function makeSnap(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d })) }
}

describe('getClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('возвращает массив клиентов с id', async () => {
    getDocs.mockResolvedValue(
      makeSnap([{ id: 'c1', fullName: 'Иванов', phone: '+994501234567', createdAt: makeTs(1000) }]),
    )
    const result = await getClients()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c1')
    expect(result[0].fullName).toBe('Иванов')
  })

  it('сортирует по createdAt desc (новые первые)', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'old', fullName: 'Старый', phone: '111', createdAt: makeTs(1000) },
        { id: 'new', fullName: 'Новый', phone: '222', createdAt: makeTs(2000) },
      ]),
    )
    const result = await getClients()
    expect(result[0].id).toBe('new')
    expect(result[1].id).toBe('old')
  })

  it('возвращает пустой массив если коллекция пуста', async () => {
    getDocs.mockResolvedValue(makeSnap([]))
    const result = await getClients()
    expect(result).toEqual([])
  })

  it('обрабатывает клиентов без createdAt (ставит в конец)', async () => {
    getDocs.mockResolvedValue(
      makeSnap([
        { id: 'noTs', fullName: 'Без даты', phone: '000' },
        { id: 'withTs', fullName: 'С датой', phone: '111', createdAt: makeTs(500) },
      ]),
    )
    const result = await getClients()
    expect(result[0].id).toBe('withTs')
  })
})

describe('createClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('вызывает addDoc с обязательными полями и возвращает id', async () => {
    addDoc.mockResolvedValue({ id: 'newClientId' })

    const result = await createClient({
      fullName: 'Мамедов Эльшан',
      phone: '+994501234567',
      createdBy: 'uid-admin',
    })

    expect(addDoc).toHaveBeenCalledOnce()
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.fullName).toBe('Мамедов Эльшан')
    expect(payload.phone).toBe('+994501234567')
    expect(payload.createdBy).toBe('uid-admin')
    expect(payload.createdAt).toBe('SERVER_TS')
    expect(result).toEqual({ id: 'newClientId' })
  })

  it('устанавливает email как пустую строку если не передан', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createClient({ fullName: 'Тест', phone: '000', createdBy: 'uid' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.email).toBe('')
  })

  it('сохраняет переданный email', async () => {
    addDoc.mockResolvedValue({ id: 'x' })
    await createClient({ fullName: 'Тест', phone: '000', email: 'test@mail.com', createdBy: 'uid' })
    const [, payload] = addDoc.mock.calls[0]
    expect(payload.email).toBe('test@mail.com')
  })
})

describe('updateClient', () => {
  beforeEach(() => vi.clearAllMocks())

  it('обновляет fullName', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateClient('c1', { fullName: 'Новое имя' })
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.fullName).toBe('Новое имя')
    expect(payload.phone).toBeUndefined()
  })

  it('обновляет phone', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateClient('c1', { phone: '+994551234567' })
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.phone).toBe('+994551234567')
    expect(payload.fullName).toBeUndefined()
  })

  it('обновляет несколько полей одновременно', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateClient('c1', { fullName: 'Имя', phone: '123', email: 'a@b.com' })
    const [, payload] = updateDoc.mock.calls[0]
    expect(payload.fullName).toBe('Имя')
    expect(payload.phone).toBe('123')
    expect(payload.email).toBe('a@b.com')
  })

  it('не включает в payload поля которые не переданы', async () => {
    updateDoc.mockResolvedValue(undefined)
    await updateClient('c1', { fullName: 'Только имя' })
    const [, payload] = updateDoc.mock.calls[0]
    expect('email' in payload).toBe(false)
    expect('phone' in payload).toBe(false)
  })
})
