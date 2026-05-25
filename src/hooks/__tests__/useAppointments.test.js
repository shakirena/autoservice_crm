import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../services/appointmentsService.js', () => ({
  subscribeAppointments: vi.fn(),
  getAppointment: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  linkClientToAppointment: vi.fn(),
}))

import {
  subscribeAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  linkClientToAppointment,
} from '../../services/appointmentsService.js'

// ─── Tests for appointmentsService (unit) ────────────────────────────────────

describe('appointmentsService mocks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('subscribeAppointments вызывает callback с данными', () => {
    const mockDocs = [
      { id: 'a1', date: '2026-05-25', time: '10:00', status: 'waiting', clientName: 'Иванов' },
    ]
    subscribeAppointments.mockImplementation((_filters, cb) => {
      cb(mockDocs)
      return () => {}
    })

    const callback = vi.fn()
    const unsub = subscribeAppointments({}, callback)
    expect(callback).toHaveBeenCalledWith(mockDocs)
    expect(typeof unsub).toBe('function')
  })

  it('createAppointment возвращает id', async () => {
    createAppointment.mockResolvedValue({ id: 'new-id-1' })
    const result = await createAppointment({
      date: '2026-05-25',
      time: '09:00',
      duration: 60,
      serviceType: 'Замена масла',
      clientName: 'Мамедов Эльшан',
      clientPhone: '+994501234567',
    })
    expect(result).toEqual({ id: 'new-id-1' })
    expect(createAppointment).toHaveBeenCalledOnce()
  })

  it('updateAppointment вызывается с правильными аргументами', async () => {
    updateAppointment.mockResolvedValue(undefined)
    await updateAppointment('a1', { status: 'confirmed' })
    expect(updateAppointment).toHaveBeenCalledWith('a1', { status: 'confirmed' })
  })

  it('deleteAppointment вызывается с id', async () => {
    deleteAppointment.mockResolvedValue(undefined)
    await deleteAppointment('a1')
    expect(deleteAppointment).toHaveBeenCalledWith('a1')
  })

  it('getAppointment возвращает запись по id', async () => {
    const doc = { id: 'a1', date: '2026-05-25', status: 'waiting' }
    getAppointment.mockResolvedValue(doc)
    const result = await getAppointment('a1')
    expect(result.id).toBe('a1')
  })

  it('linkClientToAppointment вызывается с нужными аргументами', async () => {
    linkClientToAppointment.mockResolvedValue(undefined)
    await linkClientToAppointment('a1', 'c1', 'Иванов Иван', '+994501111111')
    expect(linkClientToAppointment).toHaveBeenCalledWith(
      'a1',
      'c1',
      'Иванов Иван',
      '+994501111111',
    )
  })

  it('subscribeAppointments возвращает функцию отписки', () => {
    const unsubFn = vi.fn()
    subscribeAppointments.mockReturnValue(unsubFn)
    const unsub = subscribeAppointments({ status: 'waiting' }, vi.fn())
    unsub()
    expect(unsubFn).toHaveBeenCalledOnce()
  })
})
