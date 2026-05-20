import { useAuth } from '../lib/authContext.jsx'

function DashboardPage() {
  const { user, role, loading, signOut } = useAuth()

  if (loading) {
    return <div data-testid="dashboard-loading">Loading...</div>
  }

  return (
    <main data-testid="dashboard-page">
      <header data-testid="dashboard-header">
        <h1 data-testid="dashboard-title">Dashboard</h1>
        <div data-testid="dashboard-user-info">
          <span data-testid="dashboard-user-email">{user?.email}</span>
          <span data-testid="dashboard-user-role">{role}</span>
          <button data-testid="dashboard-sign-out" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <section data-testid="dashboard-content">
        <p data-testid="dashboard-placeholder">
          Welcome, {role}. Feature panels coming soon.
        </p>
      </section>
    </main>
  )
}

export default DashboardPage
