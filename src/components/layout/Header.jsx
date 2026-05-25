import { useAuth } from '../../lib/authContext.jsx'

// ─── Иконка: шестерёнка с каплей масла внутри ─────────────────────────────────

function OilGearIcon({ size = 22, color = '#fff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Шестерёнка (gear) */}
      <path
        fill={color}
        d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61
           l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54
           C14.43 3.17 14.24 3 14 3h-4c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94
           l-2.39-.96c-.22-.08-.47 0-.59.22L2.65 9.47c-.12.21-.08.47.12.61l2.03 1.58
           c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32
           c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h4
           c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22
           l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z
           M12 15.6c-1.99 0-3.6-1.61-3.6-3.6s1.61-3.6 3.6-3.6 3.6 1.61 3.6 3.6-1.61 3.6-3.6 3.6z"
      />
      {/* Капля масла внутри */}
      <path
        fill="#f97316"
        d="M12 9.2c0 0-2 2.6-2 3.8a2 2 0 0 0 4 0c0-1.2-2-3.8-2-3.8z"
      />
    </svg>
  )
}

// ─── Иконка автосервиса (гаечный ключ) для шапки ─────────────────────────────

function WrenchIcon({ size = 28, color = '#f97316' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '60px',
    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 60%, #fb923c 100%)',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(234,88,12,0.35)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandText: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#fff',
    fontWeight: 800,
    fontSize: '19px',
    letterSpacing: '0.3px',
    userSelect: 'none',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  displayName: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 500,
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.35)',
    textTransform: 'capitalize',
    letterSpacing: '0.3px',
  },
  signOutBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.15)',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 500,
    transition: 'background 0.15s',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

function Header() {
  const { user, role, signOut } = useAuth()

  const displayName = user?.displayName || user?.email || '—'

  return (
    <header data-testid="dashboard-header" style={styles.header}>
      {/* Логотип */}
      <div style={styles.brand}>
        <WrenchIcon size={26} color="#fff" />
        <span style={styles.brandText}>
          Motor
          <OilGearIcon size={20} color="#fff" />
          Service
        </span>
      </div>

      {/* Пользователь */}
      <div style={styles.userInfo}>
        <span data-testid="header-user-email" style={styles.displayName}>
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
