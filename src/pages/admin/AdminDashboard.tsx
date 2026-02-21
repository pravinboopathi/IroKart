import AdminLayout from '@/components/layout/AdminLayout'
import { useAdminStats } from '@/hooks/useAdminStats'
import { useOrders } from '@/hooks/useOrders'
import {
    TrendingUp, ShoppingCart, Users, Package,
    AlertCircle, DollarSign, RefreshCw, Clock
} from 'lucide-react'

const ORDER_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
    return_requested: 'bg-pink-100 text-pink-700',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function StatCard({
    label, value, sub, icon: Icon, trend, color = 'bg-white',
}: {
    label: string; value: string; sub?: string; icon: any; trend?: string; color?: string
}) {
    return (
        <div className={`${color} rounded-xl border border-neutral-200 p-5 flex items-start gap-4 shadow-sm`}>
            <div className="p-2.5 bg-neutral-100 rounded-lg">
                <Icon className="h-5 w-5 text-neutral-700" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
            </div>
            {trend && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>
            )}
        </div>
    )
}

export default function AdminDashboard() {
    const { stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats()
    const { orders, isLoading: ordersLoading } = useOrders(undefined, true)

    const recentOrders = orders.slice(0, 10)

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Welcome back — here's what's happening with your store today.
                        </p>
                    </div>
                    <button
                        onClick={refetchStats}
                        className="flex items-center gap-2 text-sm text-neutral-600 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-all"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                {/* Realtime indicator */}
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-2 rounded-lg w-fit">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live — updates automatically when DB changes
                </div>

                {/* KPI Cards */}
                {statsLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 h-28 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Revenue" value={formatCurrency(stats.total_revenue)} sub="All time" icon={DollarSign} />
                        <StatCard label="This Month" value={formatCurrency(stats.revenue_this_month)} sub="Revenue" icon={TrendingUp} />
                        <StatCard label="Total Orders" value={stats.total_orders.toString()} sub={`${stats.orders_today} today`} icon={ShoppingCart} />
                        <StatCard label="Pending Orders" value={stats.pending_orders.toString()} sub="Awaiting fulfillment" icon={Clock} />
                        <StatCard label="Total Users" value={stats.total_users.toString()} sub="Registered accounts" icon={Users} />
                        <StatCard label="Active Products" value={stats.total_products.toString()} sub="In catalog" icon={Package} />
                        <StatCard
                            label="Low Stock"
                            value={stats.low_stock_products.toString()}
                            sub="Need restocking"
                            icon={AlertCircle}
                            color={stats.low_stock_products > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white'}
                        />
                        <StatCard label="Orders Today" value={stats.orders_today.toString()} sub="Last 24 hours" icon={ShoppingCart} />
                    </div>
                )}

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
                        <a href="/admin/orders" className="text-xs text-red-600 hover:text-red-500 font-medium">View all →</a>
                    </div>

                    {ordersLoading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <div className="p-10 text-center text-neutral-500 text-sm">
                            No orders yet. Orders will appear here once placed.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Order</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Customer</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Items</th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                                        <th className="text-center px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {recentOrders.map(order => (
                                        <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs text-neutral-700 font-medium">
                                                {order.order_number}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-neutral-900 text-xs">{(order as any).profiles?.full_name || '—'}</p>
                                                <p className="text-neutral-400 text-xs">{(order as any).profiles?.email || ''}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {order.order_items?.slice(0, 3).map(item => (
                                                        item.product_image_url ? (
                                                            <img
                                                                key={item.id}
                                                                src={item.product_image_url}
                                                                alt={item.product_name}
                                                                className="w-7 h-7 rounded object-cover border border-neutral-200"
                                                            />
                                                        ) : (
                                                            <div key={item.id} className="w-7 h-7 rounded bg-neutral-100 flex items-center justify-center">
                                                                <Package className="h-3 w-3 text-neutral-400" />
                                                            </div>
                                                        )
                                                    ))}
                                                    <span className="text-xs text-neutral-500">{order.order_items?.length} item(s)</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-semibold text-neutral-900 text-xs">
                                                {formatCurrency(order.total_amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.order_status] || 'bg-neutral-100 text-neutral-600'}`}>
                                                    {order.order_status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-xs text-neutral-400">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
