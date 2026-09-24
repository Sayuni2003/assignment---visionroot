import { Navigate, Outlet } from 'react-router-dom'
import { HOME_PATHS } from '../constants.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loader from './Loader.jsx'

// Only lets logged-in users through. With a role, only that role; anyone else goes to their own home.
function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={HOME_PATHS[user.role]} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
