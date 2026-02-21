import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard, { type ProductData } from './ProductCard'
import { ShieldCheck, CreditCard, Zap, Percent } from 'lucide-react'

const BACKEND = 'http://localhost:5000'

function mapProduct(p: any): ProductData {
    return {
        id: p.id,
        slug: p.slug,
        title: p.name,
        image: p.primary_image_url || '',
        price: p.selling_price,
        originalPrice: p.compare_at_price || undefined,
        discountPercent: p.compare_at_price
            ? Math.round((1 - p.selling_price / p.compare_at_price) * 100)
            : undefined,
        selling_price: p.selling_price,
        primary_image_url: p.primary_image_url,
        seller_id: p.seller_id,
        sku: p.sku,
    }
}

const FEATURES = [
    { icon: ShieldCheck, text: 'GST Billing Available' },
    { icon: CreditCard, text: 'Secure Payment' },
    { icon: Zap, text: 'Instant License Delivery' },
    { icon: Percent, text: 'Bulk Discounts' },
]

export default function TopProductsSection() {
    const [products, setProducts] = useState<ProductData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch(`${BACKEND}/api/products?status=active&limit=8`)
            .then(r => r.json())
            .then(data => { if (data.products) setProducts(data.products.map(mapProduct)) })
            .catch(() => { })
            .finally(() => setIsLoading(false))
    }, [])

    return (
        <>
            {/* ── Features bar ── */}
            <div className="bg-red-50/20 border-y border-gray-100 py-10">
                <div className="max-w-7xl mx-auto px-4 md:px-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center justify-center gap-3 bg-white/60 py-4 px-5 rounded-xl border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-[#E31E24] p-2 rounded flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-extrabold text-gray-800 text-sm tracking-tight">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Product grid ── */}
            {(isLoading || products.length > 0) && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 md:px-12">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                            <h2 className="text-3xl font-black text-[#003399] tracking-tighter uppercase italic">
                                Top Products
                            </h2>
                            <Link to="/products" className="flex items-center gap-1.5 text-[#E31E24] font-bold text-sm hover:underline uppercase tracking-widest">
                                Browse All
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {products.map(p => <ProductCard key={p.id} product={p} />)}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </>
    )
}
