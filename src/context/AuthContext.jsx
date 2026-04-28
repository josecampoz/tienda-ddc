import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_TOKEN_KEY, api } from '../lib/apiClient'

const AuthContext = createContext(null)

const ROLE_META = {
  super_admin: {
    label: 'Super Admin',
    permissions: ['dashboard', 'analytics', 'products', 'orders', 'users', 'security', 'customers', 'campaigns', 'reports', 'settings'],
  },
  operations_manager: {
    label: 'Operations Manager',
    permissions: ['dashboard', 'analytics', 'orders', 'products', 'customers', 'reports'],
  },
  catalog_manager: {
    label: 'Catalog Manager',
    permissions: ['dashboard', 'products', 'campaigns'],
  },
  analyst: {
    label: 'Data Analyst',
    permissions: ['dashboard', 'analytics', 'reports'],
  },
  support: {
    label: 'Customer Support',
    permissions: ['dashboard', 'orders', 'customers'],
  },
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([])
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || null)
  const [currentUser, setCurrentUser] = useState(null)
  const [roleMeta, setRoleMeta] = useState(ROLE_META)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!token) {
        setCurrentUser(null)
        setUsers([])
        setIsAuthLoading(false)
        return
      }

      try {
        const me = await api.me(token)
        if (cancelled) return

        setCurrentUser(me.user)
        setRoleMeta(me.roleMeta || ROLE_META)

        try {
          const usersResponse = await api.listUsers(token)
          if (!cancelled) setUsers(usersResponse.users || [])
        } catch {
          if (!cancelled) setUsers([])
        }
      } catch {
        if (cancelled) return
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setToken(null)
        setCurrentUser(null)
        setUsers([])
      } finally {
        if (!cancelled) setIsAuthLoading(false)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [token])

  const login = async ({ email, password }) => {
    try {
      const response = await api.login({ email, password })
      localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      setToken(response.token)
      setCurrentUser(response.user)
      setRoleMeta(response.roleMeta || ROLE_META)
      setAuthError('')

      try {
        const usersResponse = await api.listUsers(response.token)
        setUsers(usersResponse.users || [])
      } catch {
        setUsers([])
      }

      return true
    } catch (error) {
      let errorMessage = error.message || 'No fue posible iniciar sesion'
      
      // Mejorar mensaje de error de red
      if (error.isNetworkError) {
        errorMessage = 'Backend no disponible. Asegúrate de que el servidor está corriendo en http://localhost:4000. Para desarrollo, ejecuta: cd server && npm run dev'
      }
      
      setAuthError(errorMessage)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setToken(null)
    setCurrentUser(null)
    setUsers([])
  }

  const createUser = async ({ fullName, email, role, department, password }) => {
    if (!token) return { ok: false, message: 'No autorizado' }

    try {
      const response = await api.createUser(token, { fullName, email, role, department, password })
      setUsers((prev) => [response.user, ...prev])
      return { ok: true, user: response.user }
    } catch (error) {
      return { ok: false, message: error.message || 'No fue posible crear el usuario' }
    }
  }

  const updateUser = async (id, patch) => {
    if (!token || typeof patch.active !== 'boolean') return
    const response = await api.setUserStatus(token, id, patch.active)
    setUsers((prev) => prev.map((u) => (u.id === id ? response.user : u)))
  }

  const hasPermission = (permission) => {
    if (!currentUser) return false
    const role = roleMeta[currentUser.role]
    return role?.permissions.includes(permission) || false
  }

  const value = {
    users,
    currentUser,
    token,
    isAuthLoading,
    authError,
    roleMeta,
    login,
    logout,
    createUser,
    updateUser,
    hasPermission,
    clearAuthError: () => setAuthError(''),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
