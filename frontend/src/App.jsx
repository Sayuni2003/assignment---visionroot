import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicRoute from './components/PublicRoute.jsx'
import { HOME_PATHS } from './constants.js'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AdminRequestsPage from './pages/AdminRequestsPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import EditRequestPage from './pages/EditRequestPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyRequestsPage from './pages/MyRequestsPage.jsx'
import NewRequestPage from './pages/NewRequestPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RequestDetailsPage from './pages/RequestDetailsPage.jsx'

// "/" has no page of its own; it sends the logged-in user to their role's home.
function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={HOME_PATHS[user.role]} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/requests/:id" element={<RequestDetailsPage />} />
          </Route>

          <Route element={<ProtectedRoute role="USER" />}>
            <Route path="/requests" element={<MyRequestsPage />} />
            <Route path="/requests/new" element={<NewRequestPage />} />
            <Route path="/requests/:id/edit" element={<EditRequestPage />} />
          </Route>

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin/requests" element={<AdminRequestsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
