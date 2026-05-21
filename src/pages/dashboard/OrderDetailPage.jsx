import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { useOrder, useUpdateOrderStatus } from '../../hooks/useOrders.js'
import OrderStatusBadge from '../../features/orders/OrderStatusBadge.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '720px',
}

const cardStyle = {
  background: '#fff',
  borderRadius: '10px',
  padding: '24px 28px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  marginBottom: '16px',
}

const sectionTitleStyle = {
  margin: '0 0 14px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#374151',
  paddingBottom: '8px',
  borderBottom: '1px solid #e2e8f0',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px',
  fontSize: '14px',
}

const labelStyle = {
  color: '#64748b',
  fontWeight: 500,
}

const valueStyle = {
  color: '#1e293b',
  textAlign: 'right',
}

const STATUS_TRANSITIONS = {
  draft: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
}

const STATUS_LABELS = {
  in_progress: 'Начать работу',
  completed: 'Завершить',
}

// ─── Main component ───────────────────────────────────────────────────────────

function OrderDetailPage() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const { data: order, isLoading, isError, error } = useOrder(id)
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateOrderStatus()

  async function handleStatusChange(newStatus) {
    if (!user?.uid) return
    try {
      await updateStatus({ id, status: newStatus, uid: user.uid })
    } catch (err) {
      console.error('OrderDetailPage status update error:', err)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div data-testid="order-detail-loading" style={{ color: '#64748b', fontSize: '14px' }}>
        Загрузка заказа...
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div
        data-testid="order-detail-error"
        style={{
          padding: '16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
        }}
      >
        Не удалось загрузить заказ: {error?.message ?? 'Неизвестная ошибка'}
      </div>
    )
  }

  if (!order) return null

  const nextStatuses = STATUS_TRANSITIONS[order.status] ?? []
  const canChangeStatus =
    role === 'admin' || role === 'manager' || role === 'mechanic'

  return (
    <div data-testid="order-detail-page" style={pageStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/orders')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '0 0 8px',
              display: 'block',
            }}
          >
            ← К списку заказов
          </button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
            Заказ {order.date}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <OrderStatusBadge status={order.status} />
          {canChangeStatus &&
            nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                data-testid={`order-status-btn-${nextStatus}`}
                type="button"
                onClick={() => handleStatusChange(nextStatus)}
                disabled={isUpdating}
                style={{
                  padding: '7px 16px',
                  background: nextStatus === 'completed' ? '#16a34a' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                {STATUS_LABELS[nextStatus] ?? nextStatus}
              </button>
            ))}
        </div>
      </div>

      {/* Основная информация */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Основная информация</h2>
        <div style={rowStyle}>
          <span style={labelStyle}>Дата заказа</span>
          <span style={valueStyle}>{order.date}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Клиент ID</span>
          <span style={valueStyle}>{order.clientId}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Автомобиль ID</span>
          <span style={valueStyle}>{order.vehicleId}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Узел</span>
          <span style={valueStyle}>{order.vehicleComponent}</span>
        </div>
      </div>

      {/* Параметры узла */}
      {order.componentParams && Object.keys(order.componentParams).length > 0 && (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Параметры узла</h2>
          {Object.entries(order.componentParams)
            .filter(([, v]) => v !== '' && v != null)
            .map(([key, value]) => (
              <div key={key} style={rowStyle}>
                <span style={labelStyle}>{key}</span>
                <span style={valueStyle}>{String(value)}</span>
              </div>
            ))}
        </div>
      )}

      {/* Услуги */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Услуги</h2>
        {(order.services ?? []).length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Услуги не указаны.
          </p>
        ) : (
          <>
            {order.services.map((s) => (
              <div key={s.serviceId} style={rowStyle}>
                <span style={{ ...labelStyle, color: '#1e293b' }}>{s.name}</span>
                <span style={{ ...valueStyle, fontWeight: 600 }}>
                  {Number(s.price).toLocaleString('ru-RU')} ₼
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: '2px solid #e2e8f0',
                paddingTop: '12px',
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '18px',
                color: '#1e293b',
              }}
            >
              <span>Итого</span>
              <span data-testid="order-detail-total">
                {Number(order.totalAmount ?? 0).toLocaleString('ru-RU')} ₼
              </span>
            </div>
          </>
        )}
      </div>

      {/* Метаданные */}
      <div style={{ ...cardStyle, background: '#f8fafc' }}>
        <h2 style={sectionTitleStyle}>Системная информация</h2>
        <div style={rowStyle}>
          <span style={labelStyle}>ID заказа</span>
          <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px' }}>
            {order.id}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Создан пользователем</span>
          <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px' }}>
            {order.createdBy}
          </span>
        </div>
        {order.completedAt && (
          <div style={rowStyle}>
            <span style={labelStyle}>Завершён</span>
            <span style={valueStyle}>
              {order.completedAt?.toDate?.()?.toLocaleDateString('ru-RU') ?? '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetailPage
