import { Link } from 'react-router-dom';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { useRef } from "react"
import Autoplay from "embla-carousel-autoplay"

const HeroSlider = () => {
    const plugin = useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    const slides = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=1600&h=600",
            title: "Logitech Leads the tech revolution",
            subtitle: "From boardrooms To battlestations",
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=1600&h=600",
            title: "Next Gen Processors",
            subtitle: "Unleash Ultimate Performance",
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=1600&h=600",
            title: "Premium Accessories",
            subtitle: "Elevate Your Workspace setup",
        }
    ]

    return (
        <div className="w-full relative group">
            <Carousel
                plugins={[plugin.current]}
                className="w-full max-w-[1600px] overflow-hidden rounded-sm"
                opts={{
                    loop: true,
                }}
            >
                <CarouselContent>
                    {slides.map((slide) => (
                        <CarouselItem key={slide.id}>
                            <div className="relative aspect-[21/9] md:aspect-[3/1] w-full">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-24 bg-gradient-to-r from-black/80 to-transparent">
                                    <h2 className="text-white text-2xl md:text-5xl lg:text-7xl font-bold mb-2 tracking-tight">
                                        {slide.title}
                                    </h2>
                                    <p className="text-gray-300 text-sm md:text-xl lg:text-3xl font-medium tracking-wide mb-8">
                                        {slide.subtitle}
                                    </p>
                                    <Link to="/products">
                                        <button className="bg-[#E31E24] hover:bg-red-700 text-white px-8 py-3 rounded font-black text-xs uppercase tracking-widest transition-all w-fit shadow-lg shadow-red-900/20 active:scale-95">
                                            Shop Now
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 border-none text-white hover:bg-black/80" />
                <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 border-none text-white hover:bg-black/80" />
            </Carousel>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map(s => (
                    <div key={`dot-${s.id}`} className="h-1 w-8 bg-white/50 rounded-full cursor-pointer hover:bg-white transition-colors" />
                ))}
            </div>
        </div>
    )
}

export default HeroSlider
