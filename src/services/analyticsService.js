/**
 * analyticsService.js — чистые функции аналитики.
 *
 * Нет импортов Firebase — только операции над массивом заказов.
 * Все вычисления клиент-сайд (ADR-22-01).
 *
 * @module analyticsService
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Возвращает строку ISO YYYY-MM-DD для заданной даты.
 *
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

// ── Period filter ──────────────────────────────────────────────────────────────

/**
 * Фильтрует заказы по периоду.
 * Сравнение ведётся по полю `date` (строка ISO YYYY-MM-DD).
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @param {'today'|'week'|'month'|'all'} period
 * @returns {import('./ordersService.js').OrderDoc[]}
 */
export function filterByPeriod(orders, period) {
  if (period === 'all') return orders

  const now = new Date()
  let from

  if (period === 'today') {
    from = toISODate(now)
  } else if (period === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6) // последние 7 дней включая сегодня
    from = toISODate(d)
  } else if (period === 'month') {
    const d = new Date(now)
    d.setDate(d.getDate() - 29) // последние 30 дней включая сегодня
    from = toISODate(d)
  } else {
    return orders
  }

  const today = toISODate(now)
  return orders.filter((o) => {
    const d = o.date ?? ''
    return d >= from && d <= today
  })
}

// ── Core metrics ───────────────────────────────────────────────────────────────

/**
 * Суммирует выручку по завершённым заказам.
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @returns {number}
 */
export function computeRevenue(orders) {
  return orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
}

/**
 * Возвращает количество заказов в массиве (любой статус).
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @returns {number}
 */
export function computeOrderCount(orders) {
  return orders.length
}

/**
 * Средний чек по завершённым заказам. Возвращает 0, если нет завершённых.
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @returns {number}
 */
export function computeAvgTicket(orders) {
  const completed = orders.filter((o) => o.status === 'completed')
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  return total / completed.length
}

// ── Top services ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ServiceStat
 * @property {string} name
 * @property {number} count
 * @property {number} revenue
 */

/**
 * Топ услуг по выручке (из завершённых заказов).
 * Группировка по `services[*].name`.
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @param {number} [limit=5]
 * @returns {ServiceStat[]}
 */
export function computeTopServices(orders, limit = 5) {
  /** @type {Map<string, ServiceStat>} */
  const map = new Map()

  for (const order of orders) {
    if (!Array.isArray(order.services)) continue
    for (const svc of order.services) {
      const name = svc.name ?? 'Без названия'
      const price = Number(svc.price) || 0
      const existing = map.get(name)
      if (existing) {
        existing.count += 1
        existing.revenue += price
      } else {
        map.set(name, { name, count: 1, revenue: price })
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// ── Staff stats ────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} StaffStat
 * @property {string} uid
 * @property {number} count      — все заказы (любой статус)
 * @property {number} revenue    — сумма totalAmount завершённых заказов
 */

/**
 * Статистика сотрудников, сгруппированная по `createdBy`.
 * Resolve uid → displayName выполняется в компоненте через useUsers().
 *
 * @param {import('./ordersService.js').OrderDoc[]} orders
 * @returns {StaffStat[]}
 */
export function computeStaffStats(orders) {
  /** @type {Map<string, StaffStat>} */
  const map = new Map()

  for (const order of orders) {
    const uid = order.createdBy ?? 'unknown'
    const existing = map.get(uid)
    const revenue = order.status === 'completed' ? (Number(order.totalAmount) || 0) : 0

    if (existing) {
      existing.count += 1
      existing.revenue += revenue
    } else {
      map.set(uid, { uid, count: 1, revenue })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}
