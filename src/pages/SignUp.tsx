import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff, Package, Star, Rocket, Globe } from 'lucide-react'

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
        <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden font-sans">
            {/* Left Side: Brand Visuals */}
            <div className="hidden lg:flex lg:w-[45%] bg-[#f8fafc] flex-col justify-center p-20 relative overflow-hidden border-r border-gray-100">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-50/40 rounded-full -mr-64 -mt-64 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full -ml-32 -mb-32 blur-[80px]"></div>

                <div className="absolute top-12 left-12 z-20">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="bg-[#E31E24] p-2.5 rounded-xl shadow-lg shadow-red-500/20 transform group-hover:-rotate-6 transition-all duration-300">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-3xl font-[1000] tracking-tighter text-gray-900">
                            Iro<span className="text-[#E31E24]">Kart</span>
                        </span>
                    </Link>
                </div>

                <div className="relative z-10 mt-20">
                    <h2 className="text-[64px] font-[1000] text-gray-900 tracking-tighter leading-[1] mb-8">
                        The Global <br />
                        IT <span className="text-[#E31E24]">Marketplace.</span>
                    </h2>
                    <p className="text-xl text-gray-500 font-semibold max-w-sm leading-relaxed mb-12">
                        Get instant access to wholesale pricing, genuine licenses, and performance hardware. One platform for all your tech needs.
                    </p>

                    <div className="grid grid-cols-2 gap-10">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Rocket className="w-5 h-5 text-[#E31E24]" />
                                <p className="text-4xl font-[1000] text-gray-900">1-Min</p>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Account Setup</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-[#E31E24]" />
                                <p className="text-4xl font-[1000] text-gray-900">Global</p>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Distribution Network</p>
                        </div>
                    </div>

                    <div className="mt-16 flex items-center gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-sm">
                        <div className="flex -space-x-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?u=signUp${i}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Voted #1 IT Platform of 2026</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 left-12 z-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
                    JOIN THE PREMIUM ECOSYSTEM
                </div>
            </div>

            {/* Right Side: Sign Up Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 bg-white relative">
                {/* Mobile Logo Visibility */}
                <div className="lg:hidden absolute top-8 left-8">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-[#E31E24] p-1.5 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-[1000] tracking-tighter">Iro<span className="text-[#E31E24]">Kart</span></span>
                    </Link>
                </div>

                <div className="w-full max-w-[440px]">
                    <div className="mb-12">
                        <h1 className="text-[42px] font-[1000] text-gray-900 tracking-tighter leading-none mb-4">
                            New <span className="text-[#E31E24]">Account</span>
                        </h1>
                        <p className="text-gray-500 font-semibold tracking-tight text-lg">
                            Register now to unlock wholesale advantages
                        </p>
                    </div>

                    <div className="space-y-8">
                        {error && (
                            <div className="text-[11px] font-black uppercase tracking-widest text-[#E31E24] bg-red-50/50 border border-red-100 rounded-2xl px-6 py-4 text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="fullName" className="block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                                    Full Professional Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Ravi Kumar"
                                    className="w-full px-6 py-5 text-base border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:bg-white focus:border-[#E31E24] focus:ring-8 focus:ring-red-500/5 focus:outline-none transition-all placeholder:text-gray-300 font-bold"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                                    Business Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full px-6 py-5 text-base border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:bg-white focus:border-[#E31E24] focus:ring-8 focus:ring-red-500/5 focus:outline-none transition-all placeholder:text-gray-300 font-bold"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                                    Create Secure Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Min. 6 alphanumeric characters"
                                        className="w-full px-6 py-5 pr-14 text-base border-2 border-gray-50 rounded-2xl bg-gray-50/50 focus:bg-white focus:border-[#E31E24] focus:ring-8 focus:ring-red-500/5 focus:outline-none transition-all placeholder:text-gray-300 font-bold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#E31E24] transition-colors p-1"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-red-500/10 disabled:opacity-60 active:scale-[0.98] mt-4"
                            >
                                {isLoading ? 'Creating account...' : 'Create Account Now'}
                            </button>
                        </form>

                        <div className="pt-6 text-center border-t border-gray-50">
                            <p className="text-gray-400 font-bold text-base">
                                Already registered?{' '}
                                <Link to="/sign-in" className="text-[#E31E24] font-black hover:underline underline-offset-8 decoration-2">
                                    Sign In to Portal
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
