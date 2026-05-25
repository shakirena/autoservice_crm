import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { getNavItems } from '../../config/navigation.js'

// ─── Цветовая палитра оранжевой темы ─────────────────────────────────────────

const ORANGE = {
  50:  '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  sidebar: {
    width: '230px',
    minHeight: '100%',
    background: '#fff',
    borderLeft: `1px solid ${ORANGE[200]}`,
    padding: '12px 0 24px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  sidebarEmpty: {
    width: '230px',
    minHeight: '100%',
    background: '#fff',
    borderLeft: `1px solid ${ORANGE[200]}`,
    flexShrink: 0,
  },
  divider: {
    height: '1px',
    background: ORANGE[100],
    margin: '8px 16px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '4px 0',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: ORANGE[600],
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    padding: '12px 20px 4px',
  },
}

/** @param {{ isActive: boolean }} param */
function navLinkStyle({ isActive }) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    fontSize: '14px',
    textDecoration: 'none',
    borderRadius: '4px 0 0 4px',     // правый сайдбар: скруглён слева
    marginLeft: '8px',
    color: isActive ? ORANGE[700] : '#4b5563',
    background: isActive ? ORANGE[50] : 'transparent',
    fontWeight: isActive ? 700 : 400,
    borderRight: isActive ? `3px solid ${ORANGE[500]}` : '3px solid transparent',
    transition: 'background 0.12s, color 0.12s',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function Sidebar() {
  const { role } = useAuth()
  const navItems = getNavItems(role)

  if (navItems.length === 0) {
    return <aside data-testid="sidebar-empty" style={styles.sidebarEmpty} />
  }

  return (
    <aside data-testid="sidebar" style={styles.sidebar}>
      {/* Заголовок секции */}
      <p style={styles.sectionLabel}>Навигация</p>

      <div style={styles.divider} />

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={item.testId}
            style={navLinkStyle}
          >
            {/* Иконка пункта меню */}
            <span
              style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Декоративная полоса снизу */}
      <div style={{ flex: 1 }} />
      <div style={{
        margin: '0 16px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: ORANGE[50],
        border: `1px solid ${ORANGE[100]}`,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '22px' }}>🔧</span>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: ORANGE[600], fontWeight: 600 }}>
          MotorService CRM
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#9ca3af' }}>
          v1.0
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
