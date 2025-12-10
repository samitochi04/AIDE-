import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return null
      }

      setProfile(data)
      return data
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setProfile(null)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return
        
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Sign in with magic link
  const signInWithMagicLink = async (email) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    return { error }
  }

  // Sign in with password
  const signInWithPassword = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    return { data, error }
  }

  // Sign up with password
  const signUp = async (email, password, metadata = {}) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    return { data, error }
  }

  // Sign in with OAuth (Google, etc.)
  const signInWithOAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  // Sign out
  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    setLoading(false)
    return { error }
  }

  // Reset password
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    return { error }
  }

  // Update password
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error }
  }

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('Not authenticated') }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }

    return { data, error }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
