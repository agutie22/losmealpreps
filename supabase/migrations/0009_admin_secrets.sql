-- Admin-only key-value store for secrets that must not be publicly readable.
-- site_settings has public read (for build-time fetch); this table does not.
create table admin_secrets (
  key        text primary key,
  value      text        not null default '',
  updated_at timestamptz not null default now()
);

alter table admin_secrets enable row level security;

create policy "admin only" on admin_secrets
  for all
  using (is_admin(auth.jwt()->>'email'))
  with check (is_admin(auth.jwt()->>'email'));

-- Seed rows so the SettingsEditor can render them before first save.
insert into admin_secrets (key, value)
  values
    ('github_owner', ''),
    ('github_repo', ''),
    ('github_dispatch_token', '')
  on conflict (key) do nothing;
