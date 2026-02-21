const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../config/supabaseClient');

// GET /api/orders – all orders (admin)
router.get('/', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('orders')
            .select(`
        *,
        order_items (
          id, product_name, product_image_url, quantity,
          unit_price, total_price, fulfillment_status
        ),
        profiles (full_name, email, phone, user_type)
      `)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (status) {
            query = query.eq('order_status', status);
        }

        const { data, error, count } = await query;
        if (error) return res.status(400).json({ error: error.message });

        res.json({ orders: data, total: count });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/orders/my?uid=... – fetch orders for specific user
router.get('/my', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { uid } = req.query;

        if (!uid) return res.status(400).json({ error: 'UID is required' });

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (
          id, product_name, product_image_url, quantity,
          unit_price, total_price, fulfillment_status
        )
      `)
            .eq('profile_id', uid)
            .order('created_at', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });

        res.json({ orders: data || [] });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/orders/:id – single order with full details
router.get('/:id', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*),
        profiles (full_name, email, phone, user_type, avatar_url),
        payments (*)
      `)
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Order not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/orders/:id/status – update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { order_status, admin_note, tracking_number, courier_company } = req.body;

        const updates = { order_status, updated_at: new Date().toISOString() };
        if (admin_note !== undefined) updates.admin_note = admin_note;
        if (tracking_number !== undefined) updates.tracking_number = tracking_number;
        if (courier_company !== undefined) updates.courier_company = courier_company;
        if (order_status === 'delivered') updates.delivered_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/orders/place – handle order placement (bypass RLS)
router.post('/place', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const {
            profile_id,
            shipping_address,
            billing_address,
            subtotal,
            shipping_amount,
            tax_amount = 0,
            discount_amount = 0,
            total_amount,
            items,
            payment_info
        } = req.body;

        if (!profile_id || !items || !items.length) {
            return res.status(400).json({ error: 'Missing required order data' });
        }

        // 1. Create order
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({
                profile_id,
                shipping_address_snapshot: shipping_address,
                billing_address_snapshot: billing_address || shipping_address,
                subtotal,
                shipping_amount,
                tax_amount,
                discount_amount,
                total_amount,
                order_status: 'confirmed',
                payment_status: 'captured',
                order_type: 'individual'
            })
            .select()
            .single();

        if (orderErr) throw orderErr;

        // 2. Create order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            seller_id: item.seller_id,
            product_name: item.product_name,
            product_image_url: item.product_image_url,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            fulfillment_status: 'pending'
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
        if (itemsErr) throw itemsErr;

        // 3. Create payment record
        const { error: payErr } = await supabase.from('payments').insert({
            order_id: order.id,
            profile_id,
            payment_method: payment_info.payment_method || 'razorpay',
            payment_gateway: payment_info.payment_gateway || 'razorpay',
            gateway_payment_id: payment_info.gateway_payment_id,
            gateway_order_id: payment_info.gateway_order_id,
            gateway_signature: payment_info.gateway_signature,
            amount: total_amount,
            currency: 'INR',
            payment_status: 'captured',
            paid_at: new Date().toISOString()
        });

        if (payErr) throw payErr;

        res.json({ success: true, order_id: order.id });
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

module.exports = router;
