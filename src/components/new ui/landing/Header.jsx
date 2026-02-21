import React from 'react';
import { Search, ShoppingCart, ChevronDown } from 'lucide-react';
import logo from '@/assets/logo.png';

const Header = () => {
    return (
        <header className="bg-white py-2 px-6 md:px-12 flex items-center justify-between border-b sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-2">
                <a href="/" className="flex items-center gap-3 group">
                    <img
                        src={logo}
                        alt="IROKart Logo"
                        className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                    />

                </a>
            </div>

            <nav className="hidden lg:flex items-center gap-10">
                {['Hardware', 'Software', 'Bulk Deals', 'Compare', 'Support'].map((item) => (
                    <a
                        key={item}
                        href="/products"
                        className="text-gray-600 hover:text-[#E31E24] font-semibold text-sm flex items-center gap-1 transition-colors"
                    >
                        {item} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </a>
                ))}
            </nav>

            <div className="flex items-center gap-5">
                <button className="text-gray-500 hover:text-[#E31E24] transition-colors p-1.5 hover:bg-gray-50 rounded-full">
                    <Search className="w-5 h-5" />
                </button>
                <button className="text-gray-500 hover:text-[#E31E24] transition-colors relative p-1.5 hover:bg-gray-50 rounded-full">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute top-0 right-0 bg-[#E31E24] text-white text-[9px] font-bold px-1 py-0.5 min-w-[16px] flex items-center justify-center rounded-full border border-white">
                        0
                    </span>
                </button>
            </div>
        </header>
    );
};

export default Header;
