import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, profile, isLoading } = useAuth()

    // Wait for both auth AND profile to resolve
    if (isLoading || (user && requireAdmin && profile === null)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/sign-in" replace />
    }

    if (requireAdmin && profile?.user_type !== 'admin') {
        // User is logged in but not admin — redirect to home
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
