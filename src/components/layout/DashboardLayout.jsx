import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    background: '#fff',
  },
}

function DashboardLayout() {
  return (
    <div data-testid="dashboard-layout" style={styles.layout}>
      <Header />

      <div style={styles.body}>
        <Sidebar />

        <main data-testid="dashboard-content" style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
