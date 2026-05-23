/**
 * OrderTable — таблица заказов.
 *
 * Колонки: № | Клиент | Автомобиль | Статус | Сумма | Дата | Действия
 * Поддерживает: striped rows, hover-эффект, sticky header, skeleton, empty/error state.
 *
 * Feature #57 — Story #60
 *
 * @param {{
 *   orders: import('../../services/ordersService.js').OrderDoc[],
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   vehicles: import('../../services/vehiclesService.js').VehicleDoc[],
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: Error|null,
 *   statusFilter: string,
 *   onAddFirst?: () => void,
 * }} props
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  tableWrapStyle,
  tableStyle,
  theadStyle,
  thStyle,
  tdStyle,
  rowStyle,
  SkeletonRow,
  EmptyRow,
  ErrorRow,
} from '../../components/ui/DataTable.jsx'

// ─── Column count ─────────────────────────────────────────────────────────────

const COLS = 7

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:       { label: 'Черновик',  bg: '#f3f4f6', color: '#374151' },
  in_progress: { label: 'В работе',  bg: '#dbeafe', color: '#1d4ed8' },
  completed:   { label: 'Выполнен',  bg: '#d1fae5', color: '#065f46' },
  cancelled:   { label: 'Отменён',   bg: '#fee2e2', color: '#b91c1c' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderTableRow({ order, index, clients, vehicles }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  const client = clients.find((c) => c.id === order.clientId)
  const vehicle = vehicles.find((v) => v.id === order.vehicleId)

  const clientName = client?.fullName ?? order.clientId ?? '—'
  const vehicleInfo = vehicle
    ? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || '—'
    : order.vehicleId ?? '—'

  const total =
    order.totalAmount != null
      ? `${Number(order.totalAmount).toLocaleString('ru-RU')} ₼`
      : '—'

  const dateStr = order.createdAt
    ? new Date(
        order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt,
      ).toLocaleDateString('ru-RU')
    : order.date ?? '—'

  const base = rowStyle(index)
  const rowBg = hovered ? '#eff6ff' : base.background

  return (
    <tr
      data-testid={`order-table-row-${order.id}`}
      style={{ ...base, background: rowBg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* № */}
      <td style={{ ...tdStyle, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
        {index + 1}
      </td>

      {/* Клиент */}
      <td style={tdStyle}>{clientName}</td>

      {/* Автомобиль */}
      <td style={tdStyle}>{vehicleInfo}</td>

      {/* Статус */}
      <td data-testid={`order-table-status-${order.id}`} style={tdStyle}>
        <StatusBadge status={order.status} />
      </td>

      {/* Сумма */}
      <td
        data-testid={`order-table-total-${order.id}`}
        style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
      >
        {total}
      </td>

      {/* Дата */}
      <td style={tdStyle}>{dateStr}</td>

      {/* Действия */}
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        <button
          type="button"
          data-testid={`order-table-open-${order.id}`}
          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
          style={{
            padding: '4px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            background: '#dbeafe',
            color: '#1e40af',
          }}
        >
          Открыть
        </button>
      </td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function OrderTable({
  orders = [],
  clients = [],
  vehicles = [],
  isLoading,
  isError,
  error,
  statusFilter,
  onAddFirst,
}) {
  // Фильтрация по статусу (клиент-сайд)
  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders

  return (
    <div style={tableWrapStyle}>
      <table data-testid="order-table" style={tableStyle}>
        <thead style={theadStyle}>
          <tr>
            <th style={{ ...thStyle, width: '48px' }}>№</th>
            <th style={thStyle}>Клиент</th>
            <th style={thStyle}>Автомобиль</th>
            <th style={thStyle}>Статус</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Сумма</th>
            <th style={thStyle}>Дата</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <>
              <SkeletonRow cols={COLS} />
              <SkeletonRow cols={COLS} />
              <SkeletonRow cols={COLS} />
            </>
          )}

          {!isLoading && isError && (
            <ErrorRow
              cols={COLS}
              message={`Ошибка загрузки заказов: ${error?.message ?? 'Неизвестная ошибка'}`}
            />
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyRow
              cols={COLS}
              message={
                statusFilter
                  ? 'Заказов с таким статусом нет.'
                  : onAddFirst
                    ? (
                      <span>
                        Заказов пока нет.{' '}
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
                      </span>
                    )
                    : 'Заказов пока нет.'
              }
            />
          )}

          {!isLoading &&
            !isError &&
            filtered.map((order, i) => (
              <OrderTableRow
                key={order.id}
                order={order}
                index={i}
                clients={clients}
                vehicles={vehicles}
              />
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrderTable
