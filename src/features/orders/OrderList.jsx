import OrderRow from './OrderRow.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  background: '#fff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const thStyle = {
  padding: '11px 14px',
  background: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
}

const thRightStyle = { ...thStyle, textAlign: 'right' }
const thCenterStyle = { ...thStyle, textAlign: 'center' }

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td
          key={i}
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div
            style={{
              height: '14px',
              background: '#e2e8f0',
              borderRadius: '4px',
              width: i === 6 ? '60px' : '80%',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  )
}

/**
 * Таблица заказов.
 *
 * @param {{
 *   orders: import('../../services/ordersService.js').OrderDoc[],
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   vehicles: import('../../services/vehiclesService.js').VehicleDoc[],
 *   isLoading: boolean,
 *   statusFilter: string,
 *   onAddFirst?: () => void,
 * }} props
 */
function OrderList({ orders, clients, vehicles, isLoading, statusFilter, onAddFirst }) {
  // Фильтрация по статусу (клиент-сайд, ADR-21-04)
  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders

  return (
    <div data-testid="orders-table-wrapper" style={{ overflowX: 'auto' }}>
      <table data-testid="orders-table" style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Клиент</th>
            <th style={thStyle}>Автомобиль</th>
            <th style={thStyle}>Узел</th>
            <th style={thStyle}>Дата</th>
            <th style={thRightStyle}>Сумма</th>
            <th style={thStyle}>Статус</th>
            <th style={thCenterStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!isLoading && filtered.length === 0 && (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                }}
              >
                {statusFilter
                  ? 'Заказов с таким статусом нет.'
                  : (
                    <>
                      Заказов пока нет.{' '}
                      {onAddFirst && (
                        <button
                          type="button"
                          onClick={onAddFirst}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            fontSize: 'inherit',
                            padding: 0,
                          }}
                        >
                          Создать первый заказ
                        </button>
                      )}
                    </>
                  )}
              </td>
            </tr>
          )}

          {!isLoading &&
            filtered.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                clients={clients}
                vehicles={vehicles}
              />
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrderList
