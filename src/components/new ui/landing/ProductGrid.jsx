import React from 'react';
import ProductCard from './ProductCard.jsx';
import { products } from '@/data/productData';

const ProductGrid = () => {
    const hardware = products.filter(p => p.type === 'hardware').slice(0, 8);
    const software = products.filter(p => p.type === 'software').slice(0, 8);

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-6 md:px-12 space-y-20">
                {/* Hardware Section */}
                <div>
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-3xl font-black text-[#003399] tracking-tighter uppercase italic">Next-Gen Hardware</h2>
                        <a href="/products" className="flex items-center gap-1.5 text-[#E31E24] font-bold text-sm hover:underline uppercase tracking-widest">
                            Browse All <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"></path></svg>
                        </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {hardware.map((item, i) => (
                            <ProductCard key={item.id} type="hardware" {...item} />
                        ))}
                    </div>
                </div>

                {/* Software Section */}
                <div>
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-3xl font-black text-[#003399] tracking-tighter uppercase italic">Essential Software</h2>
                        <a href="/products" className="flex items-center gap-1.5 text-[#E31E24] font-bold text-sm hover:underline uppercase tracking-widest">
                            Browse All <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"></path></svg>
                        </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {software.map((item, i) => (
                            <ProductCard key={item.id} type="software" {...item} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductGrid;
