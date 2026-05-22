import { buildClient } from '../supabase/build';

const SETTINGS_DEFAULTS: Record<string, string> = {
  instagram_handle: 'losmealpreps',
  tagline: 'Premium meal prep, macro-tracked and ready for pickup.',
  contact_email: 'losmealpreps@gmail.com',
};

export async function getSiteSettings() {
  const { data, error } = await buildClient
    .from('site_settings')
    .select('key, value');

  if (error) {
    console.warn(`[settings] Could not load site_settings (${error.message}) — using defaults`);
    return { ...SETTINGS_DEFAULTS };
  }

  return data.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, { ...SETTINGS_DEFAULTS } as Record<string, string>);
}
