import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, ShoppingCart, Package, Users,
    LogOut, Menu, X, ChevronRight, Bell, Search, BarChart3,
    Tag
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { profile, signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
        navigate('/sign-in')
    }

    const currentPage = navItems.find(n => location.pathname.startsWith(n.href))?.label || 'Admin'

    return (
        <div className="min-h-screen bg-[#f4f6f8] flex">
            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1d21] text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:static lg:flex`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow">
                        <span className="text-white font-black text-sm">Iro</span>
                    </div>
                    <div>
                        <span className="text-white font-black tracking-tight text-lg">IroKart</span>
                        <span className="block text-[10px] text-white/40 uppercase tracking-widest">Admin Panel</span>
                    </div>
                    <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
                        <X className="h-5 w-5 text-white/60" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const active = location.pathname.startsWith(href)
                        return (
                            <Link
                                key={href}
                                to={href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {label}
                                {active && <ChevronRight className="h-3 w-3 ml-auto text-white/40" />}
                            </Link>
                        )
                    })}
                </nav>

                {/* User / Sign out */}
                <div className="px-3 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {profile?.full_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Admin'}</p>
                            <p className="text-[10px] text-white/40 truncate">{profile?.email || ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="mt-1 flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Overlay (mobile) */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 lg:px-6 py-3 flex items-center gap-4">
                    <button className="lg:hidden p-2 rounded-lg hover:bg-neutral-100" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5 text-neutral-600" />
                    </button>

                    <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                        <span>Admin</span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-neutral-900 font-semibold">{currentPage}</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <div className="relative hidden sm:flex items-center">
                            <Search className="absolute left-3 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 text-sm bg-neutral-100 rounded-lg border-0 focus:ring-2 focus:ring-black focus:bg-white transition-all w-52"
                            />
                        </div>
                        <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                            <Bell className="h-5 w-5 text-neutral-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <Link
                            to="/"
                            className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-all"
                        >
                            View Store
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
