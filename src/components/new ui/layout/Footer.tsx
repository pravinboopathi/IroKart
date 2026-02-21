import { Link } from "react-router-dom"
import { Package } from "lucide-react"

const Footer = () => {
    return (
        <footer className="w-full bg-[#111111] text-gray-300 py-16 px-4 md:px-8 border-t border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="flex flex-col">
                    <Link to="/" className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                            <Package className="w-5 h-5" />
                        </div>
                        <h3 className="text-white font-black text-2xl tracking-tighter">IroKart<span className="text-red-600">.</span></h3>
                    </Link>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6 pr-4">
                        Premium IT products, software, and accessories. Authorized dealer for the world's top tech brands.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-sm tracking-wider">INFORMATION</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><Link to="/about" className="hover:text-red-500 transition-colors">About Us</Link></li>
                        <li><Link to="/delivery" className="hover:text-red-500 transition-colors">Delivery Information</Link></li>
                        <li><Link to="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-red-500 transition-colors">Terms & Conditions</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-sm tracking-wider">CUSTOMER SERVICE</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><Link to="/contact" className="hover:text-red-500 transition-colors">Contact Us</Link></li>
                        <li><Link to="/returns" className="hover:text-red-500 transition-colors">Returns</Link></li>
                        <li><Link to="/sitemap" className="hover:text-red-500 transition-colors">Site Map</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-sm tracking-wider">MY ACCOUNT</h4>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><Link to="/profile" className="hover:text-red-500 transition-colors">My Profile</Link></li>
                        <li><Link to="/orders" className="hover:text-red-500 transition-colors">Order History</Link></li>
                        <li><Link to="/wishlist" className="hover:text-red-500 transition-colors">Wish List</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                <div>&copy; {new Date().getFullYear()} IroKart. All Rights Reserved.</div>
                <div className="flex gap-4">
                    {/* Placeholder for payment methods */}
                    <span className="bg-white/10 px-2 py-1 rounded">Visa</span>
                    <span className="bg-white/10 px-2 py-1 rounded">MasterCard</span>
                    <span className="bg-white/10 px-2 py-1 rounded">UPI</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer
