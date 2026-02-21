import MainLayout from "@/components/layout/MainLayout"
import HeroSlider from "@/components/landing/HeroSlider"
import TopProductsSection from "@/components/landing/TopProductsSection"
import PromoBanners from "@/components/landing/PromoBanners"
import BestSellerSection from "@/components/landing/BestSellerSection"
import CompareSection from "@/components/landing/CompareSection"

const Landing = () => {
    return (
        <MainLayout>
            <div className="flex flex-col w-full bg-white">
                {/* Main Hero Section */}
                <div className="w-full">
                    <HeroSlider />
                </div>

                {/* Features & Top Products */}
                <TopProductsSection />

                {/* Mid-page Banner */}
                <PromoBanners />

                {/* Best Sellers */}
                <BestSellerSection />

                {/* Software Comparison & Bulk Quote */}
                <CompareSection />

                {/* Final CTA / Info Section — cleaner version */}
                <section className="bg-gray-50 border-t border-gray-100 py-20 px-6 md:px-12 mt-10">
                    <div className="w-full max-w-[1920px] mx-auto text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 italic uppercase">
                            Ready to Upgrade your <span className="text-[#E31E24]">IT Infrastructure?</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-lg mb-10 max-w-2xl mx-auto">
                            Authorized partner for leading hardware and software brands. GST billing and bulk discounts available.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a href="/products" className="bg-[#111111] hover:bg-black text-white px-10 py-4 rounded font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg">
                                Browse Products
                            </a>
                            <a href="/contact" className="bg-white border-2 border-gray-200 hover:border-red-500 text-gray-900 px-10 py-4 rounded font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95">
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    )
}

export default Landing
