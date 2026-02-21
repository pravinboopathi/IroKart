import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import ProductCard, { type ProductData } from '@/components/landing/ProductCard'
import { Search, Package, ChevronDown } from 'lucide-react'

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
        product_type: p.product_type,
        category_slug: p.categories?.slug || ''
    }
}

const SORT_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
]

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState<ProductData[]>([])
    const [allProducts, setAllProducts] = useState<ProductData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [sort, setSort] = useState('newest')

    useEffect(() => {
        setIsLoading(true)
        fetch(`/api/products?status=active&limit=100`)
            .then(r => r.json())
            .then(data => {
                const mapped = (data.products || []).map(mapProduct)
                setAllProducts(mapped)
            })
            .catch(() => { })
            .finally(() => setIsLoading(false))
    }, [])

    // Sync search input with URL param 'q'
    useEffect(() => {
        const q = searchParams.get('q') || ''
        if (q !== search) setSearch(q)
    }, [searchParams])

    // Filter & sort client-side
    useEffect(() => {
        let filtered = [...allProducts]

        // 1. Category Filter from URL (?category=hardware|software)
        const category = searchParams.get('category')?.toLowerCase()
        if (category) {
            filtered = filtered.filter(p => {
                if (category === 'hardware') return p.product_type === 'physical'
                if (category === 'software') return p.product_type === 'digital'
                return p.category_slug === category
            })
        }

        // 2. Search Filter
        const q = search.trim().toLowerCase()
        if (q) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.product_type?.toLowerCase().includes(q)
            )
        }

        // 3. Sort
        if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price)
        else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price)

        setProducts(filtered)
    }, [allProducts, search, sort, searchParams])

    const skeletons = [...Array(8)]

    return (
        <MainLayout>
            <div className="w-full bg-neutral-50 min-h-[70vh]">
                {/* Page header */}
                {/* Page header */}
                <div className="bg-white border-b border-neutral-200">
                    <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none">
                                IroKart <span className="text-[#E31E24]">Catalog</span>
                            </h1>
                            <div className="h-1.5 w-32 bg-[#E31E24] mt-4 mb-4" />
                            {!isLoading && (
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-2">
                                    {products.length} Items available in {searchParams.get('category')?.toUpperCase() || 'Full Inventory'}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <form onSubmit={(e) => { e.preventDefault(); setSearchParams({ q: search }) }}>
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search catalog…"
                                        className="w-full pl-11 pr-4 py-3 text-sm border-2 border-neutral-100 rounded-xl bg-neutral-50 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#E31E24] transition-all font-bold placeholder:text-neutral-300"
                                    />
                                </form>
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-3 text-sm border-2 border-neutral-100 rounded-xl bg-neutral-50 focus:outline-none focus:border-[#E31E24] cursor-pointer font-black text-neutral-800 uppercase tracking-tight"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-12">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {skeletons.map((_, i) => (
                                <div key={i} className="bg-white border border-neutral-100 rounded h-72 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Package className="h-16 w-16 text-neutral-300" />
                            <h3 className="text-lg font-semibold text-neutral-700">
                                {allProducts.length === 0 ? 'No products yet' : 'No products match your search'}
                            </h3>
                            <p className="text-sm text-neutral-400">
                                {allProducts.length === 0
                                    ? 'Add products via the admin panel to see them here.'
                                    : 'Try a different search term.'}
                            </p>
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="text-sm text-red-600 font-semibold hover:underline">
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {products.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
