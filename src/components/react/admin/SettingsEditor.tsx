import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SettingsEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      if (data) {
        setSettings(data.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {} as Record<string, string>));
      }
      setLoading(false);
    });
  }, []);

  const updateSetting = async (key: string, value: string) => {
    if (settings[key] === value) return;
    setSavingKey(key);
    const { data: existing } = await supabase.from('site_settings').select('key').eq('key', key).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from('site_settings').update({ value }).eq('key', key));
    } else {
      ({ error } = await supabase.from('site_settings').insert({ key, value }));
    }
    if (error) { alert(`Error saving: ${error.message}`); }
    else { setSettings(prev => ({ ...prev, [key]: value })); }
    setSavingKey(null);
  };

  if (loading) return <div className="text-[var(--color-fg-muted)]">Loading settings…</div>;

  const inputCls = 'w-full px-4 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-shadow';

  const fields = [
    { key: 'instagram_handle', label: 'Instagram Handle (no @)', placeholder: 'losmealpreps' },
    { key: 'contact_email',    label: 'Contact Email',            placeholder: 'hello@losmealpreps.com' },
    { key: 'hero_headline',    label: 'Homepage Hero Headline',   placeholder: 'Premium Meal Prep, Ready for Pickup' },
    { key: 'tagline',          label: 'Company Tagline',          placeholder: 'Chef-made · Macro-tracked · Fresh, never frozen' },
  ];

  return (
    <div className="bg-[var(--color-surface-elevated)] p-6 rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] max-w-2xl">
      <h2 className="font-[family-name:var(--font-display)] font-bold text-[20px] text-[var(--color-fg)] mb-6">Site Settings</h2>
      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-[14px] font-medium text-[var(--color-fg)] mb-2">
              {field.label}
              {savingKey === field.key && <span className="ml-2 text-[12px] text-[var(--color-brand)]">Saving…</span>}
            </label>
            <input
              type="text"
              className={inputCls}
              defaultValue={settings[field.key] || ''}
              placeholder={field.placeholder}
              onBlur={e => updateSetting(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 bg-[var(--color-surface-base)] rounded-[var(--radius-input)] text-[14px] text-[var(--color-fg-muted)] border border-[var(--color-surface-sunken)]">
        <strong className="text-[var(--color-fg)] block mb-1">How changes work:</strong>
        Saved on blur. Changes are live immediately — visitors see them on their next page load, no deploy needed.
      </div>
    </div>
  );
}
