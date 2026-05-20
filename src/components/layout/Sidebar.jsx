import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/authContext.jsx'
import { getNavItems } from '../../config/navigation.js'

const styles = {
  sidebar: {
    width: '220px',
    minHeight: '100%',
    borderRight: '1px solid #e0e0e0',
    background: '#f8f9fa',
    padding: '16px 0',
    flexShrink: 0,
  },
  sidebarEmpty: {
    width: '220px',
    minHeight: '100%',
    borderRight: '1px solid #e0e0e0',
    background: '#f8f9fa',
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
}

/** @param {{ isActive: boolean }} param */
function navLinkStyle({ isActive }) {
  return {
    display: 'block',
    padding: '10px 20px',
    fontSize: '14px',
    textDecoration: 'none',
    borderRadius: '0 4px 4px 0',
    marginRight: '8px',
    color: isActive ? '#1a73e8' : '#444',
    background: isActive ? '#e8f0fe' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    borderLeft: isActive ? '3px solid #1a73e8' : '3px solid transparent',
  }
}

function Sidebar() {
  const { role } = useAuth()
  const navItems = getNavItems(role)

  if (navItems.length === 0) {
    return <aside data-testid="sidebar-empty" style={styles.sidebarEmpty} />
  }

  return (
    <aside data-testid="sidebar" style={styles.sidebar}>
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={item.testId}
            style={navLinkStyle}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
