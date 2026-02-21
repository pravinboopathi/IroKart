import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductCard = ({ id, type, title, price, image, rating, badge, buttonText }) => {
    const isSoftware = type === 'software';
    const slug = id || title.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(227,30,36,0.08)] transition-all duration-300 border border-gray-100 p-5 group flex flex-col items-center text-center relative overflow-hidden h-full">
            <Link to={`/products/${slug}`} className="w-full">
                <div className="relative mb-6 w-full flex flex-col items-center">
                    {image ? (
                        <div className="h-40 w-full flex items-center justify-center p-2 mb-2 bg-gray-50/50 rounded-xl">
                            <img src={image} alt={title} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    ) : (
                        <div className="h-40 w-full bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 font-bold mb-2">
                            {title}
                        </div>
                    )}

                    {/* Dots indicator simulation from screenshot */}
                    <div className="flex gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E31E24]/30"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                    </div>
                </div>

                <div className="flex-grow w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {isSoftware && (
                            <div className="p-1 bg-green-50 rounded-full">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        <h3 className="text-[15px] font-bold text-gray-800 tracking-tight group-hover:text-[#E31E24] transition-colors line-clamp-1">{title}</h3>
                    </div>

                    {isSoftware && (
                        <div className="flex items-center justify-center gap-0.5 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${i < (rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-100'}`}
                                />
                            ))}
                        </div>
                    )}

                    <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-widest">Starting at</p>
                    <p className="text-xl text-gray-900 mb-4 tracking-tight">₹{price}</p>
                </div>
            </Link>

            {badge && (
                <div className="bg-red-50 text-[#E31E24] text-[10px] font-black px-3 py-1.5 rounded border border-red-100 mb-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E31E24]"></span>
                    {badge}
                </div>
            )}

            <Link to={`/products/${slug}`} className="w-full mt-auto">
                <button className={`w-full py-2.5 rounded shadow-sm font-black text-xs uppercase tracking-widest transition-all ${isSoftware
                    ? 'bg-[#E31E24] text-white hover:bg-red-700 hover:shadow-red-200'
                    : 'bg-[#003399]/10 text-[#003399] hover:bg-[#003399]/20'
                    }`}>
                    {buttonText || (isSoftware ? 'Buy License >' : 'View Details >')}
                </button>
            </Link>
        </div>
    );
};

export default ProductCard;
