import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function useUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (uid) => {
    if (!uid) return setProfile(null)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_uid', uid)
      .limit(1)
      .single()

    if (error) {
      console.warn('Failed fetching profile', error)
      setProfile(null)
      return
    }

    setProfile(data)
  }, [])

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(data?.user ?? null)
      await fetchProfile(data?.user?.id)
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      fetchProfile(u?.id)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [fetchProfile])

  const signInWithEmail = async (email) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return {
    user,
    profile,
    loading,
    signInWithEmail,
    signOut,
    refresh: async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
      await fetchProfile(data?.user?.id)
    }
  }
}
