const { getAdminClient } = require('./config/supabaseClient');
require('dotenv').config();
const fs = require('fs');

async function checkRLS() {
    const supabase = getAdminClient();
    let log = '';

    log += '--- RLS Policies ---\n';
    const { data: policies, error: polErr } = await supabase
        .rpc('get_policies'); // This might not work if RPC doesn't exist

    if (polErr) {
        // Fallback: try querying pg_policies via a raw query if possible, 
        // but supabase-js doesn't support raw SQL easily without RPC.
        // So let's just try to INSERT a dummy order as a user would.
        log += `Could not fetch policies: ${polErr.message}\n`;
    }

    log += '\n--- Attempting Test Insert (via Admin, should work) ---\n';
    const testUid = '82ac7751-f07a-4a1d-942a-34239cbc5688'; // ramkumar
    const { data: order, error: insErr } = await supabase.from('orders').insert({
        profile_id: testUid,
        order_number: 'TEST-' + Date.now(),
        total_amount: 0,
        order_status: 'pending'
    }).select().single();

    if (insErr) log += `Insert Error: ${insErr.message}\n`;
    else log += `Insert Success! Order ID: ${order.id}\n`;

    fs.writeFileSync('debug_result.txt', log);
}

checkRLS();
