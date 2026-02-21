import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, Package, MapPin, ArrowRight } from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function OrderConfirmation() {
    const { orderId } = useParams()
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!orderId) return
        supabase.from('orders').select('*, order_items(*)')
            .eq('id', orderId).single()
            .then(({ data }) => { setOrder(data); setIsLoading(false) })
    }, [orderId])

    return (
        <MainLayout>
            <div className="w-full max-w-2xl mx-auto px-4 md:px-8 py-12">
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-neutral-200 border-t-red-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-neutral-900">Order Placed! 🎉</h1>
                            <p className="text-neutral-500 mt-2">
                                Your order <span className="font-mono font-bold text-neutral-800">{order?.order_number}</span> is confirmed.
                            </p>
                        </div>

                        {order && (
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
                                <div className="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-700 capitalize">{order.order_status.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                                <div className="divide-y divide-neutral-100">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                                            <div className="w-14 h-14 flex-shrink-0 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center">
                                                {item.product_image_url
                                                    ? <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-contain p-1" />
                                                    : <Package className="h-5 w-5 text-neutral-300" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-900 truncate">{item.product_name}</p>
                                                <p className="text-xs text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-neutral-900 flex-shrink-0">{formatCurrency(item.total_price)}</p>
                                        </div>
                                    ))}
                                </div>
                                {order.shipping_address_snapshot && (
                                    <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-100">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-neutral-600 leading-relaxed">
                                                <p className="font-semibold text-neutral-800">{order.shipping_address_snapshot.full_name}</p>
                                                <p>{order.shipping_address_snapshot.address_line1}</p>
                                                {order.shipping_address_snapshot.address_line2 && <p>{order.shipping_address_snapshot.address_line2}</p>}
                                                <p>{order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} — {order.shipping_address_snapshot.postal_code}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link to="/orders"
                                className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 bg-white text-neutral-800 text-sm font-semibold py-3 rounded-xl hover:bg-neutral-50 transition-all">
                                View All Orders
                            </Link>
                            <Link to="/"
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-xl transition-all">
                                Continue Shopping <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    )
}
