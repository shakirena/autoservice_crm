import { useState, useMemo } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics.js'
import KpiCard from '../../features/analytics/KpiCard.jsx'
import PeriodFilter from '../../features/analytics/PeriodFilter.jsx'
import RevenueChart from '../../features/analytics/RevenueChart.jsx'
import TopServicesTable from '../../features/analytics/TopServicesTable.jsx'
import StaffTable from '../../features/analytics/StaffTable.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '1200px',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
}

const kpiRowStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '24px',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '16px',
  marginTop: '24px',
}

const errorStyle = {
  padding: '16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  color: '#991b1b',
  marginBottom: '16px',
  fontSize: '14px',
}

const loadingStyle = {
  padding: '48px 0',
  textAlign: 'center',
  color: '#64748b',
  fontSize: '14px',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Форматирует число как денежную сумму в ₼.
 *
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₼`
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Главная страница аналитики (admin only).
 * KPI-карточки, диаграмма выручки по дням, топ-услуги, статистика сотрудников.
 * Период фильтрации хранится в useState (ADR-22-03).
 */
function AnalyticsPage() {
  const [period, setPeriod] = useState('month')

  const {
    isLoading,
    isError,
    revenue,
    orderCount,
    avgTicket,
    topServices,
    staffStats,
    filtered,
  } = useAnalytics(period)

  // Количество новых клиентов — уникальные clientId в отфильтрованных заказах
  const uniqueClients = useMemo(
    () => new Set(filtered.map((o) => o.clientId).filter(Boolean)).size,
    [filtered],
  )

  if (isLoading) {
    return (
      <div data-testid="analytics-page" style={pageStyle}>
        <p style={loadingStyle}>Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div data-testid="analytics-page" style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700 }}>
            Аналитика
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Отчёты по заказам и выручке
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Error state */}
      {isError && (
        <div data-testid="analytics-error" style={errorStyle}>
          Не удалось загрузить данные. Проверьте подключение и обновите страницу.
        </div>
      )}

      {/* KPI Cards */}
      <div style={kpiRowStyle}>
        <KpiCard
          testId="kpi-revenue"
          title="Выручка"
          value={formatCurrency(revenue)}
          subtitle="завершённые заказы"
        />
        <KpiCard
          testId="kpi-order-count"
          title="Заказов"
          value={String(orderCount)}
          subtitle="все статусы"
        />
        <KpiCard
          testId="kpi-avg-ticket"
          title="Средний чек"
          value={formatCurrency(avgTicket)}
          subtitle="по завершённым"
        />
        <KpiCard
          testId="kpi-clients"
          title="Клиентов"
          value={String(uniqueClients)}
          subtitle="уникальных за период"
        />
      </div>

      {/* Revenue Chart — full width */}
      <RevenueChart orders={filtered} />

      {/* Bottom grid: Top services + Staff */}
      <div style={gridStyle}>
        <TopServicesTable services={topServices} />
        <StaffTable staffStats={staffStats} />
      </div>
    </div>
  )
}

export default AnalyticsPage
