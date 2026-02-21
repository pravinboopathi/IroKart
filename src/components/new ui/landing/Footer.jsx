import React from 'react';
import { Facebook, Twitter, Linkedin, Youtube, ShieldCheck, CreditCard, Zap, Percent, FileText, ClipboardList, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
    return (
        <footer className="bg-[#0f172a] text-white pt-20 pb-10">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16 pb-16 border-b border-white/10">
                    {/* Brand Section */}
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-3 mb-8">
                            <img
                                src={logo}
                                alt="IROKart Logo"
                                className="h-12 w-auto object-contain brightness-110 contrast-125"
                            />
                        </div>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 max-w-sm">
                            Your trusted destination for premium hardware and essential software. We provide business-ready IT solutions with instant delivery and bulk pricing advantages.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-400">
                                <MapPin className="w-5 h-5 text-[#E31E24]" />
                                <span className="text-sm font-bold">123 Tech Square, IT Hub, India</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Phone className="w-5 h-5 text-[#E31E24]" />
                                <span className="text-sm font-bold">+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <Mail className="w-5 h-5 text-[#E31E24]" />
                                <span className="text-sm font-bold">support@irokart.com</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
                                Categories
                                <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#E31E24]"></span>
                            </h4>
                            <ul className="space-y-4">
                                {['Laptops', 'Desktop PC', 'Graphics Cards', 'Processors', 'Storage'].map(item => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-[#E31E24] transition-colors text-sm font-bold flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-[#E31E24] mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
                                Quick Links
                                <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#E31E24]"></span>
                            </h4>
                            <ul className="space-y-4">
                                {['Bulk Deals', 'Compare Software', 'Support Page', 'Order Tracking', 'Wishlist'].map(item => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-[#E31E24] transition-colors text-sm font-bold flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-[#E31E24] mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 relative inline-block">
                                Legal & Trust
                                <span className="absolute -bottom-2 left-0 w-8 h-[2px] bg-[#E31E24]"></span>
                            </h4>
                            <ul className="space-y-4">
                                {['Privacy Policy', 'Terms of Use', 'Returns Policy', 'GST Details', 'Vendor Partner'].map(item => (
                                    <li key={item}>
                                        <a href="#" className="text-gray-400 hover:text-[#E31E24] transition-colors text-sm font-bold flex items-center group">
                                            <span className="w-0 group-hover:w-2 h-[1px] bg-[#E31E24] mr-0 group-hover:mr-2 transition-all"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Values & Social Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-8">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-lg border border-white/10">
                            <ShieldCheck className="w-5 h-5 text-[#E31E24]" />
                            <span className="text-[11px] font-black uppercase tracking-wider">GST Billing</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-lg border border-white/10">
                            <Zap className="w-5 h-5 text-[#E31E24]" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Instant Delivery</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-lg border border-white/10">
                            <Percent className="w-5 h-5 text-[#E31E24]" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Bulk Savings</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center lg:items-end gap-6">
                        <div className="flex items-center gap-4">
                            {[Facebook, Twitter, Linkedin, Youtube].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#E31E24] hover:text-white hover:border-[#E31E24] transition-all"
                                >
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">
                            © 2024 IROKart Online Shopping. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
