import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard, { type ProductData } from './ProductCard'

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

export default function BestSellerSection() {
    const [products, setProducts] = useState<ProductData[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch(`${BACKEND}/api/products?status=active&limit=16`)
            .then(r => r.json())
            .then(data => { if (data.products) setProducts(data.products.map(mapProduct)) })
            .catch(() => { })
            .finally(() => setIsLoading(false))
    }, [])

    if (!isLoading && products.length === 0) return null

    return (
        <section className="py-16 bg-[#f8fafc]">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-3xl font-black text-[#003399] tracking-tighter uppercase italic">
                        Best Sellers
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
                        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                )}
            </div>
        </section>
    )
}
