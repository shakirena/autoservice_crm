// Feature #12: DashboardPage is superseded by DashboardLayout + nested routes.
// This file is kept as a redirect shim for any legacy direct references.
// The canonical entry point is /dashboard → DashboardLayout (App.jsx).
import { Navigate } from 'react-router-dom'

function DashboardPage() {
  return <Navigate to="/dashboard" replace />
}

export default DashboardPage
