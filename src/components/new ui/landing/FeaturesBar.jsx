import React from 'react';
import { ShieldCheck, CreditCard, Zap, Percent } from 'lucide-react';

const FeaturesBar = () => {
    const features = [
        { icon: ShieldCheck, text: 'GST Billing Available' },
        { icon: CreditCard, text: 'Secure Payment' },
        { icon: Zap, text: 'Instant License Delivery' },
        { icon: Percent, text: 'Bulk Discounts' },
    ];

    return (
        <div className="bg-red-50/20 border-y border-gray-100 py-10">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center justify-center gap-4 bg-white/50 py-4 px-6 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-[#E31E24] p-2 rounded flex items-center justify-center">
                                <f.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-extrabold text-gray-800 text-sm tracking-tight text-center md:text-left">{f.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesBar;
