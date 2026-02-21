import { Link } from "react-router-dom"

const PromoBanners = () => {
    return (
        <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
            <Link to="/products?category=hardware" className="block w-full overflow-hidden rounded-2xl group relative bg-[#111] aspect-[21/9] md:aspect-[6/1] shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-[#1a1a1a] to-gray-900 z-0 opacity-90"></div>

                {/* Animated accent gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#E31E24]/10 to-transparent z-0 transition-opacity group-hover:opacity-30"></div>

                <div className="absolute inset-0 z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-20 gap-4 text-center md:text-left">
                    <div className="text-white transform group-hover:-translate-y-1 transition-transform duration-500">
                        <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter mb-1 uppercase">
                            Performance <span className="text-[#E31E24]">Essentials</span>
                        </h3>
                        <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                            Curated hardware for the modern workspace.
                        </p>
                    </div>

                    <button className="bg-white text-black px-8 py-3 rounded font-black text-[10px] uppercase tracking-widest hover:bg-[#E31E24] hover:text-white transition-all transform group-hover:scale-105 active:scale-95 shadow-lg">
                        Shop Collection &rarr;
                    </button>
                </div>

                {/* Abstract glow */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-[#E31E24] opacity-5 blur-[100px] group-hover:opacity-10 transition-opacity"></div>
            </Link>
        </section>
    )
}

export default PromoBanners
