import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { useOrders } from '../../hooks/useOrders.js'
import { useClients } from '../../hooks/useClients.js'
import { useVehicles } from '../../hooks/useVehicles.js'
import OrderList from '../../features/orders/OrderList.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '1200px',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '12px',
}

const filterBarStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
}

const addBtnStyle = {
  padding: '8px 18px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Выполненные' },
]

function FilterTab({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      data-testid={`orders-filter-${value || 'all'}`}
      onClick={() => onClick(value)}
      style={{
        padding: '6px 14px',
        background: active ? '#2563eb' : '#f1f5f9',
        color: active ? '#fff' : '#475569',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function OrdersPage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const canCreate = role === 'admin' || role === 'manager'

  const { data: orders = [], isLoading, isError, error, refetch } = useOrders()
  const { data: clients = [] } = useClients()
  const { data: vehicles = [] } = useVehicles()

  const [statusFilter, setStatusFilter] = useState('')

  // Подсчёт заказов по статусу для отображения в табах
  const counts = useMemo(() => {
    return orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    }, {})
  }, [orders])

  return (
    <div data-testid="orders-page" style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700 }}>
            Заказы
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Всего: {orders.length}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Фильтры по статусу */}
          <div style={filterBarStyle}>
            {STATUS_FILTERS.map(({ value, label }) => (
              <FilterTab
                key={value}
                value={value}
                label={
                  value
                    ? `${label}${counts[value] ? ` (${counts[value]})` : ''}`
                    : label
                }
                active={statusFilter === value}
                onClick={setStatusFilter}
              />
            ))}
          </div>

          {/* Кнопка создания */}
          {canCreate && (
            <button
              data-testid="orders-create-button"
              type="button"
              onClick={() => navigate('/dashboard/orders/new')}
              style={addBtnStyle}
            >
              + Новый заказ
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          data-testid="orders-error"
          style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            Не удалось загрузить заказы: {error?.message ?? 'Неизвестная ошибка'}
          </p>
          <button
            data-testid="orders-retry"
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '6px 14px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* Order table */}
      <OrderList
        orders={orders}
        clients={clients}
        vehicles={vehicles}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onAddFirst={canCreate ? () => navigate('/dashboard/orders/new') : undefined}
      />
    </div>
  )
}

export default OrdersPage
