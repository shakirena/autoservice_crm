import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  filterByPeriod,
  computeRevenue,
  computeOrderCount,
  computeAvgTicket,
  computeTopServices,
  computeStaffStats,
} from '../analyticsService.js'

// Фиксируем "сегодня" = 2026-05-21
const FIXED_NOW = new Date('2026-05-21T12:00:00Z')

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterAll(() => {
  vi.useRealTimers()
})

function order(overrides) {
  return {
    id: 'o',
    clientId: 'c1',
    vehicleId: 'v1',
    vehicleComponent: 'engine',
    componentParams: {},
    services: [],
    totalAmount: 0,
    date: '2026-05-21',
    createdBy: 'uid-admin',
    status: 'completed',
    completedAt: null,
    ...overrides,
  }
}

// ── filterByPeriod ─────────────────────────────────────────────────────────────

describe('filterByPeriod', () => {
  const orders = [
    order({ id: 'today',     date: '2026-05-21' }),
    order({ id: 'yesterday', date: '2026-05-20' }),
    order({ id: 'week-ago',  date: '2026-05-15' }),
    order({ id: 'old',       date: '2026-04-01' }),
  ]

  it('"all" возвращает все заказы', () => {
    expect(filterByPeriod(orders, 'all')).toHaveLength(4)
  })

  it('"today" возвращает только сегодняшние', () => {
    const result = filterByPeriod(orders, 'today')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('today')
  })

  it('"week" возвращает последние 7 дней', () => {
    // 2026-05-15 to 2026-05-21 — 7 дней
    const result = filterByPeriod(orders, 'week')
    expect(result.map((o) => o.id).sort()).toEqual(['today', 'week-ago', 'yesterday'].sort())
  })

  it('"month" возвращает последние 30 дней', () => {
    // 2026-04-01 это 50 дней назад — не входит
    const result = filterByPeriod(orders, 'month')
    expect(result.map((o) => o.id).sort()).toEqual(['today', 'week-ago', 'yesterday'].sort())
    expect(result.find((o) => o.id === 'old')).toBeUndefined()
  })

  it('неизвестный период возвращает все заказы', () => {
    expect(filterByPeriod(orders, 'unknown')).toHaveLength(4)
  })

  it('заказ без date не включается в фильтр (кроме all)', () => {
    const noDate = order({ id: 'no-date', date: undefined })
    const result = filterByPeriod([noDate], 'today')
    expect(result).toHaveLength(0)
  })
})

// ── computeRevenue ─────────────────────────────────────────────────────────────

describe('computeRevenue', () => {
  it('суммирует totalAmount только completed заказов', () => {
    const orders = [
      order({ totalAmount: 500, status: 'completed' }),
      order({ totalAmount: 300, status: 'in_progress' }),
      order({ totalAmount: 200, status: 'draft' }),
    ]
    expect(computeRevenue(orders)).toBe(500)
  })

  it('возвращает 0 если нет completed заказов', () => {
    expect(computeRevenue([order({ status: 'draft' })])).toBe(0)
  })

  it('возвращает 0 для пустого массива', () => {
    expect(computeRevenue([])).toBe(0)
  })

  it('обрабатывает totalAmount как строку', () => {
    expect(computeRevenue([order({ totalAmount: '750', status: 'completed' })])).toBe(750)
  })

  it('суммирует несколько completed заказов', () => {
    const orders = [
      order({ totalAmount: 1000, status: 'completed' }),
      order({ totalAmount: 500, status: 'completed' }),
    ]
    expect(computeRevenue(orders)).toBe(1500)
  })
})

// ── computeOrderCount ──────────────────────────────────────────────────────────

describe('computeOrderCount', () => {
  it('возвращает длину массива', () => {
    expect(computeOrderCount([order(), order(), order()])).toBe(3)
  })

  it('возвращает 0 для пустого массива', () => {
    expect(computeOrderCount([])).toBe(0)
  })

  it('считает все статусы', () => {
    const orders = [
      order({ status: 'draft' }),
      order({ status: 'in_progress' }),
      order({ status: 'completed' }),
    ]
    expect(computeOrderCount(orders)).toBe(3)
  })
})

