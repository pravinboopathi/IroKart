import React from 'react';

const Hero = () => {
    return (
        <section className="relative bg-[#f8fafc] overflow-hidden py-16 md:py-24 border-b border-gray-100">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                    <h1 className="text-5xl md:text-7xl font-[900] text-[#111827] leading-[1.1] mb-8 tracking-tighter">
                        Hardware & Software. <br />
                        <span className="text-blue-600">Simplified.</span>
                    </h1>
                    <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed font-medium capitalize">
                        Bulk pricing. Instant license delivery. Business-ready IT solutions.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button className="bg-[#1e40af] hover:bg-blue-800 text-white px-8 py-4 rounded font-bold transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider">
                            Explore Hardware
                        </button>
                        <button className="bg-[#65a34a] hover:bg-green-700 text-white px-8 py-4 rounded font-bold transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider">
                            Explore Software
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -top-10 -right-10 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl"></div>
                    <div className="relative bg-white p-2 rounded-xl shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500">
                        <img
                            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1000"
                            alt="IT Infrastructure"
                            className="rounded-lg w-full h-auto"
                        />
                        {/* Hardware Floaties (Simplified) */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-xl border border-gray-50 max-w-[180px]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-400">PC</div>
                                <div className="text-[10px] font-bold text-gray-800">Business-Ready Systems</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
