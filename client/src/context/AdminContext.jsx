import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { api, API_ENDPOINTS } from '../config/api'
import { ROUTES } from '../config/routes'
import { ADMIN_ROLES, ADMIN_PERMISSIONS } from '../config/adminConstants'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setAdmin(null)
        setUser(null)
        return false
      }

      setUser(session.user)

      // Check if user is admin by trying to access admin endpoint
      const response = await api.get(API_ENDPOINTS.ADMIN.DASHBOARD)
      
      if (response.success) {
        // User is admin, fetch admin details
        const adminData = response.data
        setAdmin({
          isAdmin: true,
          role: adminData.admin?.role || ADMIN_ROLES.ADMIN,
          permissions: adminData.admin?.permissions || {},
          ...adminData,
        })
        return true
      }

      setAdmin(null)
      return false
    } catch (err) {
      console.error('Admin check failed:', err)
      setAdmin(null)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Login handler (admin uses same Supabase auth, just checks for admin role)
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (!data.session) {
        throw new Error('Login failed')
      }

      setUser(data.user)

      // Check if user is admin
      const isAdmin = await checkAdminStatus()

      if (!isAdmin) {
        // Not an admin, sign out
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }

      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [checkAdminStatus])

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setAdmin(null)
      setUser(null)
      navigate(ROUTES.ADMIN_LOGIN)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [navigate])

  // Check permissions
  const hasPermission = useCallback((permission) => {
    if (!admin) return false
    if (admin.role === ADMIN_ROLES.SUPER_ADMIN) return true
    return admin.permissions?.[permission] === true
  }, [admin])

  // Check role
  const hasRole = useCallback((roles) => {
    if (!admin) return false
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(admin.role)
  }, [admin])

  // Is super admin
  const isSuperAdmin = useCallback(() => {
    return admin?.role === ADMIN_ROLES.SUPER_ADMIN
  }, [admin])

  // Initialize on mount
  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    checkAdminStatus()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setAdmin(null)
        setUser(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Only re-check if we don't already have admin data
        if (!admin) {
          checkAdminStatus()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, []) // Empty deps - only run once

  const value = {
    admin,
    user,
    loading,
    error,
    login,
    logout,
    checkAdminStatus,
    hasPermission,
    hasRole,
    isSuperAdmin,
    isAuthenticated: !!admin,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

export default AdminContext
