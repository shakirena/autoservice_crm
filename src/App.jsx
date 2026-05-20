import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/authContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div data-testid="app-loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <div data-testid="app-root">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
