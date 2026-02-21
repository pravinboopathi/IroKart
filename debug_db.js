const { getAdminClient } = require('./backend/config/supabaseClient');

async function debugData() {
    const supabase = getAdminClient();

    console.log('--- Orders Debug ---');
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, order_number, profile_id, order_status, created_at')
        .limit(10);

    if (ordersErr) console.error('Orders Error:', ordersErr);
    else {
        console.log(`Found ${orders?.length || 0} orders.`);
        orders.forEach(o => console.log(`Order: ${o.order_number}, ID: ${o.id}, Profile: ${o.profile_id}, Status: ${o.order_status}`));
    }

    console.log('\n--- Profiles Debug ---');
    const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5);

    if (profilesErr) console.error('Profiles Error:', profilesErr);
    else {
        profiles.forEach(p => console.log(`Profile: ${p.id}, Email: ${p.email}`));
    }
}

debugData();
