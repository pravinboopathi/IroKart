import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { AdminStats } from '@/lib/types'

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        total_revenue: 0,
        orders_today: 0,
        total_orders: 0,
        pending_orders: 0,
        total_users: 0,
        total_products: 0,
        low_stock_products: 0,
        revenue_this_month: 0,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStats = async () => {
        setIsLoading(true)
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

            const [
                ordersRes,
                ordersToday,
                pendingOrders,
                usersRes,
                productsRes,
                lowStockRes,
                revenueRes,
                monthRevenueRes,
            ] = await Promise.all([
                supabase.from('orders').select('id', { count: 'exact', head: true }),
                supabase.from('orders').select('id', { count: 'exact', head: true })
                    .gte('created_at', today.toISOString()),
                supabase.from('orders').select('id', { count: 'exact', head: true })
                    .eq('order_status', 'pending'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('products').select('id', { count: 'exact', head: true })
                    .eq('is_active', true),
                // Products where stock <= low_stock_threshold (via inventory table)
                supabase.from('inventory').select('id', { count: 'exact', head: true })
                    .lte('quantity', 10),
                // Total revenue from captured payments
                supabase.from('orders').select('total_amount')
                    .eq('payment_status', 'captured'),
                supabase.from('orders').select('total_amount')
                    .eq('payment_status', 'captured')
                    .gte('created_at', monthStart.toISOString()),
            ])

            const totalRevenue = (revenueRes.data || []).reduce((s: number, o: any) => s + Number(o.total_amount), 0)
            const monthRevenue = (monthRevenueRes.data || []).reduce((s: number, o: any) => s + Number(o.total_amount), 0)

            setStats({
                total_orders: ordersRes.count || 0,
                orders_today: ordersToday.count || 0,
                pending_orders: pendingOrders.count || 0,
                total_users: usersRes.count || 0,
                total_products: productsRes.count || 0,
                low_stock_products: lowStockRes.count || 0,
                total_revenue: totalRevenue,
                revenue_this_month: monthRevenue,
            })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()

        // Refresh stats when orders or inventory change
        const channel = supabase
            .channel('admin-stats-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, fetchStats)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return { stats, isLoading, error, refetch: fetchStats }
}
