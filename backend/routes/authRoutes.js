const express = require('express');
const router = express.Router();
const { supabase, getAdminClient } = require('../config/supabaseClient');

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        if (!supabase) return res.status(500).json({ error: 'Auth service not configured' });

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });

        return res.status(200).json({
            user: data.user,
            session: data.session,
            message: 'Sign In Successful'
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/signup — creates user with email auto-confirmed (no verification email)
router.post('/signup', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const admin = getAdminClient();

        // Create user with email_confirm: true skips the verification email
        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: full_name || '' },
        });

        if (error) return res.status(400).json({ error: error.message });

        // Upsert a profile row (the DB trigger may do this too, but we ensure it)
        await admin.from('profiles').upsert({
            id: data.user.id,
            full_name: full_name || email.split('@')[0],
            email: email,
            user_type: 'individual',
            account_status: 'active',
            is_email_verified: true,
        }, { onConflict: 'id' });

        return res.status(201).json({ message: 'Account created. You can now sign in.', user: data.user });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me?uid=<user_id>
// Fetches the user's profile using service role key (bypasses RLS completely)
router.get('/me', async (req, res) => {
    try {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'uid is required' });

        const admin = getAdminClient();
        const { data, error } = await admin
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (error) {
            // Profile might not exist yet — return a minimal default
            if (error.code === 'PGRST116') {
                return res.status(200).json({
                    id: uid,
                    user_type: 'individual',
                    account_status: 'active',
                    full_name: null,
                    phone: null,
                    email: null,
                });
            }
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
