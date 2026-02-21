import { Star } from 'lucide-react'

const RED = '#E31E24'

const CompareSection = () => {
    const products = [
        {
            name: 'Microsoft Office 365',
            price: '1,599',
            rating: 4,
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_Office_logo_%282019%E2%80%93present%29.svg/1024px-Microsoft_Office_logo_%282019%E2%80%93present%29.svg.png'
        },
        {
            name: 'Google Workspace',
            price: '1,599',
            rating: 5,
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_Workspace_Logo.svg/1280px-Google_Workspace_Logo.svg.png'
        },
        {
            name: 'Zoho One',
            price: '5,999',
            rating: 4,
            logo: 'https://cdn.worldvectorlogo.com/logos/zoho-1.svg'
        },
    ]

    return (
        <section className="py-20 bg-[#f8fafc] border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="grid lg:grid-cols-12 gap-10 items-stretch">

                    {/* left col */}
                    <div className="lg:col-span-8">
                        <h2 className="text-3xl font-black text-gray-900 mb-10 tracking-tight uppercase italic">
                            Compare <span style={{ color: RED }}>Top Business Software</span>
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {products.map((p, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow h-full">
                                    <div className="w-16 h-16 rounded-xl mb-4 flex items-center justify-center p-2 bg-slate-50 border border-gray-100 flex-shrink-0">
                                        <img
                                            src={p.logo}
                                            alt={`${p.name} logo`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-2">{p.name}</h3>
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(5)].map((_, idx) => (
                                            <Star key={idx} className={`w-3 h-3 ${idx < p.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-100'}`} />
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-50 w-full">
                                        <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Starting at</p>
                                        <p className="text-xl font-black text-gray-900 mb-4 tracking-tighter">₹{p.price}</p>
                                        <button
                                            className="w-full py-2.5 bg-red-50 hover:bg-[#E31E24] hover:text-white rounded font-black text-[10px] uppercase tracking-widest transition-all"
                                            style={{ color: RED }}
                                        >
                                            Compare Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* right col */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl p-8 flex flex-col justify-center border border-gray-100 shadow-xl relative overflow-hidden h-full min-h-[300px]">
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10" style={{ background: RED }}></div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight tracking-tight">Buying for 10+ Employees?</h3>
                                <p className="text-gray-500 mb-8 font-medium leading-relaxed text-sm">Get custom pricing and dedicated support based on your business needs.</p>
                                <button
                                    className="text-white py-4 px-8 rounded font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg w-full md:w-fit active:scale-95"
                                    style={{ background: '#003399' }}
                                >
                                    Request Bulk Quote
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default CompareSection
