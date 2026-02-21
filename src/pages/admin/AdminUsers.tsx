import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Users, Search, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'

const BACKEND = 'http://localhost:5000'

const TYPE_COLORS: Record<string, string> = {
    individual: 'bg-gray-100 text-gray-600',
    company_buyer: 'bg-blue-100 text-blue-700',
    wholesaler: 'bg-purple-100 text-purple-700',
    retailer: 'bg-indigo-100 text-indigo-700',
    admin: 'bg-red-100 text-red-700',
}

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending_verification: 'bg-yellow-100 text-yellow-700',
}

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState('')

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const res = await fetch(`${BACKEND}/api/users?limit=200`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch users')
            setUsers(data.users || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const toggleSuspend = async (user: any) => {
        setUpdatingId(user.id)
        const newStatus = user.account_status === 'suspended' ? 'active' : 'suspended'
        try {
            await fetch(`${BACKEND}/api/users/${user.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_status: newStatus }),
            })
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, account_status: newStatus } : u))
        } catch (err) {
            console.error('Failed to update status:', err)
        } finally {
            setUpdatingId(null)
        }
    }

    const changeRole = async (userId: string, user_type: string) => {
        setUpdatingId(userId)
        try {
            await fetch(`${BACKEND}/api/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_type }),
            })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type } : u))
        } catch (err) {
            console.error('Failed to update role:', err)
        } finally {
            setUpdatingId(null)
        }
    }

    const filtered = users.filter(u => {
        const q = search.toLowerCase()
        const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q)
        const matchType = typeFilter === 'all' || u.user_type === typeFilter
        return matchSearch && matchType
    })

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">{users.length} registered users</p>
                    </div>
                    <button onClick={fetchUsers} className="flex items-center gap-2 text-sm border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, phone…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white min-w-[160px] focus:ring-2 focus:ring-red-500 outline-none"
                    >
                        <option value="all">All Types</option>
                        {['individual', 'company_buyer', 'wholesaler', 'retailer', 'admin'].map(t => (
                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center">
                            <Users className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 font-medium">No users found</p>
                            <p className="text-neutral-400 text-sm mt-1">
                                {users.length === 0 ? 'No users have registered yet.' : 'Try adjusting your search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="bg-neutral-50 border-b border-neutral-100">
                                    <tr>
                                        {['User', 'Contact', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide first:pl-5 last:text-right last:pr-5">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filtered.map(user => (
                                        <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="pl-5 pr-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full object-cover border border-neutral-200" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-neutral-900 text-xs">{user.full_name || '—'}</p>
                                                        <p className="text-neutral-400 text-xs">Logins: {user.login_count || 0}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-xs text-neutral-700">{user.email || '—'}</p>
                                                <p className="text-xs text-neutral-400">{user.phone || ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <select
                                                    value={user.user_type}
                                                    disabled={updatingId === user.id}
                                                    onChange={e => changeRole(user.id, e.target.value)}
                                                    className={`text-xs rounded-full px-2.5 py-1 border-0 font-medium appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-red-500 outline-none ${TYPE_COLORS[user.user_type] || 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    {['individual', 'company_buyer', 'wholesaler', 'retailer', 'admin'].map(t => (
                                                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[user.account_status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {user.account_status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-neutral-400">
                                                {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="pr-5 pl-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => toggleSuspend(user)}
                                                    disabled={updatingId === user.id}
                                                    title={user.account_status === 'suspended' ? 'Activate user' : 'Suspend user'}
                                                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${user.account_status === 'suspended' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                                >
                                                    {user.account_status === 'suspended'
                                                        ? <ShieldCheck className="h-4 w-4" />
                                                        : <ShieldAlert className="h-4 w-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
