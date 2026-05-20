import { useState, useMemo } from 'react'
import { useAuth } from '../../lib/authContext.jsx'
import { useVehicles } from '../../hooks/useVehicles.js'
import { useClients } from '../../hooks/useClients.js'
import VehicleTable from '../../features/vehicles/VehicleTable.jsx'
import VehicleForm from '../../features/vehicles/VehicleForm.jsx'

// ─── Inline styles ────────────────────────────────────────────────────────────

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

const searchStyle = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  width: '280px',
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

function VehiclesPage() {
  const { role } = useAuth()
  const canWrite = role === 'admin' || role === 'manager'

  const { data: vehicles = [], isLoading, isError, error, refetch } = useVehicles()
  const { data: clients = [] } = useClients()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // VehicleDoc | null

  // Локальная фильтрация по марке, модели или государственному номеру (ADR-20-03)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(
      (v) =>
        (v.make ?? '').toLowerCase().includes(q) ||
        (v.model ?? '').toLowerCase().includes(q) ||
        (v.licensePlate ?? '').toLowerCase().includes(q),
    )
  }, [vehicles, search])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div data-testid="vehicles-page" style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
          Автомобили
        </h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            data-testid="vehicles-search"
            type="search"
            placeholder="Поиск по марке, модели или номеру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchStyle}
          />
          {canWrite && (
            <button
              data-testid="vehicles-add-button"
              type="button"
              onClick={() => setShowCreate(true)}
              style={addBtnStyle}
            >
              + Добавить автомобиль
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div
          data-testid="vehicles-error"
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
            Не удалось загрузить список автомобилей:{' '}
            {error?.message ?? 'Неизвестная ошибка'}
          </p>
          <button
            data-testid="vehicles-retry"
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
      <VehicleTable
        vehicles={filtered}
        clients={clients}
        role={role}
        isLoading={isLoading}
        search={search}
        onEdit={setEditTarget}
        onAddFirst={() => setShowCreate(true)}
      />

      {/* Форма создания */}
      {showCreate && (
        <VehicleForm onClose={() => setShowCreate(false)} />
      )}

      {/* Форма редактирования */}
      {editTarget && (
        <VehicleForm
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}

export default VehiclesPage
