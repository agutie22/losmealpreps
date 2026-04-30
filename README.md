# Los Meal Preps

Meal planning website built with React + TypeScript + Vite.

## Supabase menu integration

The menu is now loaded from Supabase at runtime for seamless client updates without code changes.

### 1) Configure environment variables

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL` (must match the allowlisted address in `supabase/admin-allowlist-email.sql`)

If Supabase is not configured or unreachable, the app automatically falls back to the local menu defaults in `src/data`.

#### If the CLI was linked to the wrong Supabase project

1. In the **wrong** project (in the Supabase dashboard), open **SQL** and run `supabase/cleanup-mistaken-migration.sql` to drop the menu tables that were created by mistake. Confirm in **Table editor** that you are not deleting unrelated tables of the same name.
2. In this repo, run `pnpm dlx supabase unlink` (or `supabase unlink`), then `supabase login` with the right account and `supabase link` to the project that matches your `.env`.

#### Admin auth (one user, no public signups)

Do this in the **same** Supabase project as your `.env` URL/anon key:

1. **Add the user**
   - Go to **Authentication** → **Users** → **Add user** (or **Invite**).
   - Email: `losmealpreps@gmail.com` (or whatever you set in `VITE_ADMIN_EMAIL` and in RLS).
   - Save. If magic link is used, the user can leave password empty or use a random one you discard.

2. **Stop random people from using magic link / new accounts**
   - Go to **Authentication** → **Providers** → **Email** (or **Sign In / Providers** in newer UIs).
   - Turn **off** “Allow new users to sign up” / **Disable sign ups** (wording depends on dashboard version) so new accounts are not created from the app.
   - The `/admin` screen only offers a “send link” to `VITE_ADMIN_EMAIL` and calls OTP with `shouldCreateUser: false`, so unknown emails cannot be registered via this flow if signups are disabled.

3. **Redirect URLs**
   - Under **Authentication** → **URL configuration**, set **Site URL** to your site (e.g. production and `http://localhost:5173` for dev) so the magic link redirect works.

### 2) Create Supabase tables

In the **same** Supabase project as `VITE_SUPABASE_URL` (the hostname `https://YOUR_REF.supabase.co` must match **Project Settings → API** and your `.env`):

- **CLI (recommended after link):** `pnpm dlx supabase link --project-ref YOUR_REF` then `pnpm run db:setup`. Check with `pnpm run db:verify` (expect 4 / 18 / 2 / 10 rows).
- **Or dashboard:** run the entire `supabase/setup-complete.sql` once in the SQL editor (schema + seed + admin email allowlist).
- **Or** run in order: `supabase/menu-schema.sql`, `supabase/seed-menu.sql`, `supabase/admin-allowlist-email.sql`.

If the site says tables are missing in the “schema cache”, the URL/keys almost always point at a different project than the one where SQL was run, or the API has not reloaded—wait a minute or use API settings to reload the PostgREST schema.

This creates:

- `meal_items`
- `ingredients`
- `bundle_deals`
- `bundle_deal_proteins`

and public read policies for active menu rows.

### 3) Seed menu data

Insert rows into:

- `meal_items` for fixed meals
- `ingredients` for proteins/carbs/veggies/sauces
- `bundle_deals` for standard/premium bundle pricing, titles, meal count, image
- `bundle_deal_proteins` for which proteins are allowed in each bundle

Use `display_order` to control the order shown in the UI and `is_active` to hide/show items.

### 4) Update menu anytime

Your client can update menu rows directly in Supabase, or use the built-in `/admin` dashboard (magic link login) after the admin policies are applied.
