import VehicleRow from './VehicleRow.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
}

const thStyle = {
  padding: '10px 16px',
  borderBottom: '2px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#6b7280',
  whiteSpace: 'nowrap',
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  const cellStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
  }
  const barStyle = {
    height: '14px',
    background: '#e5e7eb',
    borderRadius: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }
  return (
    <tr>
      {[100, 120, 60, 110, 160, 160, 80].map((w, i) => (
        <td key={i} style={cellStyle}>
          <div style={{ ...barStyle, width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Таблица автомобилей с поддержкой состояний загрузки и пустого списка.
 * Admin/manager видят кнопку редактирования; остальные — только чтение.
 *
 * @param {{
 *   vehicles: import('../../services/vehiclesService.js').VehicleDoc[],
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   role: string,
 *   isLoading: boolean,
 *   search: string,
 *   onEdit: (vehicle: object) => void,
 *   onAddFirst: () => void,
 * }} props
 */
function VehicleTable({ vehicles, clients, role, isLoading, search, onEdit, onAddFirst }) {
  const canWrite = role === 'admin' || role === 'manager'

  return (
    <div
      data-testid="vehicles-table"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={thStyle}>Марка</th>
            <th style={thStyle}>Модель</th>
            <th style={thStyle}>Год</th>
            <th style={thStyle}>Гос.номер</th>
            <th style={thStyle}>VIN</th>
            <th style={thStyle}>Клиент</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>

        {/* Skeleton tbody при начальной загрузке */}
        {isLoading && (
          <tbody data-testid="vehicles-skeleton">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </tbody>
        )}

        {/* Пустое состояние */}
        {!isLoading && vehicles.length === 0 && (
          <tbody>
            <tr>
              <td
                data-testid="vehicles-empty"
                colSpan={7}
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                {search
                  ? 'Автомобили не найдены. Попробуйте изменить запрос.'
                  : 'Автомобилей пока нет.'}
                {!search && canWrite && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={onAddFirst}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '14px',
                        padding: 0,
                      }}
                    >
                      Добавить первый автомобиль
                    </button>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        )}

        {/* Строки данных */}
        {!isLoading && vehicles.length > 0 && (
          <tbody>
            {vehicles.map((v) => (
              <VehicleRow
                key={v.id}
                vehicle={v}
                role={role}
                clients={clients}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}

export default VehicleTable
