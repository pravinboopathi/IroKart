import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/lib/types'


interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    isLoading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const fetchingFor = useRef<string | null>(null)

    // Fetch profile via backend service role (bypasses RLS, no 500 errors)
    async function fetchProfile(userId: string) {
        if (fetchingFor.current === userId) return   // already fetching for this user
        fetchingFor.current = userId
        try {
            const res = await fetch(`/api/auth/me?uid=${userId}`)
            if (res.ok) {
                const data = await res.json()
                // Only set if we're still fetching for the same user
                if (fetchingFor.current === userId) {
                    setProfile(data as Profile)
                }
            }
        } catch (err) {
            console.error('fetchProfile error:', err)
        } finally {
            if (fetchingFor.current === userId) {
                fetchingFor.current = null
                setIsLoading(false)
            }
        }
    }

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setIsLoading(false)
            }
        })

        // 2. Listen for auth changes (sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                fetchingFor.current = null
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        fetchingFor.current = null
    }

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
