import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { useProducts } from '@/hooks/useProducts'
import type { ProductStatus } from '@/lib/types'
import { Package, Search, RefreshCw, Edit, Trash2, ChevronDown, AlertCircle, Plus } from 'lucide-react'

const STATUS_OPTIONS: ProductStatus[] = ['active', 'inactive', 'draft', 'out_of_stock', 'discontinued']

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    draft: 'bg-blue-100 text-blue-700',
    out_of_stock: 'bg-red-100 text-red-700',
    discontinued: 'bg-neutral-200 text-neutral-500',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function AdminProducts() {
    const { products, isLoading, refetch, updateProductStatus, deleteProduct } = useProducts(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleStatusChange = async (productId: string, status: ProductStatus) => {
        setUpdatingId(productId)
        try {
            await updateProductStatus(productId, status)
        } catch (err) {
            console.error('Failed to update product:', err)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDelete = async (productId: string, productName: string) => {
        if (!confirm(`Deactivate "${productName}"? It will no longer appear in the store.`)) return
        setDeletingId(productId)
        try {
            await deleteProduct(productId)
        } catch (err) {
            console.error('Failed to deactivate product:', err)
        } finally {
            setDeletingId(null)
        }
    }

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || p.product_status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <AdminLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {products.length} products · stock levels update in real-time
                            <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Live
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={refetch} className="flex items-center gap-2 text-sm border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                        <Link
                            to="/admin/products/new"
                            className="flex items-center gap-2 text-sm bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Product
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by product name or SKU…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-black min-w-[160px]"
                    >
                        <option value="all">All Statuses</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center">
                            <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 font-medium">No products found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[900px]">
                                <thead className="bg-neutral-50 border-b border-neutral-100">
                                    <tr>
                                        {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Rating', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide first:pl-5 last:text-right last:pr-5">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filtered.map(product => (
                                        <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="pl-5 pr-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {product.primary_image_url ? (
                                                        <img src={product.primary_image_url} alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                                            <Package className="h-4 w-4 text-neutral-400" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-neutral-900 text-xs leading-tight truncate max-w-[200px]">{product.name}</p>
                                                        <p className="text-neutral-400 text-xs capitalize">{product.product_type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">{product.sku || '—'}</td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-neutral-900 text-xs">{formatCurrency(product.selling_price)}</p>
                                                {product.compare_at_price && (
                                                    <p className="text-neutral-400 text-xs line-through">{formatCurrency(product.compare_at_price)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {(product.stock_quantity || 0) <= (product.available_quantity || 10) && (product.stock_quantity || 0) > 0 && (
                                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                                    )}
                                                    <span className={`text-xs font-semibold ${(product.stock_quantity || 0) === 0 ? 'text-red-600' :
                                                        (product.stock_quantity || 0) <= 10 ? 'text-orange-600' : 'text-green-600'
                                                        }`}>
                                                        {product.stock_quantity ?? '—'}
                                                    </span>
                                                    <span className="text-neutral-400 text-xs">units</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={product.product_status}
                                                        disabled={updatingId === product.id}
                                                        onChange={e => handleStatusChange(product.id, e.target.value as ProductStatus)}
                                                        className={`text-xs rounded-full px-2.5 py-1 pr-6 border-0 font-medium appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-red-500 ${STATUS_COLORS[product.product_status]}`}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {product.rating ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-400 text-xs">★</span>
                                                        <span className="text-xs font-medium">{product.rating}</span>
                                                        <span className="text-neutral-400 text-xs">({product.review_count})</span>
                                                    </div>
                                                ) : <span className="text-neutral-400 text-xs">No reviews</span>}
                                            </td>
                                            <td className="pr-5 pl-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        disabled={deletingId === product.id}
                                                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
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
