import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [csrfToken, setCsrfToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // hydrate user by asking the backend (cookie-based auth)
    async function hydrate() {
      try {
        const res = await api.get('/auth/me')
        setUser(res.user || null)
        // fetch server-side csrf token
        try {
          const c = await api.get('/auth/csrf')
          if (c && c.csrfToken) {
            setCsrfToken(c.csrfToken)
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    hydrate()
  }, [])

  async function login(username, password) {
    // with server-side CSRF the server returns user and csrfToken in the login response
    const data = await api.post('/auth/login', { username, password })
    if (!data || !data.user) throw new Error('Invalid login response')
    const u = data.user
    setUser(u)
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken)
    }
    return data
  }

  function logout() {
    // call backend to clear cookie and remove client-side user
    try { api.post('/auth/logout') } catch (e) { /* ignore */ }
    setCsrfToken(null)
    setUser(null)
  }

  const value = { user, csrfToken, loading, login, logout, isAuthenticated: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export default AuthContext
