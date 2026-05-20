import RoleBadge from './RoleBadge.jsx'

/**
 * Одна строка таблицы сотрудников.
 *
 * @param {{
 *   user: import('../../services/usersService.js').UserDoc,
 *   currentUid: string,
 *   onEdit: (user: object) => void,
 *   onToggleBlock: (user: object) => void,
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
  marginRight: '6px',
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

function UserRow({ user, currentUid, onEdit, onToggleBlock }) {
  const isSelf = user.uid === currentUid
  const isBlocked = user.disabled === true

  const rowStyle = {
    background: isBlocked ? '#fef2f2' : 'transparent',
  }

  const selfTitle = isSelf ? 'Нельзя изменить собственную учётную запись' : undefined

  return (
    <tr data-testid={`user-row-${user.uid}`} style={rowStyle}>
      <td data-testid={`user-cell-name-${user.uid}`} style={tdStyle}>
        {user.displayName || '—'}
      </td>
      <td data-testid={`user-cell-email-${user.uid}`} style={tdStyle}>
        {user.email}
      </td>
      <td data-testid={`user-cell-role-${user.uid}`} style={tdStyle}>
        <RoleBadge role={user.role} uid={user.uid} />
      </td>
      <td data-testid={`user-cell-status-${user.uid}`} style={tdStyle}>
        <span
          style={{
            color: isBlocked ? '#dc2626' : '#059669',
            fontWeight: 500,
          }}
        >
          {isBlocked ? 'Заблокирован' : 'Активен'}
        </span>
      </td>
      <td style={tdStyle}>{formatDate(user.createdAt)}</td>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
        <button
          data-testid={`btn-edit-user-${user.uid}`}
          type="button"
          onClick={() => onEdit(user)}
          disabled={isSelf}
          title={selfTitle}
          style={{
            ...btnStyle,
            background: isSelf ? '#e5e7eb' : '#dbeafe',
            color: isSelf ? '#9ca3af' : '#1e40af',
            cursor: isSelf ? 'not-allowed' : 'pointer',
          }}
        >
          Редактировать
        </button>
        <button
          data-testid={`btn-toggle-block-${user.uid}`}
          type="button"
          onClick={() => onToggleBlock(user)}
          disabled={isSelf}
          title={selfTitle}
          style={{
            ...btnStyle,
            background: isSelf ? '#e5e7eb' : isBlocked ? '#d1fae5' : '#fee2e2',
            color: isSelf ? '#9ca3af' : isBlocked ? '#065f46' : '#991b1b',
            cursor: isSelf ? 'not-allowed' : 'pointer',
          }}
        >
          {isBlocked ? 'Разблокировать' : 'Заблокировать'}
        </button>
      </td>
    </tr>
  )
}

export default UserRow
