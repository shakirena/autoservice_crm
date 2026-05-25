import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f9fafb',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: '28px 32px',
    overflowY: 'auto',
    background: '#f9fafb',
    // Минимальная ширина чтобы таблицы не схлопывались
    minWidth: 0,
  },
}

function DashboardLayout() {
  return (
    <div data-testid="dashboard-layout" style={styles.layout}>
      <Header />

      <div style={styles.body}>
        {/* Контент слева, сайдбар справа */}
        <main data-testid="dashboard-content" style={styles.content}>
          <Outlet />
        </main>

        <Sidebar />
      </div>
    </div>
  )
}

export default DashboardLayout
