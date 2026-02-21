import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import type { OrderStatus } from '@/lib/types'
import { Package, Search, Filter, RefreshCw, ChevronDown } from 'lucide-react'

const BACKEND = 'http://localhost:5000'

const STATUS_OPTIONS: OrderStatus[] = [
    'pending', 'confirmed', 'processing', 'shipped',
    'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'
]

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-purple-100 text-purple-700 border-purple-200',
    shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    refunded: 'bg-gray-100 text-gray-600 border-gray-200',
    return_requested: 'bg-pink-100 text-pink-700 border-pink-200',
    returned: 'bg-rose-100 text-rose-700 border-rose-200',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [error, setError] = useState('')

    const fetchOrders = useCallback(async () => {
        setIsLoading(true)
        setError('')
        try {
            const url = statusFilter !== 'all'
                ? `${BACKEND}/api/orders?status=${statusFilter}&limit=200`
                : `${BACKEND}/api/orders?limit=200`
            const res = await fetch(url)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')
            setOrders(data.orders || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    const handleStatusChange = async (orderId: string, status: OrderStatus) => {
        setUpdatingId(orderId)
        try {
            await fetch(`${BACKEND}/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: status }),
            })
            // Optimistically update locally
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: status } : o))
        } catch (err) {
            console.error('Failed to update order status:', err)
        } finally {
            setUpdatingId(null)
        }
    }

    const filtered = orders.filter(o => {
        const q = search.toLowerCase()
        return !q
            || o.order_number?.toLowerCase().includes(q)
            || o.profiles?.full_name?.toLowerCase().includes(q)
            || o.profiles?.email?.toLowerCase().includes(q)
    })

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Orders</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">{orders.length} total orders</p>
                    </div>
                    <button onClick={fetchOrders} className="flex items-center gap-2 text-sm border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50">
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
                            placeholder="Search by order #, customer name or email…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-red-500 min-w-[160px] outline-none"
                        >
                            <option value="all">All Statuses</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center">
                            <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 font-medium">No orders found</p>
                            <p className="text-neutral-400 text-sm mt-1">
                                {orders.length === 0 ? 'No orders have been placed yet.' : 'Try adjusting your search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[900px]">
                                <thead className="bg-neutral-50 border-b border-neutral-100">
                                    <tr>
                                        {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Update Status'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide first:pl-5 last:pr-5">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filtered.map(order => (
                                        <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="pl-5 pr-4 py-3.5 font-mono text-xs font-semibold text-neutral-800">
                                                {order.order_number}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-neutral-900 text-xs leading-tight">{order.profiles?.full_name || '—'}</p>
                                                <p className="text-neutral-400 text-xs">{order.profiles?.email || ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {order.order_items?.slice(0, 2).map((item: any) => (
                                                        item.product_image_url ? (
                                                            <img key={item.id} src={item.product_image_url} alt={item.product_name}
                                                                className="w-8 h-8 rounded-md object-cover border border-neutral-200" />
                                                        ) : (
                                                            <div key={item.id} className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center">
                                                                <Package className="h-3.5 w-3.5 text-neutral-400" />
                                                            </div>
                                                        )
                                                    ))}
                                                    {(order.order_items?.length || 0) > 2 && (
                                                        <span className="text-xs text-neutral-400">+{order.order_items.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-neutral-900 text-xs">
                                                {formatCurrency(order.total_amount)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${order.payment_status === 'captured' ? 'bg-green-50 text-green-600 border-green-200' :
                                                        order.payment_status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                            'bg-red-50 text-red-600 border-red-200'
                                                    }`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[order.order_status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                                                    {order.order_status?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-neutral-400">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="pr-5 pl-4 py-3.5">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={order.order_status}
                                                        disabled={updatingId === order.id}
                                                        onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 pr-6 bg-white appearance-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer outline-none"
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
                                                </div>
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
