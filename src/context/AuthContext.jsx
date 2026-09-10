import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileRequest = useRef(0)
  const authSyncRequest = useRef(0)

  const loadProfile = useCallback(async (userId) => {
    const requestId = ++profileRequest.current

    if (!userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (requestId !== profileRequest.current) return null
    if (error) {
      console.error('[CAPACITY CONNECT] Unable to load user profile:', error.message)
      setProfile(null)
      return null
    }

    setProfile(data ?? null)
    return data ?? null
  }, [])

  useEffect(() => {
    let mounted = true

    const syncAuth = async (nextSession) => {
      if (!mounted) return

      const syncId = ++authSyncRequest.current
      setLoading(true)
      setSession(nextSession)
      setProfile(null)
      await loadProfile(nextSession?.user?.id)

      if (mounted && syncId === authSyncRequest.current) setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[CAPACITY CONNECT] Unable to restore session:', error.message)
      }
      return syncAuth(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the profile request so it does not run inside Supabase's auth lock.
      setTimeout(() => syncAuth(session), 0)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = () => loadProfile(session?.user?.id)

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
