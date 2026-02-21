import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Package, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const RED = '#E31E24'

export interface ProductData {
    id: string
    slug?: string
    title: string
    image: string
    price: number
    originalPrice?: number
    discountPercent?: number
    selling_price?: number
    sku?: string
    primary_image_url?: string
    seller_id?: string
    product_type?: 'physical' | 'digital'
    category_slug?: string
}

interface ProductCardProps {
    product: ProductData
}

const ProductCard = ({ product }: ProductCardProps) => {
    const [added, setAdded] = useState(false)
    const { addToCart } = useCart()

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart({
            id: product.id,
            name: product.title,
            selling_price: product.selling_price ?? product.price,
            primary_image_url: product.primary_image_url || product.image || null,
            sku: product.sku || null,
            seller_id: product.seller_id || null,
        } as any)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }

    const productLink = `/products/${product.slug || product.id}`

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(227,30,36,0.08)] transition-all duration-300 border border-gray-100 p-5 group flex flex-col items-center text-center relative overflow-hidden h-full">

            {/* Discount badge */}
            {product.discountPercent && (
                <div className="absolute top-3 right-3 text-white text-[10px] font-black px-2 py-1 rounded-full z-10"
                    style={{ background: RED }}>
                    -{product.discountPercent}%
                </div>
            )}

            <Link to={productLink} className="w-full flex flex-col items-center">
                {/* Image area */}
                <div className="h-40 w-full flex items-center justify-center p-3 mb-3 bg-gray-50/60 rounded-xl">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    ) : (
                        <Package className="h-14 w-14 text-gray-200" />
                    )}
                </div>

                {/* Dots indicator */}
                <div className="flex gap-1.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${RED}4D` }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-bold text-gray-800 tracking-tight group-hover:text-red-600 transition-colors line-clamp-2 mb-1 leading-snug w-full">
                    {product.title}
                </h3>

                {/* Price */}
                <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-widest">Starting at</p>
                <div className="flex items-baseline gap-2 mb-4">
                    <p className="text-xl font-black tracking-tight text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                </div>
            </Link>

            {/* Add to cart button */}
            <button
                onClick={handleAddToCart}
                className={cn(
                    'w-full mt-auto py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm',
                    added
                        ? 'bg-green-500 text-white'
                        : 'text-white hover:opacity-90 active:scale-95'
                )}
                style={added ? {} : { background: RED }}
            >
                {added ? (
                    '✓ Added to Cart'
                ) : (
                    <><ShoppingCart className="w-4 h-4" /> Add to Cart</>
                )}
            </button>
        </div>
    )
}

export default ProductCard
