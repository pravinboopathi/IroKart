import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { Package, CreditCard, MapPin, Loader2, FlaskConical } from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'

// ─── Toggle this to false once you have real Razorpay keys ───
const TEST_MODE = true

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

declare global { interface Window { Razorpay: any } }

export default function Checkout() {
    const { items, total, clearCart } = useCart()
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [isPlacing, setIsPlacing] = useState(false)
    const [error, setError] = useState('')
    const [address, setAddress] = useState({
        name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
    })

    useEffect(() => {
        if (!TEST_MODE) {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.async = true
            document.body.appendChild(script)
            return () => { document.body.removeChild(script) }
        }
    }, [])

    useEffect(() => {
        if (profile) {
            setAddress(a => ({
                ...a,
                name: a.name || profile.full_name || '',
                phone: a.phone || profile.phone || '',
            }))
        }
    }, [profile])

    const shipping = total >= 999 ? 0 : 99
    const grandTotal = total + shipping

    const validate = () => {
        if (!address.line1 || !address.city || !address.pincode) {
            setError('Please fill in your delivery address (address line 1, city, pincode).')
            return false
        }
        return true
    }

    // ─── Place order in DB via backend (bypasses RLS) ───
    const placeOrder = async (paymentInfo: { gateway_payment_id: string; gateway_order_id?: string; gateway_signature?: string }) => {
        const shippingSnap = {
            full_name: address.name, phone: address.phone,
            address_line1: address.line1, address_line2: address.line2,
            city: address.city, state: address.state,
            postal_code: address.pincode, country: 'India',
        }

        const res = await fetch('http://localhost:5000/api/orders/place', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profile_id: user!.id,
                shipping_address: shippingSnap,
                subtotal: total,
                shipping_amount: shipping,
                total_amount: grandTotal,
                items: items.map(({ product, quantity }) => ({
                    product_id: product.id,
                    seller_id: product.seller_id,
                    product_name: product.name,
                    product_image_url: product.primary_image_url || null,
                    sku: product.sku || null,
                    quantity,
                    unit_price: product.selling_price,
                    total_price: product.selling_price * quantity,
                })),
                payment_info: {
                    ...paymentInfo,
                    payment_method: TEST_MODE ? 'test' : 'razorpay',
                    payment_gateway: TEST_MODE ? 'test' : 'razorpay',
                }
            })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to place order')

        clearCart()
        navigate(`/orders/${data.order_id}/confirmation`)
    }

    // ─── TEST MODE: skip Razorpay, place order immediately ───
    const handleTestPayment = async () => {
        if (!validate()) return
        setError('')
        setIsPlacing(true)
        try {
            await placeOrder({ gateway_payment_id: `test_${Date.now()}` })
        } catch (err: any) {
            setError(err.message || 'Order placement failed.')
            setIsPlacing(false)
        }
    }

    // ─── LIVE MODE: open Razorpay modal ───
    const handleRazorpayPayment = async () => {
        if (!validate()) return
        setError('')
        setIsPlacing(true)
        try {
            const res = await fetch('http://localhost:5000/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Math.round(grandTotal * 100), currency: 'INR' }),
            })
            const orderData = await res.json()
            if (!res.ok) throw new Error(orderData.error || 'Failed to create payment order')

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: Math.round(grandTotal * 100),
                currency: 'INR',
                name: 'IroKart',
                description: `Order of ${items.length} item(s)`,
                order_id: orderData.id,
                prefill: { name: address.name, contact: address.phone, email: user?.email },
                theme: { color: '#dc2626' },
                handler: async (response: any) => {
                    try {
                        await placeOrder({
                            gateway_payment_id: response.razorpay_payment_id,
                            gateway_order_id: response.razorpay_order_id,
                            gateway_signature: response.razorpay_signature,
                        })
                    } catch (err: any) {
                        setError(err.message)
                        setIsPlacing(false)
                    }
                },
                modal: { ondismiss: () => setIsPlacing(false) },
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err: any) {
            setError(err.message)
            setIsPlacing(false)
        }
    }

    if (items.length === 0) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-neutral-500 mb-3">Your cart is empty.</p>
                        <a href="/products" className="text-sm font-semibold text-red-600 hover:underline">Browse products →</a>
                    </div>
                </div>
            </MainLayout>
        )
    }

    const inputCls = "w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"

    return (
        <MainLayout>
            <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
                <h1 className="text-2xl font-bold text-neutral-900 mb-6">Checkout</h1>

                {/* Test mode banner */}
                {TEST_MODE && (
                    <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <FlaskConical className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <span className="font-semibold">Test Mode active</span> — No real payment will be charged. Click "Place Test Order" to simulate a successful payment.
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Address */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <h2 className="font-semibold text-neutral-900">Delivery Address</h2>
                            </div>
                            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {([
                                    { label: 'Full Name', key: 'name', col: 1, ph: 'Name on delivery' },
                                    { label: 'Phone', key: 'phone', col: 1, ph: '+91 9876543210' },
                                    { label: 'Address Line 1 *', key: 'line1', col: 2, ph: 'House / Flat No., Street' },
                                    { label: 'Address Line 2', key: 'line2', col: 2, ph: 'Landmark, Area (optional)' },
                                    { label: 'City *', key: 'city', col: 1, ph: 'Chennai' },
                                    { label: 'State', key: 'state', col: 1, ph: 'Tamil Nadu' },
                                    { label: 'Pincode *', key: 'pincode', col: 1, ph: '600001' },
                                ] as const).map(({ label, key, col, ph }) => (
                                    <div key={key} className={col === 2 ? 'sm:col-span-2' : ''}>
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{label}</label>
                                        <input
                                            value={(address as any)[key]}
                                            onChange={e => setAddress(a => ({ ...a, [key]: e.target.value }))}
                                            placeholder={ph}
                                            className={`${inputCls} mt-1`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order items */}
                        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-4 w-4 text-red-600" />
                                <h2 className="font-semibold text-neutral-900">Items ({items.length})</h2>
                            </div>
                            <div className="divide-y divide-neutral-100">
                                {items.map(({ product, quantity }) => (
                                    <div key={product.id} className="flex items-center gap-3 py-3 first:pt-0">
                                        <div className="w-12 h-12 flex-shrink-0 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center">
                                            {product.primary_image_url
                                                ? <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-contain p-0.5" />
                                                : <Package className="h-5 w-5 text-neutral-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                                            <p className="text-xs text-neutral-400">Qty: {quantity} × {formatCurrency(product.selling_price)}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-neutral-900 flex-shrink-0">
                                            {formatCurrency(product.selling_price * quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right – Payment */}
                    <div>
                        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm sticky top-24">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-4 w-4 text-red-600" />
                                <h2 className="font-semibold text-neutral-900">Payment Summary</h2>
                            </div>

                            <div className="space-y-2 text-sm mb-5">
                                <div className="flex justify-between text-neutral-600">
                                    <span>Subtotal</span><span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600">
                                    <span>Shipping</span>
                                    <span>{shipping === 0
                                        ? <span className="text-green-600 font-semibold">FREE</span>
                                        : formatCurrency(shipping)}
                                    </span>
                                </div>
                                <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-neutral-900 text-base">
                                    <span>Total</span><span>{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>

                            {TEST_MODE ? (
                                <button
                                    onClick={handleTestPayment}
                                    disabled={isPlacing}
                                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-3.5 rounded-lg transition-all disabled:opacity-60"
                                >
                                    {isPlacing
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>
                                        : <><FlaskConical className="h-4 w-4" /> Place Test Order</>}
                                </button>
                            ) : (
                                <button
                                    onClick={handleRazorpayPayment}
                                    disabled={isPlacing}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3.5 rounded-lg transition-all disabled:opacity-60"
                                >
                                    {isPlacing
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                                        : <><CreditCard className="h-4 w-4" /> Pay {formatCurrency(grandTotal)}</>}
                                </button>
                            )}

                            <p className="text-xs text-neutral-400 text-center mt-3">
                                {TEST_MODE ? '⚗️ Test mode — no real charge' : '🔒 Secured by Razorpay'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
