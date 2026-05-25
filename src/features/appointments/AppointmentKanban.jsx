/**
 * AppointmentKanban — Канбан-доска записей по статусам.
 *
 * 5 колонок: Ожидает / Подтверждено / В работе / Завершено / Отменено.
 *
 * @module AppointmentKanban
 */

import { useState } from 'react'
import AppointmentCard from './AppointmentCard.jsx'
import { STATUS_COLORS, STATUS_BG } from './appointmentConstants.js'
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'
import { useClients } from '../../hooks/useClients.js'
import { useLinkClient } from '../../hooks/useAppointments.js'

// ─── Колонки ──────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { status: 'waiting',     label: 'Ожидает'        },
  { status: 'confirmed',   label: 'Подтверждено'   },
  { status: 'in_progress', label: 'В работе'       },
  { status: 'done',        label: 'Завершено'       },
  { status: 'cancelled',   label: 'Отменено'       },
]

// ─── LinkClientModal ──────────────────────────────────────────────────────────

function LinkClientModal({ appointmentId, onClose }) {
  const { data: clients = [], isLoading } = useClients()
  const { mutateAsync: linkClient, isPending } = useLinkClient()
  const [selectedId, setSelectedId] = useState('')

  const options = clients.map((c) => ({
    value: c.id,
    label: c.fullName,
    sublabel: c.phone,
  }))

  async function handleLink() {
    if (!selectedId) return
    const client = clients.find((c) => c.id === selectedId)
    if (!client) return
    await linkClient({
      id: appointmentId,
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
    })
    onClose()
  }

  return (
    <div
      data-testid="link-client-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        data-testid="link-client-modal"
        style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '24px 28px',
          width: '380px',
          maxWidth: '95vw',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>
          Привязать клиента
        </h3>

        <SearchableSelect
          testId="link-client-select"
          options={options}
          value={selectedId}
          onChange={setSelectedId}
          placeholder="— Начните вводить имя или телефон —"
          loading={isLoading}
        />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            data-testid="link-client-cancel"
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Отмена
          </button>
          <button
            data-testid="link-client-confirm"
            type="button"
            onClick={handleLink}
            disabled={!selectedId || isPending}
            style={{
              padding: '7px 16px',
              background: selectedId ? '#2563eb' : '#93c5fd',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {isPending ? 'Привязка...' : 'Привязать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({ column, items, onStatusChange, onCardClick, onLinkClient, onAddClick }) {
  const color  = STATUS_COLORS[column.status] ?? '#6b7280'
  const bgColor = STATUS_BG[column.status] ?? '#f3f4f6'

  return (
    <div
      data-testid={`kanban-column-${column.status}`}
      style={{
        flex: '1 0 200px',
        minWidth: '200px',
        maxWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          background: bgColor,
          borderBottom: '2px solid ' + color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '13px', color }}>
          {column.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            data-testid={`kanban-count-${column.status}`}
            style={{
              background: color,
              color: '#fff',
              borderRadius: '10px',
              padding: '1px 7px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {items.length}
          </span>
          <button
            data-testid={`kanban-add-${column.status}`}
            type="button"
            onClick={() => onAddClick?.(column.status)}
            style={{
              width: '22px',
              height: '22px',
              background: color,
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '22px',
              textAlign: 'center',
              padding: 0,
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: '8px',
          overflowY: 'auto',
          flex: 1,
          maxHeight: '70vh',
        }}
      >
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '16px' }}>
            Нет записей
          </div>
        )}
        {items.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            mode="kanban"
            onStatusChange={onStatusChange}
            onClick={onCardClick}
            onLinkClient={onLinkClient}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   appointments:   import('../../services/appointmentsService.js').AppointmentDoc[],
 *   onStatusChange: (id: string, newStatus: string) => void,
 *   onCardClick:    (appointmentId: string) => void,
 *   onAddClick?:    (status: string) => void,
 * }} props
 */
function AppointmentKanban({ appointments = [], onStatusChange, onCardClick, onAddClick }) {
  const [linkingId, setLinkingId] = useState(null)

  return (
    <div
      data-testid="appointment-kanban"
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        alignItems: 'flex-start',
      }}
    >
      {KANBAN_COLUMNS.map((col) => {
        const items = appointments.filter((a) => a.status === col.status)
        return (
          <KanbanColumn
            key={col.status}
            column={col}
            items={items}
            onStatusChange={onStatusChange}
            onCardClick={onCardClick}
            onLinkClient={(id) => setLinkingId(id)}
            onAddClick={onAddClick}
          />
        )
      })}

      {linkingId && (
        <LinkClientModal
          appointmentId={linkingId}
          onClose={() => setLinkingId(null)}
        />
      )}
    </div>
  )
}

export default AppointmentKanban
