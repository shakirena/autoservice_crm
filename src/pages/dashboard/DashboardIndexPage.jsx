import { useAuth } from '../../lib/authContext.jsx'

function DashboardIndexPage() {
  const { role } = useAuth()

  return (
    <div data-testid="page-dashboard-index">
      <h1 style={{ marginTop: 0 }}>Добро пожаловать</h1>
      <p>
        Вы вошли как <strong>{role ?? 'unknown'}</strong>. Выберите раздел в боковом меню.
      </p>
    </div>
  )
}

export default DashboardIndexPage
