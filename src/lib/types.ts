// ============================================================
// TypeScript interfaces derived from the Supabase SQL schema
// ============================================================

export type UserType = 'individual' | 'company_buyer' | 'wholesaler' | 'retailer' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'pending_verification'
export type OrderStatus =
    | 'pending' | 'confirmed' | 'processing' | 'shipped'
    | 'out_for_delivery' | 'delivered' | 'cancelled'
    | 'return_requested' | 'returned' | 'refunded'
export type PaymentStatus = 'pending' | 'initiated' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'discontinued'
export type ProductType = 'physical' | 'digital'
export type FulfillmentStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled' | 'returned'

export interface Profile {
    id: string
    full_name: string
    display_name?: string
    email?: string
    phone?: string
    avatar_url?: string
    user_type: UserType
    account_status: AccountStatus
    is_seller: boolean
    is_email_verified: boolean
    is_phone_verified: boolean
    last_login_at?: string
    login_count: number
    created_at: string
    updated_at: string
}

export interface Category {
    id: string
    parent_id?: string
    name: string
    slug: string
    description?: string
    image_url?: string
    icon?: string
    sort_order: number
    is_active: boolean
    created_at: string
}

export interface Product {
    id: string
    seller_id: string
    category_id: string
    name: string
    slug: string
    short_description?: string
    description?: string
    specifications?: Record<string, any>
    product_type: ProductType
    sku?: string
    cost_price: number
    selling_price: number
    compare_at_price?: number
    tax_rate: number
    product_status: ProductStatus
    is_featured: boolean
    is_active: boolean
    rating?: number
    review_count: number
    view_count: number
    purchase_count: number
    created_at: string
    updated_at: string
    // Joined fields
    primary_image_url?: string
    stock_quantity?: number
    available_quantity?: number
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
    category?: Category
}

export interface ProductImage {
    id: string
    product_id: string
    image_url: string
    alt_text?: string
    is_primary: boolean
    sort_order: number
    created_at: string
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: string
    variant_id?: string
    seller_id: string
    product_name: string
    product_sku?: string
    variant_details?: Record<string, any>
    product_image_url?: string
    quantity: number
    unit_price: number
    cost_price: number
    discount_amount: number
    tax_amount: number
    total_price: number
    item_type: ProductType
    fulfillment_status: FulfillmentStatus
    download_url?: string
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    order_number: string
    profile_id: string
    order_type: string
    shipping_address_snapshot?: Record<string, any>
    billing_address_snapshot?: Record<string, any>
    subtotal: number
    discount_amount: number
    tax_amount: number
    shipping_amount: number
    total_amount: number
    order_status: OrderStatus
    payment_status: PaymentStatus
    customer_note?: string
    admin_note?: string
    tracking_number?: string
    courier_company?: string
    estimated_delivery?: string
    delivered_at?: string
    created_at: string
    updated_at: string
    // Joined
    order_items?: OrderItem[]
    profile?: Pick<Profile, 'full_name' | 'email' | 'phone' | 'user_type'>
}

export interface AdminStats {
    total_revenue: number
    orders_today: number
    total_orders: number
    pending_orders: number
    total_users: number
    total_products: number
    low_stock_products: number
    revenue_this_month: number
}

export interface Notification {
    id: string
    profile_id: string
    notification_type: string
    title: string
    message: string
    action_url?: string
    metadata?: Record<string, any>
    is_read: boolean
    read_at?: string
    created_at: string
}
