import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabaseClient'
import { Upload, X, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Category { id: string; name: string; slug: string }

export default function AdminCreateProduct() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [imagePreview, setImagePreview] = useState<string>('')

    const [form, setForm] = useState({
        name: '',
        slug: '',
        short_description: '',
        description: '',
        sku: '',
        category_id: '',
        product_type: 'physical' as 'physical' | 'digital',
        cost_price: '',
        selling_price: '',
        compare_at_price: '',
        tax_rate: '18',
        product_status: 'draft' as 'draft' | 'active' | 'inactive',
        is_featured: false,
        primary_image_url: '',
        stock_quantity: '',
        low_stock_threshold: '10',
        allows_bulk: false,
        min_bulk_qty: '1',
    })

    useEffect(() => {
        supabase
            .from('categories')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('name')
            .then(({ data }) => setCategories(data as Category[] || []))
    }, [])

    const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .slice(0, 60)
        set('name', name)
        set('slug', slug)
    }

    const handleImageUrl = (url: string) => {
        set('primary_image_url', url)
        setImagePreview(url)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (!form.name.trim()) throw new Error('Product name is required')
            if (!form.category_id) throw new Error('Please select a category')
            if (!form.selling_price || isNaN(Number(form.selling_price))) throw new Error('Valid selling price is required')

            // 1. Get current user (admin = seller_id for platform products)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // 2. Insert product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    name: form.name.trim(),
                    slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
                    short_description: form.short_description || null,
                    description: form.description || null,
                    sku: form.sku || null,
                    seller_id: user.id,
                    category_id: form.category_id,
                    product_type: form.product_type,
                    cost_price: Number(form.cost_price) || 0,
                    selling_price: Number(form.selling_price),
                    compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
                    tax_rate: Number(form.tax_rate) || 18,
                    product_status: form.product_status,
                    is_featured: form.is_featured,
                    allows_bulk: form.allows_bulk,
                    min_bulk_qty: Number(form.min_bulk_qty) || 1,
                })
                .select()
                .single()

            if (productError) throw new Error(productError.message)

            // 3. Insert primary image if provided
            if (form.primary_image_url) {
                await supabase.from('product_images').insert({
                    product_id: product.id,
                    image_url: form.primary_image_url,
                    is_primary: true,
                    sort_order: 0,
                })
            }

            // 4. Create inventory record if physical product
            if (form.product_type === 'physical' && form.stock_quantity) {
                await supabase.from('inventory').insert({
                    product_id: product.id,
                    quantity: Number(form.stock_quantity),
                    reserved_quantity: 0,
                    low_stock_threshold: Number(form.low_stock_threshold) || 10,
                })
            }

            setSuccess(true)
            setTimeout(() => navigate('/admin/products'), 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const inputClass = "w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none transition-all"
    const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5"

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Create Product</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">Add a new product to your catalog</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50"
                    >
                        <X className="h-4 w-4" /> Cancel
                    </button>
                </div>

                {success && (
                    <div className="mb-6 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
                        <CheckCircle className="h-4 w-4" />
                        Product created! Redirecting to products…
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* ── Left column – main info ── */}
                        <div className="lg:col-span-2 space-y-5">

                            {/* Basic info card */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                                <h2 className="font-semibold text-neutral-900 text-sm">Basic Information</h2>

                                <div>
                                    <label className={labelClass}>Product Name *</label>
                                    <input
                                        value={form.name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        placeholder="e.g. Intel Core i5-13600K Processor"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Slug (URL)</label>
                                    <input
                                        value={form.slug}
                                        onChange={e => set('slug', e.target.value)}
                                        placeholder="auto-generated from name"
                                        className={`${inputClass} font-mono text-xs text-neutral-600`}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Short Description</label>
                                    <input
                                        value={form.short_description}
                                        onChange={e => set('short_description', e.target.value)}
                                        placeholder="One-line summary shown in listings"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => set('description', e.target.value)}
                                        rows={5}
                                        placeholder="Full product description, specs, features…"
                                        className={`${inputClass} resize-y`}
                                    />
                                </div>
                            </div>

                            {/* Pricing card */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                                <h2 className="font-semibold text-neutral-900 text-sm">Pricing</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClass}>Selling Price (₹) *</label>
                                        <input
                                            type="number"
                                            value={form.selling_price}
                                            onChange={e => set('selling_price', e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Compare at (₹)</label>
                                        <input
                                            type="number"
                                            value={form.compare_at_price}
                                            onChange={e => set('compare_at_price', e.target.value)}
                                            placeholder="MRP / original price"
                                            min="0"
                                            step="0.01"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Cost Price (₹)</label>
                                        <input
                                            type="number"
                                            value={form.cost_price}
                                            onChange={e => set('cost_price', e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Tax Rate (GST %)</label>
                                        <select
                                            value={form.tax_rate}
                                            onChange={e => set('tax_rate', e.target.value)}
                                            className={inputClass}
                                        >
                                            {[0, 5, 12, 18, 28].map(r => (
                                                <option key={r} value={r}>{r}%</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>SKU</label>
                                        <input
                                            value={form.sku}
                                            onChange={e => set('sku', e.target.value)}
                                            placeholder="e.g. INT-I5-13600K"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Inventory card (only for physical) */}
                            {form.product_type === 'physical' && (
                                <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                                    <h2 className="font-semibold text-neutral-900 text-sm">Inventory</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Stock Quantity</label>
                                            <input
                                                type="number"
                                                value={form.stock_quantity}
                                                onChange={e => set('stock_quantity', e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Low Stock Alert at</label>
                                            <input
                                                type="number"
                                                value={form.low_stock_threshold}
                                                onChange={e => set('low_stock_threshold', e.target.value)}
                                                placeholder="10"
                                                min="1"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            id="allows_bulk"
                                            type="checkbox"
                                            checked={form.allows_bulk}
                                            onChange={e => set('allows_bulk', e.target.checked)}
                                            className="w-4 h-4 rounded accent-red-600"
                                        />
                                        <label htmlFor="allows_bulk" className="text-sm text-neutral-700">Allow bulk / wholesale orders</label>
                                        {form.allows_bulk && (
                                            <input
                                                type="number"
                                                value={form.min_bulk_qty}
                                                onChange={e => set('min_bulk_qty', e.target.value)}
                                                placeholder="Min qty"
                                                min="1"
                                                className="w-24 px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Right column – meta + image ── */}
                        <div className="space-y-5">
                            {/* Status/category card */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                                <h2 className="font-semibold text-neutral-900 text-sm">Publish</h2>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select
                                        value={form.product_status}
                                        onChange={e => set('product_status', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active (live)</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Category *</label>
                                    <select
                                        value={form.category_id}
                                        onChange={e => set('category_id', e.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Select category…</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Product Type</label>
                                    <div className="flex gap-3">
                                        {(['physical', 'digital'] as const).map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => set('product_type', t)}
                                                className={`flex-1 text-sm py-2 rounded-lg border font-medium transition-all capitalize ${form.product_type === t
                                                        ? 'border-neutral-900 bg-neutral-900 text-white'
                                                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="is_featured"
                                        type="checkbox"
                                        checked={form.is_featured}
                                        onChange={e => set('is_featured', e.target.checked)}
                                        className="w-4 h-4 rounded accent-red-600"
                                    />
                                    <label htmlFor="is_featured" className="text-sm text-neutral-700">Mark as Featured</label>
                                </div>
                            </div>

                            {/* Image card */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
                                <h2 className="font-semibold text-neutral-900 text-sm">Primary Image</h2>
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full aspect-square object-contain rounded-lg border border-neutral-100 bg-neutral-50 p-2"
                                            onError={() => setImagePreview('')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(''); set('primary_image_url', '') }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                                        >
                                            <X className="h-3 w-3 text-neutral-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-neutral-200 rounded-xl aspect-square flex flex-col items-center justify-center gap-2 text-neutral-400 bg-neutral-50">
                                        <Upload className="h-8 w-8" />
                                        <p className="text-xs text-center px-4">Paste image URL below</p>
                                    </div>
                                )}
                                <input
                                    type="url"
                                    value={form.primary_image_url}
                                    onChange={e => handleImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className={`${inputClass} text-xs`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-3 justify-end pb-6">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="px-5 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || success}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-neutral-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-60"
                        >
                            {isLoading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                            ) : (
                                <><Plus className="h-4 w-4" /> Create Product</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    )
}
