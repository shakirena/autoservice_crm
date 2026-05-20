import { useState, useMemo } from 'react'
import { useAuth } from '../../lib/authContext.jsx'
import { useClients } from '../../hooks/useClients.js'
import ClientTable from '../../features/clients/ClientTable.jsx'
import ClientForm from '../../features/clients/ClientForm.jsx'

// ─── Inline styles ────────────────────────────────────────────────────────────

const pageStyle = {
  maxWidth: '1100px',
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '12px',
}

const searchStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  width: '260px',
  outline: 'none',
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

// ─── Main component ───────────────────────────────────────────────────────────

function ClientsPage() {
  const { role } = useAuth()
  const canWrite = role === 'admin' || role === 'manager'

  const { data: clients = [], isLoading, isError, error, refetch } = useClients()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // ClientDoc | null

  // Локальная фильтрация по ФИО или телефону — без дополнительных запросов к Firestore (ADR-19-01)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        (c.fullName ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q),
    )
  }, [clients, search])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div data-testid="clients-page" style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
          Клиенты
        </h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            data-testid="clients-search"
            type="search"
            placeholder="Поиск по имени или телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchStyle}
          />
          {canWrite && (
            <button
              data-testid="clients-add-button"
              type="button"
              onClick={() => setShowCreate(true)}
              style={addBtnStyle}
            >
              + Добавить клиента
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          data-testid="clients-error"
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
            Не удалось загрузить список клиентов:{' '}
            {error?.message ?? 'Неизвестная ошибка'}
          </p>
          <button
            data-testid="clients-retry"
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

      {/* Table */}
      <ClientTable
        clients={filtered}
        role={role}
        isLoading={isLoading}
        search={search}
        onEdit={setEditTarget}
        onAddFirst={() => setShowCreate(true)}
      />

      {/* Форма создания */}
      {showCreate && (
        <ClientForm onClose={() => setShowCreate(false)} />
      )}

      {/* Форма редактирования */}
      {editTarget && (
        <ClientForm
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}

export default ClientsPage
