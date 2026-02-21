const express = require('express');
const router = express.Router();
const { getAdminClient } = require('../config/supabaseClient');

// GET /api/users — all profiles (admin only, service role bypasses RLS)
router.get('/', async (req, res) => {
    try {
        const admin = getAdminClient();
        const { search, type, limit = 100, offset = 0 } = req.query;

        let query = admin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (type && type !== 'all') query = query.eq('user_type', type);

        const { data, error } = await query;
        if (error) return res.status(400).json({ error: error.message });

        return res.json({ users: data || [] });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/users/:id/status — suspend or activate
router.patch('/:id/status', async (req, res) => {
    try {
        const admin = getAdminClient();
        const { account_status } = req.body;
        const { data, error } = await admin
            .from('profiles')
            .update({ account_status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/users/:id/role — change user_type
router.patch('/:id/role', async (req, res) => {
    try {
        const admin = getAdminClient();
        const { user_type } = req.body;
        const { data, error } = await admin
            .from('profiles')
            .update({ user_type, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
