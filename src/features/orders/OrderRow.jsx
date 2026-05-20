import { Link } from 'react-router-dom'
import OrderStatusBadge from './OrderStatusBadge.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const cellStyle = {
  padding: '12px 14px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '14px',
  color: '#1e293b',
  verticalAlign: 'middle',
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
}

/** Словарь меток узлов автомобиля */
const COMPONENT_LABELS = {
  engine: 'Двигатель',
  gearbox: 'КПП',
  suspension: 'Подвеска',
  brakes: 'Тормоза',
  electrics: 'Электрика',
  tires: 'Шины',
  body: 'Кузов',
  other: 'Прочее',
}

/**
 * Строка таблицы заказов.
 *
 * @param {{
 *   order: import('../../services/ordersService.js').OrderDoc,
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   vehicles: import('../../services/vehiclesService.js').VehicleDoc[],
 * }} props
 */
function OrderRow({ order, clients, vehicles }) {
  const client = clients.find((c) => c.id === order.clientId)
  const vehicle = vehicles.find((v) => v.id === order.vehicleId)

  return (
    <tr data-testid={`order-row-${order.id}`}>
      {/* Клиент */}
      <td style={cellStyle}>
        {client ? (
          <span data-testid={`order-client-${order.id}`}>{client.fullName}</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        )}
      </td>

      {/* Автомобиль */}
      <td style={cellStyle}>
        {vehicle ? (
          <span data-testid={`order-vehicle-${order.id}`}>
            {vehicle.make} {vehicle.model}{' '}
            <span style={{ color: '#64748b' }}>({vehicle.licensePlate})</span>
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        )}
      </td>

      {/* Узел */}
      <td style={cellStyle}>
        {COMPONENT_LABELS[order.vehicleComponent] ?? order.vehicleComponent}
      </td>

      {/* Дата */}
      <td style={cellStyle}>{order.date ?? '—'}</td>

      {/* Сумма */}
      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 500 }}>
        {order.totalAmount != null
          ? `${Number(order.totalAmount).toLocaleString('ru-RU')} ₼`
          : '—'}
      </td>

      {/* Статус */}
      <td style={cellStyle}>
        <OrderStatusBadge status={order.status} />
      </td>

      {/* Действия */}
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        <Link
          to={`/dashboard/orders/${order.id}`}
          style={linkStyle}
          data-testid={`order-detail-link-${order.id}`}
        >
          Открыть
        </Link>
      </td>
    </tr>
  )
}

export default OrderRow
