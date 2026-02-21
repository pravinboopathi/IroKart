import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'

function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function Cart() {
    const { items, removeFromCart, updateQty, total, itemCount } = useCart()

    if (items.length === 0) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
                    <ShoppingBag className="h-16 w-16 text-neutral-300" />
                    <h2 className="text-xl font-bold text-neutral-800">Your cart is empty</h2>
                    <p className="text-sm text-neutral-500">Browse our products and add items to your cart.</p>
                    <Link to="/products"
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all">
                        Browse Products <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </MainLayout>
        )
    }

    const shipping = total >= 999 ? 0 : 99
    const grandTotal = total + shipping

    return (
        <MainLayout>
            <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
                <h1 className="text-2xl font-bold text-neutral-900 mb-6">
                    Shopping Cart <span className="text-neutral-400 font-normal text-base ml-2">({itemCount} items)</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                        {items.map(({ product, quantity }) => (
                            <div key={product.id} className="bg-white rounded-xl border border-neutral-200 p-4 flex gap-4 shadow-sm">
                                <div className="w-24 h-24 flex-shrink-0 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden">
                                    {product.primary_image_url ? (
                                        <img src={product.primary_image_url} alt={product.name} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Package className="h-8 w-8 text-neutral-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-neutral-900 leading-tight line-clamp-2">{product.name}</p>
                                    {product.sku && <p className="text-xs text-neutral-400 mt-0.5">SKU: {product.sku}</p>}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => updateQty(product.id, quantity - 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-neutral-600">
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                                            <button onClick={() => updateQty(product.id, quantity + 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-neutral-600">
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-neutral-900 text-sm">{formatCurrency(product.selling_price * quantity)}</span>
                                            <button onClick={() => removeFromCart(product.id)}
                                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 shadow-sm">
                            <h2 className="font-semibold text-neutral-900">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-neutral-600">
                                    <span>Subtotal ({itemCount} items)</span><span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatCurrency(shipping)}</span>
                                </div>
                                {shipping > 0 && <p className="text-xs text-neutral-400">Add {formatCurrency(999 - total)} more for free shipping</p>}
                                <div className="border-t border-neutral-100 pt-2 flex justify-between font-bold text-neutral-900">
                                    <span>Total</span><span>{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                            <Link to="/checkout"
                                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-lg transition-all">
                                Proceed to Checkout <ArrowRight className="h-4 w-4" />
                            </Link>
                            <p className="text-xs text-neutral-400 text-center">🔒 Secured by Razorpay</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
