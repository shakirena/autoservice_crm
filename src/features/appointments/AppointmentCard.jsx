/**
 * AppointmentCard — Карточка записи клиента.
 *
 * Используется в двух контекстах:
 *   'calendar' — компактный вид в слоте сетки (имя + время + услуга)
 *   'kanban'   — расширенный вид в колонке (имя, дата/время, услуга, механик,
 *                кнопки статуса, привязка клиента)
 *
 * @module AppointmentCard
 */

import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BG,
  NEXT_STATUS,
  NEXT_STATUS_LABEL,
} from './appointmentConstants.js'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   appointment:     import('../../services/appointmentsService.js').AppointmentDoc,
 *   mode:            'calendar' | 'kanban',
 *   onStatusChange?: (id: string, newStatus: string) => void,
 *   onClick?:        (id: string) => void,
 *   onLinkClient?:   (id: string) => void,
 * }} props
 */
function AppointmentCard({ appointment, mode, onStatusChange, onClick, onLinkClient }) {
  const { id, status, clientId, clientName, clientPhone, time, date, duration, serviceType, mechanicId, notes } = appointment

  const color  = STATUS_COLORS[status] ?? '#6b7280'
  const bgColor = STATUS_BG[status] ?? '#f3f4f6'
  const nextStatus = NEXT_STATUS[status]
  const nextLabel  = NEXT_STATUS_LABEL[nextStatus]

  const displayName = clientId === null
    ? `Анон. ${clientPhone}`
    : (clientName || clientPhone)

  if (mode === 'calendar') {
    return (
      <div
        data-testid={`appointment-card-${id}`}
        onClick={() => onClick?.(id)}
        style={{
          background: bgColor,
          borderLeft: `3px solid ${color}`,
          borderRadius: '4px',
          padding: '4px 6px',
          marginBottom: '2px',
          cursor: onClick ? 'pointer' : 'default',
          fontSize: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontWeight: 600, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {time} — {displayName}
        </div>
        <div style={{ color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {serviceType}
        </div>
        <div style={{ fontSize: '11px', color }}>
          {STATUS_LABELS[status] ?? status}
        </div>
      </div>
    )
  }

  // ── Kanban mode ──
  return (
    <div
      data-testid={`appointment-card-${id}`}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
      }}
    >
      {/* Header: имя + кнопка редактирования */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
          {displayName}
        </div>
        {onClick && (
          <button
            data-testid={`appt-card-edit-${id}`}
            type="button"
            onClick={() => onClick(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '12px',
              padding: '0 4px',
            }}
          >
            ✏
          </button>
        )}
      </div>

      {/* Дата + время */}
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
        {date} {time} · {duration} мин
      </div>

      {/* Услуга */}
      <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
        {serviceType}
      </div>

      {/* Механик */}
      {mechanicId && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          Механик: {mechanicId}
        </div>
      )}

      {/* Примечания */}
      {notes && (
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontStyle: 'italic' }}>
          {notes.length > 60 ? notes.slice(0, 60) + '…' : notes}
        </div>
      )}

      {/* Статусные кнопки */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
        {nextStatus && (
          <button
            data-testid={`appt-card-next-${id}`}
            type="button"
            onClick={() => onStatusChange?.(id, nextStatus)}
            style={{
              padding: '4px 10px',
              background: color,
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            → {nextLabel}
          </button>
        )}

        {status !== 'cancelled' && status !== 'done' && (
          <button
            data-testid={`appt-card-cancel-${id}`}
            type="button"
            onClick={() => onStatusChange?.(id, 'cancelled')}
            style={{
              padding: '4px 10px',
              background: '#f3f4f6',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '5px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Отменить
          </button>
        )}

        {clientId === null && (
          <button
            data-testid={`appt-card-link-${id}`}
            type="button"
            onClick={() => onLinkClient?.(id)}
            style={{
              padding: '4px 10px',
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '5px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Привязать клиента
          </button>
        )}
      </div>
    </div>
  )
}

export default AppointmentCard
