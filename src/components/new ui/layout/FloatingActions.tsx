import { Link } from "react-router-dom"
import { Facebook, MessageCircle, ShoppingCart, User, Search, Eye } from "lucide-react"

const FloatingActions = () => {
    return (
        <>
            {/* Left side fixed items */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white w-10 h-10 flex items-center justify-center shadow-md rounded-r-md transition-transform hover:translate-x-1">
                    <Facebook className="w-5 h-5 fill-current" />
                </a>
            </div>

            {/* Floating WhatsApp bottom left */}
            <div className="fixed left-6 bottom-6 z-50">
                <a href="https://wa.me/something" target="_blank" rel="noreferrer" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 border-4 border-[#25D366]/30">
                    <MessageCircle className="w-8 h-8" />
                </a>
            </div>

            {/* Right side toolbar fixed */}
            <div className="fixed right-0 top-1/4 flex flex-col z-50 overflow-hidden rounded-l-md shadow-lg">
                {/* Mobile menu toggle (red) */}
                <button className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 flex items-center justify-center transition-colors">
                    <div className="space-y-1">
                        <span className="block w-5 h-0.5 bg-white"></span>
                        <span className="block w-5 h-0.5 bg-white"></span>
                        <span className="block w-5 h-0.5 bg-white"></span>
                    </div>
                </button>
                {/* Cart */}
                <Link to="/cart" className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 flex items-center justify-center border-t border-red-500 transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                </Link>
                {/* User */}
                <Link to="/sign-in" className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 flex items-center justify-center border-t border-red-500 transition-colors">
                    <User className="w-4 h-4" />
                </Link>
                {/* Search toggle */}
                <button className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 flex items-center justify-center border-t border-red-500 transition-colors">
                    <Search className="w-4 h-4" />
                </button>
                {/* Recent view / eye */}
                <button className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 flex items-center justify-center border-t border-red-500 transition-colors">
                    <Eye className="w-4 h-4" />
                </button>
            </div>
        </>
    )
}

export default FloatingActions
