import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUp() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            // Use backend to create user without email verification
            const res = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create account.')

            // Now sign in directly
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (signInError) throw signInError

            navigate('/')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Iro</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">Iro<span className="text-red-500">Kart</span></span>
                    </Link>
                    <h1 className="mt-6 text-2xl font-bold text-neutral-900">Create account</h1>
                    <p className="mt-1 text-sm text-neutral-500">Join IroKart today</p>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8">
                    {error && (
                        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1.5">Full name</label>
                            <input
                                id="fullName" type="text" required
                                value={fullName} onChange={e => setFullName(e.target.value)}
                                placeholder="Ravi Kumar"
                                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none transition-all placeholder:text-neutral-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                            <input
                                id="email" type="email" required autoComplete="email"
                                value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none transition-all placeholder:text-neutral-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'}
                                    required minLength={6}
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="w-full px-3.5 py-2.5 pr-10 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none transition-all placeholder:text-neutral-400"
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full bg-neutral-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-black transition-colors disabled:opacity-60 mt-1">
                            {isLoading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-sm text-neutral-500">
                    Already have an account?{' '}
                    <Link to="/sign-in" className="font-semibold text-neutral-900 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
