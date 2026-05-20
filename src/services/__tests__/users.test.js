import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUserDoc, getUserDoc } from '../users.js'

// Мок firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, col, id) => ({ path: `${col}/${id}` })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
}))

vi.mock('../../lib/firebase.js', () => ({ db: {} }))

import { getDoc, setDoc } from 'firebase/firestore'

describe('createUserDoc', () => {
  beforeEach(() => vi.clearAllMocks())

  it('записывает документ с uid и серверными timestamp', async () => {
    setDoc.mockResolvedValue(undefined)

    await createUserDoc('uid123', {
      email: 'test@test.com',
      displayName: 'Test User',
    })

    expect(setDoc).toHaveBeenCalledOnce()
    const [, payload] = setDoc.mock.calls[0]
    expect(payload.uid).toBe('uid123')
    expect(payload.email).toBe('test@test.com')
    expect(payload.createdAt).toBe('SERVER_TIMESTAMP')
    expect(payload.updatedAt).toBe('SERVER_TIMESTAMP')
  })

  it('удаляет поле role из данных клиента', async () => {
    setDoc.mockResolvedValue(undefined)

    await createUserDoc('uid123', {
      email: 'hacker@test.com',
      displayName: 'Hacker',
      role: 'admin',
    })

    const [, payload] = setDoc.mock.calls[0]
    expect(payload.role).toBeUndefined()
  })
})

describe('getUserDoc', () => {
  it('возвращает данные документа если он существует', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'uid123', email: 'test@test.com', role: 'manager' }),
    })

    const result = await getUserDoc('uid123')
    expect(result).toEqual({ uid: 'uid123', email: 'test@test.com', role: 'manager' })
  })

  it('возвращает null если документ не существует', async () => {
    getDoc.mockResolvedValue({ exists: () => false })

    const result = await getUserDoc('nonexistent')
    expect(result).toBeNull()
  })
})
