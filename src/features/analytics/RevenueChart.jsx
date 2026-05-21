import { useMemo } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Группирует заказы по полю date и суммирует выручку (только completed).
 * Возвращает массив {date, revenue}, отсортированный по date asc.
 *
 * @param {import('../../services/ordersService.js').OrderDoc[]} orders
 * @returns {Array<{date: string, revenue: number}>}
 */
function groupByDay(orders) {
  /** @type {Map<string, number>} */
  const map = new Map()
  for (const order of orders) {
    if (order.status !== 'completed') continue
    const d = order.date ?? ''
    if (!d) continue
    map.set(d, (map.get(d) ?? 0) + (Number(order.totalAmount) || 0))
  }
  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => (a.date > b.date ? 1 : -1))
}

/**
 * Форматирует ISO-дату в «дд.мм» для отображения на оси X.
 *
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {string}
 */
function formatDay(isoDate) {
  if (!isoDate || isoDate.length < 10) return isoDate
  return `${isoDate.slice(8, 10)}.${isoDate.slice(5, 7)}`
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapperStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '20px 24px',
}

const titleStyle = {
  margin: '0 0 20px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#0f172a',
}

const chartAreaStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '6px',
  height: '120px',
  overflowX: 'auto',
  paddingBottom: '4px',
}

const emptyStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  padding: '32px 0',
  textAlign: 'center',
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CSS-only столбчатая диаграмма выручки по дням (ADR-22-02).
 * Высота столбца пропорциональна максимальному значению в серии.
 *
 * @param {{ orders: import('../../services/ordersService.js').OrderDoc[] }} props
 */
function RevenueChart({ orders }) {
  const data = useMemo(() => groupByDay(orders), [orders])

  const maxRevenue = useMemo(
    () => data.reduce((m, d) => Math.max(m, d.revenue), 0),
    [data],
  )

  if (data.length === 0) {
    return (
      <div data-testid="revenue-chart" style={wrapperStyle}>
        <p style={titleStyle}>Выручка по дням</p>
        <p style={emptyStyle}>Нет завершённых заказов за выбранный период</p>
      </div>
    )
  }

  return (
    <div data-testid="revenue-chart" style={wrapperStyle}>
      <p style={titleStyle}>Выручка по дням</p>
      <div style={chartAreaStyle}>
        {data.map(({ date, revenue }) => {
          const heightPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
          return (
            <div
              key={date}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '32px' }}
              title={`${formatDay(date)}: ${revenue.toLocaleString('ru-RU')} ₼`}
            >
              <div
                data-testid="revenue-chart-bar"
                style={{
                  width: '24px',
                  height: `${Math.max(heightPct, 2)}%`,
                  background: '#2563eb',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.2s',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDay(date)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RevenueChart
