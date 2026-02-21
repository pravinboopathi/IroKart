import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
    Search, Heart, ShoppingCart, Package, User,
    Menu, X, Monitor, Cpu,
    LogOut, ClipboardList, Shield
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

const RED = '#E31E24'

export default function Navbar() {
    const { itemCount, total } = useCart()
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [search, setSearch] = useState('')
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    const currentCategory = new URLSearchParams(location.search).get('category')

    const subNavItems = [
        { icon: Monitor, label: 'Hardware', path: '/products?category=hardware', id: 'hardware' },
        { icon: Cpu, label: 'Software', path: '/products?category=software', id: 'software' },
        { icon: Package, label: 'All Products', path: '/products', id: '' },
    ]

    // Close user dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (search.trim()) {
            navigate(`/products?q=${encodeURIComponent(search.trim())}`)
            setSearch('')
        }
    }

    const handleSignOut = async () => {
        setUserMenuOpen(false)
        await signOut()
        navigate('/sign-in')
    }

    const initials = profile?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

    return (
        <header className="w-full flex flex-col border-b sticky top-0 bg-white z-40 shadow-sm">
            {/* ── Top bar ── */}
            <div className="w-full max-w-[1920px] mx-auto py-3 px-4 md:px-12 flex items-center justify-between gap-4 md:gap-8 bg-white h-[72px] md:h-[88px]">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center text-white shadow-md transform group-hover:-rotate-6 transition-transform"
                        style={{ background: RED }}>
                        <Package className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900">
                            IroKart<span style={{ color: RED }}>.</span>
                        </h1>
                        <p className="text-[10px] tracking-widest text-gray-400 font-semibold uppercase mt-0.5">Premium IT Store</p>
                    </div>
                </Link>

                {/* Search — desktop only */}
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto relative group shadow-sm rounded-md hover:shadow-md transition-shadow">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search for laptops, processors, accessories..."
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-red-500 pl-4 pr-0 h-12 rounded-l-md text-sm"
                    />
                    <button type="submit"
                        className="h-12 text-white px-6 rounded-r-md transition-colors flex-shrink-0 flex items-center justify-center"
                        style={{ background: RED }}>
                        <Search className="w-5 h-5" />
                    </button>
                </form>

                {/* Right actions */}
                <div className="flex items-center gap-1 md:gap-3">
                    {/* Wishlist */}
                    <Link to="/wishlist" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Heart className="w-5 h-5" />
                    </Link>

                    {/* User menu */}
                    <div className="relative hidden sm:block" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(o => !o)}
                            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            {user ? (
                                <span className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">{initials}</span>
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                                {user ? (
                                    <>
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-900 truncate">{profile?.full_name || user.email}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <User className="h-4 w-4 text-gray-400" /> My Profile
                                        </Link>
                                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                            <ClipboardList className="h-4 w-4 text-gray-400" /> My Orders
                                        </Link>
                                        {profile?.user_type === 'admin' && (
                                            <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                                                <Shield className="h-4 w-4" /> Admin Panel
                                            </Link>
                                        )}
                                        <div className="border-t border-gray-100">
                                            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                                                <LogOut className="h-4 w-4" /> Sign Out
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/sign-in" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">Sign In</Link>
                                        <Link to="/sign-up" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-100">Create Account</Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden sm:block w-px h-7 bg-gray-200" />

                    {/* Cart */}
                    <Link to="/cart" className="flex items-center gap-2 group px-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white group-hover:border-red-500 transition-colors shadow-sm">
                            <ShoppingCart className="w-5 h-5 text-gray-700" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white min-w-[20px] text-center"
                                    style={{ background: RED }}>
                                    {itemCount}
                                </span>
                            )}
                        </div>
                        <div className="hidden lg:flex flex-col leading-tight">
                            <span className="text-xs text-gray-400 font-medium">Cart Total</span>
                            <span className="font-black text-sm text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                        </div>
                    </Link>

                    {/* Mobile hamburger */}
                    <button onClick={() => setMobileNavOpen(o => !o)}
                        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg ml-1">
                        {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* ── Sub-nav category bar ── desktop */}
            <div className="bg-gray-50 border-t border-gray-100 hidden md:block w-full">
                <div className="max-w-[1920px] mx-auto flex items-center overflow-x-auto px-12 h-12 text-sm font-semibold text-gray-600 gap-1">
                    {subNavItems.map(item => {
                        const isActive = currentCategory === item.id || (location.pathname === '/products' && !item.id)
                        return (
                            <Link key={item.label} to={item.path}
                                className={`flex items-center gap-1.5 px-4 h-full border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-red-600 text-red-600' : 'border-transparent hover:text-gray-900'}`}>
                                <item.icon className="w-4 h-4" />{item.label}
                            </Link>
                        )
                    })}
                    <Link to="/" className={`flex items-center gap-1.5 px-4 h-full border-b-2 transition-colors whitespace-nowrap ${location.pathname === '/' ? 'border-red-600 text-red-600' : 'border-transparent hover:text-gray-900'}`}>
                        Home
                    </Link>
                </div>
            </div>

            {/* ── Mobile nav dropdown ── */}
            {mobileNavOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-top duration-200">
                    <div className="flex flex-col py-2">
                        <form onSubmit={handleSearch} className="flex mx-4 mt-2 mb-3">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-l-lg bg-gray-50 focus:outline-none" />
                            <button type="submit" className="px-4 py-2.5 text-white rounded-r-lg text-sm" style={{ background: RED }}>
                                <Search className="w-4 h-4" />
                            </button>
                        </form>
                        {subNavItems.map(item => (
                            <Link key={item.label} to={item.path} onClick={() => setMobileNavOpen(false)}
                                className="flex items-center gap-3 px-6 py-4 text-gray-700 hover:bg-gray-50 transition-colors">
                                <item.icon className="w-5 h-5 text-gray-400" />
                                <span className="font-bold text-sm">{item.label}</span>
                            </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            {user ? (
                                <>
                                    <Link to="/profile" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-3 px-6 py-4 text-gray-700 hover:bg-gray-50">
                                        <User className="w-5 h-5 text-gray-400" /><span className="font-bold text-sm">Profile</span>
                                    </Link>
                                    <button onClick={() => { handleSignOut(); setMobileNavOpen(false) }}
                                        className="w-full flex items-center gap-3 px-6 py-4 text-red-600 hover:bg-red-50">
                                        <LogOut className="w-5 h-5" /><span className="font-bold text-sm">Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/sign-in" onClick={() => setMobileNavOpen(false)}
                                    className="flex items-center gap-3 px-6 py-4 font-black text-sm uppercase tracking-widest"
                                    style={{ color: RED }}>
                                    <User className="w-5 h-5" /> Login / Register
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
