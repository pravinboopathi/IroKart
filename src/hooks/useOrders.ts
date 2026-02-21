import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Order, OrderStatus } from '@/lib/types'

export function useOrders(profileId?: string, isAdmin = false) {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const url = isAdmin
                ? `/api/orders?limit=200`
                : `/api/orders/my?uid=${profileId}`

            if (!isAdmin && !profileId) {
                setOrders([])
                setIsLoading(false)
                return
            }

            const res = await fetch(url)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to fetch orders')

            setOrders(data.orders || [])
        } catch (err: any) {
            console.error('useOrders hook error:', err)
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [profileId, isAdmin])

    useEffect(() => {
        fetchOrders()

        // ── Real-time subscription ──────────────────────────────
        // Subscribe to changes so DB edits reflect immediately
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    ...((!isAdmin && profileId) ? { filter: `profile_id=eq.${profileId}` } : {}),
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setOrders(prev =>
                            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
                        )
                    } else if (payload.eventType === 'INSERT') {
                        fetchOrders() // Refetch to get joined data
                    } else if (payload.eventType === 'DELETE') {
                        setOrders(prev => prev.filter(o => o.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchOrders, profileId, isAdmin])

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ order_status: status, updated_at: new Date().toISOString() })
            .eq('id', orderId)
        if (error) throw error
    }

    return { orders, isLoading, error, refetch: fetchOrders, updateOrderStatus }
}
