import { useAuth } from '../../lib/authContext.jsx'

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    borderBottom: '1px solid #e0e0e0',
    background: '#ffffff',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  email: {
    fontSize: '14px',
    color: '#333',
  },
  roleBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px',
    background: '#e8f0fe',
    color: '#1a73e8',
    textTransform: 'capitalize',
  },
  signOutBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    color: '#555',
  },
}

function Header() {
  const { user, role, signOut } = useAuth()

  const displayName = user?.displayName || user?.email || '—'

  return (
    <header data-testid="dashboard-header" style={styles.header}>
      <span style={{ fontWeight: 600, fontSize: '16px', color: '#222' }}>
        AutoService CRM
      </span>

      <div style={styles.userInfo}>
        <span data-testid="header-user-email" style={styles.email}>
          {displayName}
        </span>

        <span data-testid="header-user-role" style={styles.roleBadge}>
          {role ?? 'unknown'}
        </span>

        <button
          data-testid="header-sign-out"
          type="button"
          style={styles.signOutBtn}
          onClick={signOut}
        >
          Выход
        </button>
      </div>
    </header>
  )
}

export default Header
