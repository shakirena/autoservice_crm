import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/authContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import DashboardIndexPage from './pages/dashboard/DashboardIndexPage.jsx'
import UsersPage from './pages/dashboard/UsersPage.jsx'
import OrdersPage from './pages/dashboard/OrdersPage.jsx'
import NewOrderPage from './pages/dashboard/NewOrderPage.jsx'
import OrderDetailPage from './pages/dashboard/OrderDetailPage.jsx'
import ClientsPage from './pages/dashboard/ClientsPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'
import MyOrdersPage from './pages/dashboard/MyOrdersPage.jsx'
import ServicesPage from './pages/dashboard/ServicesPage.jsx'
import VehiclesPage from './pages/dashboard/VehiclesPage.jsx'
import AnalyticsPage from './pages/dashboard/AnalyticsPage.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div data-testid="app-loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleGuard({ allowed, children }) {
  const { role, loading } = useAuth()
  if (loading) return <div data-testid="app-loading">Loading...</div>
  if (!allowed.includes(role)) return <Navigate to="/dashboard" replace />
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
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardIndexPage />} />
          <Route
            path="users"
            element={
              <RoleGuard allowed={['admin']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="orders"
            element={
              <RoleGuard allowed={['admin', 'manager', 'mechanic']}>
                <OrdersPage />
              </RoleGuard>
            }
          />
          <Route
            path="orders/new"
            element={
              <RoleGuard allowed={['admin', 'manager']}>
                <NewOrderPage />
              </RoleGuard>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RoleGuard allowed={['admin', 'manager', 'mechanic']}>
                <OrderDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="clients"
            element={
              <RoleGuard allowed={['admin', 'manager', 'mechanic']}>
                <ClientsPage />
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGuard allowed={['admin']}>
                <SettingsPage />
              </RoleGuard>
            }
          />
          <Route
            path="my-orders"
            element={
              <RoleGuard allowed={['admin', 'mechanic']}>
                <MyOrdersPage />
              </RoleGuard>
            }
          />
          <Route
            path="services"
            element={
              <RoleGuard allowed={['admin', 'manager']}>
                <ServicesPage />
              </RoleGuard>
            }
          />
          <Route
            path="vehicles"
            element={
              <RoleGuard allowed={['admin', 'manager']}>
                <VehiclesPage />
              </RoleGuard>
            }
          />
          <Route
            path="analytics"
            element={
              <RoleGuard allowed={['admin']}>
                <AnalyticsPage />
              </RoleGuard>
            }
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
