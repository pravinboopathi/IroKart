import { Link } from "react-router-dom"
import { Search, Heart, User, ShoppingCart, Menu, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const Navbar = () => {
    return (
        <header className="w-full flex flex-col border-b sticky top-0 bg-white z-40 shadow-sm transition-all">
            {/* Top Bar - Premium Light Theme */}
            <div className="w-full max-w-[1600px] mx-auto py-4 px-4 md:px-8 flex items-center justify-between gap-4 md:gap-8 bg-white h-20 md:h-24">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-md transform group-hover:-rotate-6 transition-transform">
                        <Package className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gray-900 leading-none">IroKart<span className="text-red-600">.</span></h1>
                        <p className="text-[10px] md:text-xs tracking-widest text-gray-500 font-medium mt-1 uppercase">Premium IT Store</p>
                    </div>
                </Link>

                {/* Search Bar - Hidden on small mobile, expanded on md and up */}
                <div className="hidden md:flex flex-1 max-w-2xl mx-auto relative group shadow-sm rounded-md hover:shadow-md transition-shadow">
                    <Input
                        className="w-full bg-gray-50 text-gray-900 border-gray-200 focus-visible:ring-red-600 focus-visible:border-red-600 pl-4 pr-12 h-12 rounded-l-md rounded-r-none text-base"
                        placeholder="Search for laptops, processors, accessories..."
                    />
                    <Button className="rounded-l-none h-12 bg-red-600 hover:bg-red-700 text-white px-6 rounded-r-md border-0 transition-colors">
                        <Search className="w-5 h-5" />
                    </Button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <Link to="/wishlist" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Heart className="w-5 h-5" />
                    </Link>
                    <Link to="/sign-in" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <User className="w-5 h-5" />
                    </Link>

                    <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2"></div>

                    <Link to="/cart" className="flex items-center gap-3 group px-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white group-hover:border-red-600 text-gray-800 transition-colors relative shadow-sm">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                0
                            </span>
                        </div>
                        <div className="hidden lg:flex flex-col">
                            <span className="text-xs text-gray-500 font-medium tracking-wide w-full max-w-[80px]">Total</span>
                            <span className="font-bold text-sm text-gray-900">₹0.00</span>
                        </div>
                    </Link>

                    <Button variant="ghost" size="icon" className="md:hidden text-gray-800 hover:bg-gray-100 border border-gray-200 ml-2">
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Category Navigation - Subtle Gray Bar */}
            <div className="bg-gray-50 border-t border-gray-100 hidden md:block w-full">
                <div className="max-w-[1600px] mx-auto flex items-center gap-8 px-8 h-12 text-sm font-semibold text-gray-600 overflow-x-auto">
                    <Link to="/" className="text-red-600 hover:text-red-700 h-full flex items-center border-b-2 border-red-600 shrink-0">Home</Link>
                    <Link to="/products?category=components" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">Computer Components ▾</Link>
                    <Link to="/products?category=mobile" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">Mobile Accessories ▾</Link>
                    <Link to="/products?category=security" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">Security Systems</Link>
                    <Link to="/products?brand=gaming" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">Gaming Hub ▾</Link>
                    <Link to="/products?category=software" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">Software</Link>
                    <Link to="/products?category=brands" className="hover:text-gray-900 transition-colors h-full flex items-center shrink-0">All Brands</Link>
                </div>
            </div>
        </header>
    )
}

export default Navbar
