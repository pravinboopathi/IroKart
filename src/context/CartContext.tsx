import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Product } from '@/lib/types'

interface CartItem {
    product: Product
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    addToCart: (product: Product, qty?: number) => void
    removeFromCart: (productId: string) => void
    updateQty: (productId: string, qty: number) => void
    clearCart: () => void
    total: number
    itemCount: number
}

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    updateQty: () => { },
    clearCart: () => { },
    total: 0,
    itemCount: 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('iro_cart') || '[]')
        } catch { return [] }
    })

    useEffect(() => {
        localStorage.setItem('iro_cart', JSON.stringify(items))
    }, [items])

    const addToCart = (product: Product, qty = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id)
            if (existing) {
                return prev.map(i => i.product.id === product.id
                    ? { ...i, quantity: i.quantity + qty }
                    : i
                )
            }
            return [...prev, { product, quantity: qty }]
        })
    }

    const removeFromCart = (productId: string) =>
        setItems(prev => prev.filter(i => i.product.id !== productId))

    const updateQty = (productId: string, qty: number) => {
        if (qty <= 0) { removeFromCart(productId); return }
        setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
    }

    const clearCart = () => setItems([])

    const total = items.reduce((s, i) => s + i.product.selling_price * i.quantity, 0)
    const itemCount = items.reduce((s, i) => s + i.quantity, 0)

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
