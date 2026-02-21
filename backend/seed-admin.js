/**
 * seed-admin.js
 * 
 * Creates the default admin user in Supabase Auth and sets their profile
 * to user_type = 'admin'.
 * 
 * Usage: node seed-admin.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = 'missingsemicolon.team@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'IroKart Admin';

async function seedAdmin() {
    console.log(`\n🔑 Seeding admin user: ${ADMIN_EMAIL}`);

    // 1. Try to sign in first — if already exists, just update profile
    const { data: existing } = await supabase.auth.admin.listUsers();
    const existingUser = existing?.users?.find(u => u.email === ADMIN_EMAIL);

    let userId;

    if (existingUser) {
        console.log('   ✅ Auth user already exists, updating password...');
        await supabase.auth.admin.updateUserById(existingUser.id, {
            password: ADMIN_PASSWORD,
        });
        userId = existingUser.id;
    } else {
        console.log('   Creating new auth user...');
        const { data, error } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: ADMIN_NAME },
        });

        if (error) {
            console.error('❌ Failed to create auth user:', error.message);
            process.exit(1);
        }
        userId = data.user.id;
        console.log(`   ✅ Auth user created: ${userId}`);
    }

    // 2. Upsert profile with user_type = 'admin'
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            user_type: 'admin',
            account_status: 'active',
            is_email_verified: true,
        }, { onConflict: 'id' });

    if (profileError) {
        console.error('❌ Failed to upsert profile:', profileError.message);
        process.exit(1);
    }

    console.log('   ✅ Profile set to user_type = admin');
    console.log('\n🎉 Admin ready!');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   URL:      http://localhost:5173/sign-in\n`);
}

seedAdmin();
