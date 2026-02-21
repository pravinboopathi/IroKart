require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isMockUrl = !supabaseUrl || !supabaseUrl.startsWith('http');

// Anon client (for user-facing auth)
let supabase = null;
if (!isMockUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
        console.error('Error initializing anon Supabase client:', err.message);
    }
} else {
    console.warn('Warning: Supabase anon client not initialized (missing or invalid URL/key).');
}

// Service role client (bypasses RLS – admin operations only)
let supabaseAdmin = null;
if (!isMockUrl && supabaseServiceKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
        console.log('✅ Supabase Admin (service role) client initialized');
    } catch (err) {
        console.error('Error initializing admin Supabase client:', err.message);
    }
}

function getAdminClient() {
    if (!supabaseAdmin) throw new Error('Admin Supabase client not initialized – check SUPABASE_SERVICE_ROLE_KEY');
    return supabaseAdmin;
}

module.exports = { supabase, supabaseAdmin, getAdminClient };
