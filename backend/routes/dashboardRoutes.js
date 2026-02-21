const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../config/supabaseClient');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            ordersTotal,
            ordersToday,
            ordersPending,
            usersTotal,
            productsTotal,
            lowStockTotal,
            revenueAll,
            revenueMonth,
        ] = await Promise.all([
            supabase.from('orders').select('id', { count: 'exact', head: true }),
            supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('inventory').select('id', { count: 'exact', head: true }).lte('quantity', 10),
            supabase.from('orders').select('total_amount').eq('payment_status', 'captured'),
            supabase.from('orders').select('total_amount').eq('payment_status', 'captured').gte('created_at', monthStart.toISOString()),
        ]);

        const totalRevenue = (revenueAll.data || []).reduce((s, o) => s + Number(o.total_amount), 0);
        const monthRevenue = (revenueMonth.data || []).reduce((s, o) => s + Number(o.total_amount), 0);

        res.json({
            total_orders: ordersTotal.count || 0,
            orders_today: ordersToday.count || 0,
            pending_orders: ordersPending.count || 0,
            total_users: usersTotal.count || 0,
            total_products: productsTotal.count || 0,
            low_stock_products: lowStockTotal.count || 0,
            total_revenue: totalRevenue,
            revenue_this_month: monthRevenue,
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/recent-orders – last 10 orders
router.get('/recent-orders', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from('orders')
            .select(`
        id, order_number, order_status, payment_status,
        total_amount, created_at,
        profiles (full_name, email)
      `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
