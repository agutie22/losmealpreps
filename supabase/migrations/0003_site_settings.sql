-- === site settings: editable by admin without redeploy ===
-- This is what makes admin useful even without an order table.
create table site_settings (
  key text primary key,                     -- 'instagram_handle', 'tagline', 'hero_headline', 'contact_email', etc.
  value text not null,
  updated_at timestamptz not null default now()
);
