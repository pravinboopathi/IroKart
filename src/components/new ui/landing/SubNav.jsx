import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Monitor, Cpu, Package, Repeat, HelpCircle, User, ChevronDown, Menu, X } from 'lucide-react';

const SubNav = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const currentCategory = queryParams.get('category');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const items = [
        { icon: Monitor, label: 'Hardware', path: '/products?category=hardware', id: 'hardware' },
        { icon: Cpu, label: 'Software', path: '/products?category=software', id: 'software' },
        { icon: Package, label: 'Bulk Deals', path: '/bulk-deals', id: 'bulk' },
        { icon: Repeat, label: 'Compare', path: '/compare', id: 'compare' },
        { icon: HelpCircle, label: 'Support', path: '/support', id: 'support' },
    ];

    const isHome = location.pathname === '/';

    return (
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 md:top-[61.5px] z-40">
            <div className="container mx-auto px-4 md:px-12">
                <div className="flex items-center justify-between">
                    {/* Desktop & Tablet Horizontal Scroll Navigation */}
                    <div className="flex items-center overflow-x-auto no-scrollbar flex-grow">
                        {items.map((item) => {
                            const isActive = (isHome && item.id === 'hardware') ||
                                currentCategory === item.id ||
                                location.pathname === item.path;

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-4 md:py-5 text-gray-700 hover:text-[#E31E24] transition-all whitespace-nowrap group relative ${isActive ? 'bg-gray-50/50' : ''}`}
                                >
                                    <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-[#E31E24]' : 'text-gray-400'} group-hover:scale-110 group-hover:text-[#E31E24] transition-all`} />
                                    <span className={`font-bold text-[12px] md:text-[14px] tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#E31E24]"></div>}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop Login Link */}
                    <div className="hidden sm:flex items-center">
                        <Link to="/sign-in" className="flex items-center gap-3 text-gray-700 hover:text-[#E31E24] transition-colors cursor-pointer group ml-4 md:ml-8 py-4 md:py-5 px-4 md:px-6 border-l border-gray-100">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-[#E31E24]" />
                            </div>
                            <span className="font-bold text-[12px] md:text-[14px] whitespace-nowrap text-gray-800 hidden md:block">Login / Register</span>
                            <ChevronDown className="w-4 h-4 opacity-30 ml-1 group-hover:translate-y-0.5 transition-transform hidden md:block" />
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="sm:hidden p-4 text-gray-600 hover:text-[#E31E24]"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-top duration-300">
                    <div className="flex flex-col py-4">
                        {items.map((item) => {
                            const isActive = (isHome && item.id === 'hardware') ||
                                currentCategory === item.id ||
                                location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${isActive ? 'bg-red-50 text-[#E31E24]' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#E31E24]' : 'text-gray-400'}`} />
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                        <div className="mt-4 pt-4 border-t border-gray-100 px-6">
                            <Link
                                to="/sign-in"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-4 py-4 text-[#E31E24]"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="font-black text-sm uppercase tracking-widest">Login / Register</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubNav;
