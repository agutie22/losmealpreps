#!/usr/bin/env node
// Usage:
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  ADMIN_EMAIL=...  ADMIN_PASSWORD=...  node scripts/create-admin.mjs
//
// Local:      SUPABASE_URL=http://127.0.0.1:54321  (service role key from: npx supabase status)
// Production: SUPABASE_URL=https://<ref>.supabase.co  (service role key from: dashboard → Settings → API)

import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing required env vars:')
  console.error('  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Attempt to create; if the user already exists, update their password instead.
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
})

if (!createErr) {
  console.log('Admin user created:', created.user.email)
  process.exit(0)
}

const alreadyExists =
  createErr.message.toLowerCase().includes('already') ||
  createErr.code === 'email_exists' ||
  createErr.status === 422

if (alreadyExists) {
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) { console.error('List error:', listErr.message); process.exit(1) }
  const existing = users.find(u => u.email === ADMIN_EMAIL)
  if (!existing) { console.error('User not found after existence check'); process.exit(1) }
  const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD })
  if (updateErr) { console.error('Update error:', updateErr.message); process.exit(1) }
  console.log('Admin password updated:', ADMIN_EMAIL)
  process.exit(0)
}

console.error('Error:', createErr.message)
process.exit(1)
