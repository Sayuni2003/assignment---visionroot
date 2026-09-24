import { Navigate, Outlet } from 'react-router-dom'
import { HOME_PATHS } from '../constants.js'
import { useAuth } from '../context/AuthContext.jsx'
import Loader from './Loader.jsx'

// Pages such as /login are only for visitors; a logged-in user is sent to their home page.
function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (user) {
    return <Navigate to={HOME_PATHS[user.role]} replace />
  }

  return <Outlet />
}

export default PublicRoute
