const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../config/supabaseClient');

// GET /api/products – list all products with stock
router.get('/', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('products')
            .select(`
        *,
        product_images (image_url, is_primary),
        inventory (quantity, reserved_quantity, low_stock_threshold),
        categories (name, slug)
      `)
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (status) query = query.eq('product_status', status);

        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });

        // Enrich with primary image and stock info
        const enriched = (data || []).map(p => ({
            ...p,
            primary_image_url: p.product_images?.find(img => img.is_primary)?.image_url,
            stock_quantity: p.inventory?.[0]?.quantity ?? 0,
            available_quantity: (p.inventory?.[0]?.quantity ?? 0) - (p.inventory?.[0]?.reserved_quantity ?? 0),
            low_stock_threshold: p.inventory?.[0]?.low_stock_threshold ?? 10,
        }));

        res.json({ products: enriched });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/products/:id – single product
router.get('/:id', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const idOrSlug = req.params.id;

        // Try lookup by ID first, then by slug
        let query = supabase
            .from('products')
            .select(`
                *,
                product_images (image_url, is_primary),
                inventory (quantity, reserved_quantity, low_stock_threshold),
                categories (name, slug)
            `);

        if (idOrSlug.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            query = query.eq('id', idOrSlug);
        } else {
            // Case-insensitive slug match
            query = query.ilike('slug', idOrSlug);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) return res.status(404).json({ error: 'Product not found' });

        // Transform
        const transformed = {
            ...data,
            primary_image_url: data.product_images?.find((img) => img.is_primary)?.image_url || data.product_images?.[0]?.image_url,
            stock_quantity: data.inventory?.[0]?.quantity ?? 0,
            available_quantity: (data.inventory?.[0]?.quantity ?? 0) - (data.inventory?.[0]?.reserved_quantity ?? 0),
        };

        res.json(transformed);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/products/:id – update product
router.patch('/:id', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        delete updates.id; // never allow updating PK

        const { data, error } = await supabase
            .from('products')
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

// DELETE (soft) /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const supabase = getAdminClient();
        const { error } = await supabase
            .from('products')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', req.params.id);

        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
