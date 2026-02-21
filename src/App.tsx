import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"

// Public pages
import Landing from "@/pages/Landing"
import SignIn from "@/pages/SignIn"
import SignUp from "@/pages/SignUp"
import NotFound from "@/pages/NotFound"

// Buyer pages
import Products from "@/pages/Products"
import ProductDetail from "@/pages/ProductDetail"
import Cart from "@/pages/Cart"
import Checkout from "@/pages/Checkout"
import OrderConfirmation from "@/pages/OrderConfirmation"
import Orders from "@/pages/Orders"
import Wishlist from "@/pages/Wishlist"
import Profile from "@/pages/Profile"

// Seller portal pages
import SellerDashboard from "@/pages/seller/SellerDashboard"
import SellerProducts from "@/pages/seller/SellerProducts"
import SellerOrders from "@/pages/seller/SellerOrders"
import SellerInventory from "@/pages/seller/SellerInventory"
import SellerPayouts from "@/pages/seller/SellerPayouts"

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminProducts from "@/pages/admin/AdminProducts"
import AdminOrders from "@/pages/admin/AdminOrders"
import AdminCreateProduct from "@/pages/admin/AdminCreateProduct"

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* ── Product Catalog ── */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />

        {/* ── Buyer (authenticated) ── */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:orderId/confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ── Seller Portal ── */}
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/seller/dashboard" element={<SellerDashboard />} />
        <Route path="/seller/products" element={<SellerProducts />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/seller/inventory" element={<SellerInventory />} />
        <Route path="/seller/payouts" element={<SellerPayouts />} />

        {/* ── Admin Panel (admin-only) ── */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/products/new" element={<ProtectedRoute requireAdmin><AdminCreateProduct /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
