import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import {
    User, MapPin, LogOut, Edit2, Check, X,
    ShoppingBag, Heart, Settings, ChevronRight
} from 'lucide-react'

export default function Profile() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        full_name: profile?.full_name || '',
        display_name: (profile as any)?.display_name || '',
        phone: profile?.phone || '',
    })

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setError('')
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: form.full_name, display_name: form.display_name || null, phone: form.phone || null })
                .eq('id', user.id)
            if (error) throw error
            setEditing(false)
            window.location.reload()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/sign-in')
    }

    const initials = profile?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

    const menuItems = [
        { icon: ShoppingBag, label: 'My Orders', sub: 'Track, return or buy again', href: '/orders' },
        { icon: Heart, label: 'Wishlist', sub: 'Your saved items', href: '/wishlist' },
        { icon: MapPin, label: 'Addresses', sub: 'Manage delivery addresses', href: '#' },
        { icon: Settings, label: 'Account Settings', sub: 'Password & preferences', href: '#' },
    ]

    return (
        <MainLayout>
            <div className="w-full bg-neutral-50 min-h-[70vh]">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-5">

                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        {/* Banner */}
                        <div className="h-28 bg-gradient-to-r from-neutral-900 via-neutral-800 to-red-900" />

                        <div className="px-6 pb-6">
                            <div className="flex items-end justify-between -mt-12 mb-5">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-2xl bg-red-100 border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0">
                                    {(profile as any)?.avatar_url ? (
                                        <img src={(profile as any).avatar_url} alt={profile?.full_name}
                                            className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-red-600">{initials}</span>
                                    )}
                                </div>

                                {!editing ? (
                                    <button onClick={() => {
                                        setForm({
                                            full_name: profile?.full_name || '',
                                            display_name: (profile as any)?.display_name || '',
                                            phone: profile?.phone || '',
                                        })
                                        setEditing(true)
                                    }}
                                        className="flex items-center gap-1.5 text-sm text-neutral-700 border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all">
                                        <Edit2 className="h-3.5 w-3.5" /> Edit profile
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditing(false)} disabled={saving}
                                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500">
                                            <X className="h-4 w-4" />
                                        </button>
                                        <button onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-60">
                                            <Check className="h-3.5 w-3.5" />
                                            {saving ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

                            {editing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Full Name', key: 'full_name', placeholder: 'Your full name' },
                                        { label: 'Display Name', key: 'display_name', placeholder: 'Nickname (optional)' },
                                        { label: 'Phone', key: 'phone', placeholder: '+91 9876543210' },
                                    ].map(({ label, key, placeholder }) => (
                                        <div key={key}>
                                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</label>
                                            <input value={(form as any)[key]}
                                                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                placeholder={placeholder}
                                                className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900">{profile?.full_name || 'IroKart User'}</h2>
                                    {(profile as any)?.display_name && (
                                        <p className="text-sm text-neutral-400 mt-0.5">@{(profile as any).display_name}</p>
                                    )}
                                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                                        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                            <User className="h-3.5 w-3.5 text-neutral-400" />
                                            {user?.email}
                                        </div>
                                        {profile?.phone && (
                                            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                                <span className="text-neutral-400">📞</span> {profile.phone}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${profile?.user_type === 'admin' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                            }`}>
                                            {profile?.user_type?.replace(/_/g, ' ') || 'customer'}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            Member since {new Date((profile as any)?.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Menu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {menuItems.map(({ icon: Icon, label, sub, href }) => (
                            <Link key={href + label} to={href}
                                className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4 hover:shadow-md hover:border-neutral-300 transition-all group">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
                                    <Icon className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-neutral-900">{label}</p>
                                    <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0 group-hover:text-neutral-500 transition-colors" />
                            </Link>
                        ))}
                    </div>

                    {/* Admin Panel shortcut */}
                    {profile?.user_type === 'admin' && (
                        <Link to="/admin/dashboard"
                            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white text-sm font-semibold py-3 rounded-xl transition-all">
                            Go to Admin Panel →
                        </Link>
                    )}

                    {/* Sign out */}
                    <button onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 text-sm text-red-600 border border-red-200 bg-white rounded-xl py-3 hover:bg-red-50 transition-all">
                        <LogOut className="h-4 w-4" />Sign out
                    </button>
                </div>
            </div>
        </MainLayout>
    )
}
