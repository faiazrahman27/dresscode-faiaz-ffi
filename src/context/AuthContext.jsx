import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId, email = null) {
    if (!userId) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile select error:', error)
      }

      if (data) {
        setProfile(data)
        return data
      }

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email || null,
          role: 'user',
        })
        .select()
        .single()

      if (insertError) {
        console.error('fetchProfile insert error:', insertError)
        setProfile(null)
        return null
      }

      setProfile(created)
      return created
    } catch (err) {
      console.error('fetchProfile unexpected error:', err)
      setProfile(null)
      return null
    }
  }

  async function refreshProfile() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        setProfile(null)
        return null
      }

      return await fetchProfile(user.id, user.email)
    } catch (err) {
      console.error('refreshProfile error:', err)
      setProfile(null)
      return null
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log('getSession result:', { session, error })

        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('initAuth error:', err)
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange:', event, session)

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      fetchProfile,
      refreshProfile,
      signOut,
    }),
    [user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}