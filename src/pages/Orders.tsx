import { useAuth } from '@/context/AuthContext'
import { useOrders } from '@/hooks/useOrders'
import { Link } from 'react-router-dom'
import { ShoppingBag, Package, Truck, RefreshCw, ArrowRight, ChevronDown, ChevronUp, MapPin, CreditCard } from 'lucide-react'
import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'



function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function Orders() {
    const { user, isLoading: authLoading } = useAuth()
    const { orders, isLoading, error, refetch } = useOrders(user?.id, false)
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

    const toggleExpand = (id: string) => {
        setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // 1. Auth is loading and we don't have a user yet
    if (authLoading && !user) {
        return (
            <MainLayout>
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse h-40" />
                    ))}
                </div>
            </MainLayout>
        )
    }

    // 2. User is authenticated but orders are still loading
    if (user && isLoading) {
        return (
            <MainLayout>
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8">
                    <h1 className="text-2xl font-bold text-neutral-900 mb-6 font-mono tracking-tighter">My Orders</h1>
                    <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-neutral-100 p-6 animate-pulse h-48 shadow-sm" />
                        ))}
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (!user) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                    <ShoppingBag className="h-16 w-16 text-neutral-300" />
                    <h2 className="text-xl font-bold text-neutral-800">Sign in to view your orders</h2>
                    <Link to="/sign-in" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all">
                        Sign In
                    </Link>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="w-full bg-neutral-50 min-h-screen">
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-10">
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Your Orders</h1>
                            <p className="text-sm text-neutral-500 mt-1 flex items-center gap-2">
                                {orders.length} orders
                                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Live updates
                                </span>
                            </p>
                        </div>
                        <button onClick={refetch} className="p-2 hover:bg-neutral-100 rounded-full transition-colors transition-all" title="Refresh">
                            <RefreshCw className="h-4 w-4 text-neutral-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="text-sm font-semibold">{error}</div>
                            <button onClick={refetch} className="text-xs font-black uppercase tracking-widest bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-neutral-200 p-20 text-center shadow-sm">
                                <ShoppingBag className="h-16 w-16 text-neutral-200 mx-auto mb-5" />
                                <h3 className="text-xl font-bold text-neutral-800">No orders yet</h3>
                                <p className="text-neutral-500 text-sm mt-1 max-w-xs mx-auto">Looks like you haven't placed any orders yet. Start shopping and they will appear here!</p>
                                <Link to="/products" className="mt-8 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-red-200">
                                    Browse Products <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            orders.map(order => {
                                const isExpanded = expandedOrders[order.id]
                                return (
                                    <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                        {/* Amazon-style Card Header */}
                                        <div className="bg-neutral-100/80 border-b border-neutral-200 px-6 py-4 flex flex-wrap gap-x-12 gap-y-4 items-center justify-between">
                                            <div className="flex flex-wrap gap-x-10 gap-y-2 uppercase tracking-tighter text-[10px] font-black text-neutral-400">
                                                <div>
                                                    <p className="mb-0.5">Order Placed</p>
                                                    <p className="text-neutral-900 text-sm font-bold">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <div>
                                                    <p className="mb-0.5">Total</p>
                                                    <p className="text-neutral-900 text-sm font-bold">{formatCurrency(order.total_amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="mb-0.5">Ship To</p>
                                                    <p className="text-neutral-900 text-sm font-bold truncate max-w-[150px]">{order.shipping_address_snapshot?.full_name || 'Customer'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-auto">
                                                <p className="uppercase tracking-tighter text-[10px] font-black text-neutral-400 mb-0.5">Order # {order.order_number}</p>
                                                <button
                                                    onClick={() => toggleExpand(order.id)}
                                                    className="text-red-600 hover:text-red-700 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ml-auto"
                                                >
                                                    {isExpanded ? 'Hide' : 'Show'} Order Details
                                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Order Body */}
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className={`w-2.5 h-2.5 rounded-full ${order.order_status === 'delivered' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                                <p className="text-base font-black text-neutral-900 tracking-tight">
                                                    {order.order_status === 'delivered' ? 'Delivered' : order.order_status.replace(/_/g, ' ')}
                                                </p>
                                            </div>

                                            <div className="space-y-8">
                                                {order.order_items?.map(item => (
                                                    <div key={item.id} className="flex gap-6 group">
                                                        <div className="w-24 h-24 bg-neutral-50 border border-neutral-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                                            {item.product_image_url ? (
                                                                <img src={item.product_image_url} alt={item.product_name}
                                                                    className="w-full h-full object-contain p-2" />
                                                            ) : (
                                                                <Package className="h-8 w-8 text-neutral-200" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <Link to={`/products`} className="font-bold text-neutral-900 text-base leading-tight hover:text-red-600 transition-colors line-clamp-2 mb-1">
                                                                {item.product_name}
                                                            </Link>
                                                            <div className="flex items-center gap-3 text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                                                                <span>Qty: {item.quantity}</span>
                                                                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                                <span>{formatCurrency(item.unit_price)} / unit</span>
                                                            </div>
                                                            <div className="mt-2 text-sm font-black text-neutral-900">
                                                                {formatCurrency(item.total_price)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expandable Details Section */}
                                        {isExpanded && (
                                            <div className="border-t border-neutral-100 bg-neutral-50/50 p-8 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 text-red-600" /> Shipping Address
                                                    </h4>
                                                    <div className="text-sm text-neutral-700 leading-relaxed font-medium">
                                                        <p className="font-black text-neutral-900 mb-1">{order.shipping_address_snapshot?.full_name}</p>
                                                        <p>{order.shipping_address_snapshot?.address_line1}</p>
                                                        {order.shipping_address_snapshot?.address_line2 && <p>{order.shipping_address_snapshot?.address_line2}</p>}
                                                        <p>{order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.state} {order.shipping_address_snapshot?.postal_code}</p>
                                                        <div className="mt-3 pt-3 border-t border-neutral-100 inline-block">
                                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Phone</p>
                                                            <p className="font-bold">{order.shipping_address_snapshot?.phone}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                                            <CreditCard className="h-3 w-3 text-red-600" /> Payment & Billing
                                                        </h4>
                                                        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm border-l-4 border-l-red-600">
                                                            <div className="p-2 bg-red-50 rounded-lg">
                                                                <CreditCard className="h-5 w-5 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">Method</p>
                                                                <p className="text-sm font-bold text-neutral-600 capitalize">Online / Razorpay</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {order.tracking_number && (
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                                                <Truck className="h-3 w-3 text-red-600" /> Shipment Tracking
                                                            </h4>
                                                            <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-lg">
                                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{order.courier_company}</p>
                                                                <p className="text-lg font-black tracking-tighter">{order.tracking_number}</p>
                                                                <Link to="#" className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                                                                    Track Package <ArrowRight className="h-3 w-3" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
