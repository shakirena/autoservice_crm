/**
 * Одна строка таблицы клиентов.
 *
 * @param {{
 *   client: import('../../services/clientsService.js').ClientDoc,
 *   role: string,
 *   onEdit: (client: object) => void,
 * }} props
 */

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '14px',
  verticalAlign: 'middle',
}

const btnStyle = {
  padding: '5px 10px',
  borderRadius: '5px',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
}

function formatDate(ts) {
  if (!ts) return '—'
  // Firestore Timestamp имеет метод toDate(), иначе пробуем как число/Date
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function ClientRow({ client, role, onEdit }) {
  const canWrite = role === 'admin' || role === 'manager'

  return (
    <tr data-testid={`client-row-${client.id}`}>
      <td data-testid={`client-cell-name-${client.id}`} style={tdStyle}>
        {client.fullName || '—'}
      </td>
      <td data-testid={`client-cell-phone-${client.id}`} style={tdStyle}>
        {client.phone || '—'}
      </td>
      <td data-testid={`client-cell-email-${client.id}`} style={tdStyle}>
        {client.email || '—'}
      </td>
      <td data-testid={`client-cell-date-${client.id}`} style={tdStyle}>
        {formatDate(client.createdAt)}
      </td>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        {canWrite && (
          <button
            data-testid={`btn-edit-client-${client.id}`}
            type="button"
            onClick={() => onEdit(client)}
            style={{
              ...btnStyle,
              background: '#dbeafe',
              color: '#1e40af',
            }}
          >
            Редактировать
          </button>
        )}
      </td>
    </tr>
  )
}

export default ClientRow
