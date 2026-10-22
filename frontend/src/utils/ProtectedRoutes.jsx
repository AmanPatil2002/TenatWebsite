import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRoute({ role }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')

  if (!token) return <Navigate to="/" replace />
  if (role && !(Array.isArray(role) ? role : [role]).includes(userRole)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute