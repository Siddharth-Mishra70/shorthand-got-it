import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbbxoazjjgwlwzegbphy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CxXC5C7TnKCxMlyNJ5rAsQ_0q92mkDA';

const ADMIN_EMAIL    = 'admin@shorthandians.com';
const ADMIN_PASSWORD = 'Admin@1234';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
  console.log('Creating admin Supabase Auth account...');

  // 1. Sign up the admin in Supabase Auth
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signUpErr && !signUpErr.message.includes('already registered')) {
    console.error('❌ Auth sign-up failed:', signUpErr.message);
    process.exit(1);
  }

  if (signUpErr?.message.includes('already registered')) {
    console.log('ℹ️  Auth account already exists, skipping sign-up.');
  } else {
    console.log('✅ Auth account created:', signUpData?.user?.id);
  }

  // 2. Check if user record already exists in custom users table
  const { data: existing } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    // Update to admin + active
    const { error: updateErr } = await supabase
      .from('users')
      .update({ role: 'admin', status: 'active' })
      .eq('email', ADMIN_EMAIL);

    if (updateErr) {
      console.error('❌ Failed to update user record:', updateErr.message);
    } else {
      console.log('✅ Existing user updated to admin + active.');
    }
  } else {
    // Insert new admin record
    const { error: insertErr } = await supabase.from('users').insert([{
      first_name:  'Admin',
      last_name:   'Shorthandians',
      email:       ADMIN_EMAIL,
      phone:       '0000000000',
      state:       'UP',
      city:        'Prayagraj',
      gender:      'Other',
      role:        'admin',
      status:      'active',
      joinedDate:  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      created_at:  new Date().toISOString(),
    }]);

    if (insertErr) {
      console.error('❌ Failed to insert user record:', insertErr.message);
    } else {
      console.log('✅ Admin user record inserted.');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Admin credentials ready!');
  console.log('   Email   :', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  NOTE: Check your email inbox and confirm the account if Supabase sent a confirmation email.');
}

createAdmin();
