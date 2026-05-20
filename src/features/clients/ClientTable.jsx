import ClientRow from './ClientRow.jsx'

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
      {[160, 120, 180, 80, 90].map((w, i) => (
        <td key={i} style={cellStyle}>
          <div style={{ ...barStyle, width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * Таблица клиентов с поддержкой состояний загрузки и пустого списка.
 * Admin/manager видят кнопку редактирования; mechanic — только чтение.
 *
 * @param {{
 *   clients: import('../../services/clientsService.js').ClientDoc[],
 *   role: string,
 *   isLoading: boolean,
 *   search: string,
 *   onEdit: (client: object) => void,
 *   onAddFirst: () => void,
 * }} props
 */
function ClientTable({ clients, role, isLoading, search, onEdit, onAddFirst }) {
  const canWrite = role === 'admin' || role === 'manager'

  return (
    <div
      data-testid="clients-table"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={thStyle}>ФИО</th>
            <th style={thStyle}>Телефон</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Добавлен</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>

        {/* Skeleton tbody при начальной загрузке */}
        {isLoading && (
          <tbody data-testid="clients-skeleton">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </tbody>
        )}

        {/* Пустое состояние */}
        {!isLoading && clients.length === 0 && (
          <tbody>
            <tr>
              <td
                data-testid="clients-empty"
                colSpan={5}
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                {search
                  ? 'Клиенты не найдены. Попробуйте изменить запрос.'
                  : 'Клиентов пока нет.'}
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
                      Добавить первого клиента
                    </button>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        )}

        {/* Строки данных */}
        {!isLoading && clients.length > 0 && (
          <tbody>
            {clients.map((c) => (
              <ClientRow key={c.id} client={c} role={role} onEdit={onEdit} />
            ))}
          </tbody>
        )}
      </table>
    </div>
  )
}

export default ClientTable
