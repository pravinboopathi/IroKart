import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/context/CartContext';
import {
    Star,
    ShieldCheck,
    Truck,
    RotateCcw,
    CreditCard,
    ChevronRight,
    Plus,
    Minus,
    ShoppingCart,
    Zap,
    Cpu,
    Tag,
    Layers,
    Warehouse,
    Package
} from 'lucide-react';

export default function ProductDetail() {
    const { slug } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState('');
    const [isAdded, setIsAdded] = useState(false);

    useEffect(() => {
        if (!slug) return;

        setIsLoading(true);
        fetch(`/api/products/${slug}`)
            .then(r => r.json())
            .then(data => {
                if (!data.error) {
                    setProduct(data);
                    setActiveImage(data.primary_image_url || '');
                }
            })
            .catch(err => console.error("Fetch error:", err))
            .finally(() => setIsLoading(false));
    }, [slug]);

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            name: product.name,
            selling_price: product.selling_price,
            primary_image_url: product.primary_image_url,
            sku: product.sku,
            seller_id: product.seller_id,
            quantity: quantity
        } as any);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-12 animate-pulse">
                    <div className="grid lg:grid-cols-2 gap-16">
                        <div className="aspect-[4/3] bg-gray-100 rounded-3xl" />
                        <div className="space-y-6">
                            <div className="h-4 w-24 bg-gray-100 rounded" />
                            <div className="h-16 w-full bg-gray-100 rounded" />
                            <div className="h-32 w-full bg-gray-100 rounded" />
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                    <Package className="h-16 w-16 text-gray-200 mb-4" />
                    <h2 className="text-2xl font-black text-[#003399] uppercase italic tracking-tighter">Product Not Found</h2>
                    <p className="text-gray-500 mt-2 mb-6">The item you are looking for might have been moved or deleted.</p>
                    <Link to="/products" className="bg-[#E31E24] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                        Back to Products
                    </Link>
                </div>
            </MainLayout>
        );
    }

    // Dynamic data processing
    const discountPercent = product.compare_at_price
        ? Math.round((1 - product.selling_price / product.compare_at_price) * 100)
        : 0;

    const specs = [
        { label: 'SKU', value: product.sku || 'N/A', icon: Tag },
        { label: 'Category', value: product.categories?.name || 'Uncategorized', icon: Layers },
        { label: 'Stock Status', value: product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock', icon: Warehouse },
        { label: 'Condition', value: 'New / Genuine', icon: Cpu },
    ];

    const allImages = [
        product.primary_image_url,
        ...(product.product_images?.filter((img: any) => !img.is_primary).map((img: any) => img.image_url) || [])
    ].filter(Boolean);

    return (
        <MainLayout>
            <div className="bg-white font-sans">
                {/* Breadcrumbs */}
                <div className="bg-gray-50 border-b border-gray-100 py-4">
                    <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest overflow-hidden">
                        <Link to="/" className="hover:text-[#E31E24] whitespace-nowrap">Home</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <Link to="/products" className="hover:text-[#E31E24] whitespace-nowrap">Products</Link>
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="text-[#003399] truncate font-black">{product.name}</span>
                    </div>
                </div>

                <main className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-12">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Image Gallery */}
                        <div className="space-y-6">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-8 group relative">
                                {discountPercent > 0 && (
                                    <div className="absolute top-6 right-6 bg-[#E31E24] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                                        -{discountPercent}% OFF
                                    </div>
                                )}
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {allImages.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                    {allImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(img)}
                                            className={`w-24 h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 bg-gray-50 transition-all p-2 flex items-center justify-center ${activeImage === img ? 'border-[#E31E24] shadow-md -translate-y-1' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <img src={img} alt={`Gallery ${i}`} className="max-w-full max-h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="flex flex-col">
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-2 bg-red-50 text-[#E31E24] px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-4 border border-red-100">
                                    <Zap className="w-3 h-3 fill-[#E31E24]" />
                                    {product.product_type === 'digital' ? 'Instant Activation' : 'Premium Hardware'}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-[#003399] tracking-tighter uppercase italic leading-tight mb-4">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-100'}`} />
                                        ))}
                                    </div>
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                        High Reliability Rating
                                    </span>
                                </div>
                            </div>

                            <div className="mb-10 p-8 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="text-5xl font-black text-gray-900 tracking-tighter">₹{product.selling_price?.toLocaleString('en-IN')}</span>
                                    {product.compare_at_price > product.selling_price && (
                                        <span className="text-xl text-gray-400 line-through font-bold">₹{product.compare_at_price?.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">In Stock & Ready to ship</span>
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest ml-2">Includes GST Billing</span>
                                </div>
                            </div>

                            <div className="mb-10 p-6 border-l-4 border-[#003399] bg-blue-50/30 rounded-r-3xl">
                                <p className="text-gray-600 text-sm font-bold leading-relaxed">
                                    {product.short_description || product.description?.substring(0, 150) + '...'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-10">
                                {specs.map((spec, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <spec.icon className="w-5 h-5 text-[#003399]" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{spec.label}</h4>
                                            <p className="text-xs font-black text-gray-800 leading-tight">{spec.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto space-y-6">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                                    <div className="flex items-center border-2 border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden h-14">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-5 hover:bg-gray-50 text-gray-400 hover:text-[#E31E24] transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-10 text-center font-black text-lg text-[#003399]">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-5 hover:bg-gray-50 text-gray-400 hover:text-[#E31E24] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-grow flex gap-4 h-14">
                                        <button
                                            onClick={handleAddToCart}
                                            className={`flex-grow ${isAdded ? 'bg-green-600' : 'bg-[#003399] hover:bg-[#00287a]'} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 active:scale-95`}
                                        >
                                            <ShoppingCart className="w-4 h-4" /> {isAdded ? 'Added to Cart' : 'Add to Cart'}
                                        </button>
                                        <button className="flex-grow bg-[#E31E24] hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-900/10 active:scale-95">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <Truck className="w-5 h-5 text-green-500" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight italic">Fast Shipping</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-500" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight italic">Secure SSL</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <RotateCcw className="w-5 h-5 text-green-500" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight italic">Genuine Item</span>
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <CreditCard className="w-5 h-5 text-green-500" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight italic">GST Invoicing</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Features */}
                    <div className="mt-24">
                        <div className="border-b border-gray-100 mb-12 flex items-center gap-12 text-xs font-black uppercase tracking-widest overflow-x-auto no-scrollbar whitespace-nowrap">
                            <button className="pb-6 border-b-4 border-[#E31E24] text-[#E31E24] italic">Full Description</button>
                            <button className="pb-6 text-gray-400 hover:text-[#003399] italic transition-colors">Specifications</button>
                            <button className="pb-6 text-gray-400 hover:text-[#003399] italic transition-colors">User Feedback</button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            <div className="space-y-8">
                                <h2 className="text-4xl font-black text-[#003399] tracking-tighter uppercase italic leading-[0.9]">
                                    Engineered for <br /> <span className="text-[#E31E24]">Professional Edge.</span>
                                </h2>
                                <p className="text-gray-600 font-bold text-sm leading-relaxed border-l-2 border-gray-200 pl-6">
                                    {product.description || 'Our solutions are trusted by thousands of businesses worldwide. Whether you are looking for top-tier hardware or mission-critical software, IROKart delivers premium performance. This product has been rigorously tested to meet industrial standards.'}
                                </p>
                            </div>
                            <div className="rounded-[40px] overflow-hidden shadow-2xl bg-gray-50 border border-gray-100 p-12 group transition-all duration-500 hover:shadow-red-900/5">
                                <img src={allImages[0]} alt="Product focus" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </MainLayout>
    );
}
