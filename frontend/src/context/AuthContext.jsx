import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth.api.js'
import { setSessionExpiredHandler } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // The tokens are HttpOnly cookies we cannot read, so ask the backend who is logged in.
  useEffect(() => {
    authApi
      .getMe()
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Expired sessions: when a refresh fails, client.js calls this and we forget the user.
  // ProtectedRoute then sees no user and redirects to /login, so pages never handle 401s themselves.
  useEffect(() => {
    setSessionExpiredHandler(clearUser)
    return () => setSessionExpiredHandler(null)
  }, [])

  async function login(email, password) {
    await authApi.login({ email, password })
    const response = await authApi.getMe()
    setUser(response.data.user)
    return response.data.user
  }

  // Registering does not log the user in.
  function register(data) {
    return authApi.register(data)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Log out locally even if the server could not be reached.
    }
    setUser(null)
  }

  function clearUser() {
    setUser(null)
  }

  const value = { user, loading, login, register, logout, clearUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