// ── computeAvgTicket ───────────────────────────────────────────────────────────

describe('computeAvgTicket', () => {
  it('вычисляет средний чек по completed', () => {
    const orders = [
      order({ totalAmount: 1000, status: 'completed' }),
      order({ totalAmount: 500, status: 'completed' }),
    ]
    expect(computeAvgTicket(orders)).toBe(750)
  })

  it('возвращает 0 если нет completed', () => {
    expect(computeAvgTicket([order({ status: 'draft' })])).toBe(0)
  })

  it('возвращает 0 для пустого массива', () => {
    expect(computeAvgTicket([])).toBe(0)
  })

  it('игнорирует не-completed при вычислении среднего', () => {
    const orders = [
      order({ totalAmount: 1000, status: 'completed' }),
      order({ totalAmount: 9999, status: 'in_progress' }),
    ]
    expect(computeAvgTicket(orders)).toBe(1000)
  })
})

// ── computeTopServices ─────────────────────────────────────────────────────────

describe('computeTopServices', () => {
  const orders = [
    order({ services: [{ serviceId: 's1', name: 'Замена масла', price: 500 }, { serviceId: 's2', name: 'Диагностика', price: 200 }] }),
    order({ services: [{ serviceId: 's1', name: 'Замена масла', price: 500 }] }),
    order({ services: [{ serviceId: 's3', name: 'Шиномонтаж', price: 600 }] }),
  ]

  it('группирует услуги по имени', () => {
    const result = computeTopServices(orders)
    const oilChange = result.find((s) => s.name === 'Замена масла')
    expect(oilChange).toBeDefined()
    expect(oilChange.count).toBe(2)
    expect(oilChange.revenue).toBe(1000)
  })

  it('сортирует по выручке (больше — выше)', () => {
    const result = computeTopServices(orders)
    expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue)
  })

  it('возвращает не более limit элементов', () => {
    const manyOrders = Array.from({ length: 10 }, (_, i) =>
      order({ services: [{ serviceId: `s${i}`, name: `Услуга ${i}`, price: i * 100 }] }),
    )
    expect(computeTopServices(manyOrders, 3)).toHaveLength(3)
  })

  it('возвращает пустой массив если нет услуг', () => {
    expect(computeTopServices([order({ services: [] })])).toHaveLength(0)
  })

  it('заказ без поля services не вызывает ошибку', () => {
    expect(() => computeTopServices([order({ services: undefined })])).not.toThrow()
  })
})

// ── computeStaffStats ──────────────────────────────────────────────────────────

describe('computeStaffStats', () => {
  const orders = [
    order({ createdBy: 'uid-a', totalAmount: 1000, status: 'completed' }),
    order({ createdBy: 'uid-a', totalAmount: 500, status: 'in_progress' }),
    order({ createdBy: 'uid-b', totalAmount: 700, status: 'completed' }),
  ]

  it('группирует по uid и считает заказы', () => {
    const result = computeStaffStats(orders)
    const userA = result.find((s) => s.uid === 'uid-a')
    expect(userA.count).toBe(2)
  })

  it('считает revenue только по completed', () => {
    const result = computeStaffStats(orders)
    const userA = result.find((s) => s.uid === 'uid-a')
    expect(userA.revenue).toBe(1000)
    const userB = result.find((s) => s.uid === 'uid-b')
    expect(userB.revenue).toBe(700)
  })

  it('сортирует по revenue desc', () => {
    const result = computeStaffStats(orders)
    expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue)
  })

  it('возвращает пустой массив для пустого input', () => {
    expect(computeStaffStats([])).toHaveLength(0)
  })

  it('заказ без createdBy присваивается "unknown"', () => {
    const result = computeStaffStats([order({ createdBy: undefined })])
    expect(result[0].uid).toBe('unknown')
  })
})
