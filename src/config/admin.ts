/** Must match RLS in supabase/admin-allowlist-email.sql and VITE_ADMIN_EMAIL in .env */
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? 'losmealpreps@gmail.com')
    .trim()
    .toLowerCase();
