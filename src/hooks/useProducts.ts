import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Product, ProductStatus } from '@/lib/types'

export function useProducts(isAdmin = false) {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProducts = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            // Use the view that already joins inventory + primary image
            const { data, error } = await supabase
                .from('v_products_with_stock')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                // Fallback to raw products table if view fails (e.g., schema not yet applied)
                const fallback = await supabase
                    .from('products')
                    .select(`
            *,
            product_images (image_url, is_primary)
          `)
                    .order('created_at', { ascending: false })
                if (fallback.error) throw fallback.error
                setProducts((fallback.data || []).map(p => ({
                    ...p,
                    primary_image_url: p.product_images?.find((img: any) => img.is_primary)?.image_url,
                })) as Product[])
                return
            }
            setProducts((data as Product[]) || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [isAdmin])

    useEffect(() => {
        fetchProducts()

        const channel = supabase
            .channel('products-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                fetchProducts()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
                fetchProducts()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchProducts])

    const updateProduct = async (productId: string, updates: Partial<Product>) => {
        const { error } = await supabase
            .from('products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', productId)
        if (error) throw error
    }

    const updateProductStatus = async (productId: string, status: ProductStatus) => {
        return updateProduct(productId, { product_status: status })
    }

    const deleteProduct = async (productId: string) => {
        return updateProduct(productId, { is_active: false })
    }

    return { products, isLoading, error, refetch: fetchProducts, updateProduct, updateProductStatus, deleteProduct }
}
