# Los Meal Preps

Static Astro storefront for Los Meal Preps. Public catalog data comes from Supabase at build time; admin and builder flows use client-side React islands.

**Repository:** [github.com/4444Studios/losmealpreps](https://github.com/4444Studios/losmealpreps)

```bash
git clone git@github.com:4444Studios/losmealpreps.git
```

**Deploy:** GitHub Actions → GitHub Pages (`losmealpreps.com`). If a Hostinger VPS also pulls this repo, update its remote to `4444Studios/losmealpreps` after the org transfer.

## Commands

```sh
pnpm install
pnpm dev
pnpm check
pnpm lint
pnpm build
pnpm preview
```

## Environment Variables

Required for Supabase-backed pages:

```sh
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

Required to enable the `/consult` EmailJS form:

```sh
PUBLIC_EMAILJS_SERVICE_ID=
PUBLIC_EMAILJS_TEMPLATE_ID=
PUBLIC_EMAILJS_PUBLIC_KEY=
```

Existing `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` values are also supported for compatibility, but new setup should use the `PUBLIC_` names above.

The EmailJS template should accept these fields: `from_name`, `reply_to`, `phone_or_instagram`, `goal`, `macro_status`, `request_type`, `body_context`, `target_macros`, `dietary_notes`, and `message`.
