/**
 * Визуальный бейдж роли пользователя.
 *
 * @param {{ role: string, uid: string }} props
 */

const ROLE_LABELS = {
  admin: 'Администратор',
  manager: 'Менеджер',
  mechanic: 'Механик',
  client: 'Клиент',
}

const ROLE_COLORS = {
  admin: { background: '#fee2e2', color: '#991b1b' },
  manager: { background: '#dbeafe', color: '#1e40af' },
  mechanic: { background: '#d1fae5', color: '#065f46' },
  client: { background: '#f3f4f6', color: '#374151' },
}

function RoleBadge({ role, uid }) {
  const style = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    ...(ROLE_COLORS[role] ?? ROLE_COLORS.client),
  }

  return (
    <span
      data-testid={`user-role-badge-${uid}`}
      style={style}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

export default RoleBadge
