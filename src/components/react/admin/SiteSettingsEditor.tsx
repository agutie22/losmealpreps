import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SauceConfig {
  single_price_cents: number;
  pair_price_cents: number;
  free_threshold_cents: number;
}

const DEFAULT_CONFIG: SauceConfig = {
  single_price_cents: 150,
  pair_price_cents: 250,
  free_threshold_cents: 6000,
};

export default function SiteSettingsEditor() {
  const [config, setConfig] = useState<SauceConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadConfig() {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'sauce_pricing_config')
        .single();
      
      if (!error && data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setConfig({
            single_price_cents: parsed.single_price_cents ?? DEFAULT_CONFIG.single_price_cents,
            pair_price_cents: parsed.pair_price_cents ?? DEFAULT_CONFIG.pair_price_cents,
            free_threshold_cents: parsed.free_threshold_cents ?? DEFAULT_CONFIG.free_threshold_cents,
          });
        } catch {
          // use defaults
        }
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'sauce_pricing_config',
        value: JSON.stringify(config),
      }, { onConflict: 'key' });

    setSaving(false);
    if (error) {
      setMessage('Failed to save configuration.');
      console.error(error);
    } else {
      setMessage('Configuration saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCentsChange = (key: keyof SauceConfig, valueStr: string) => {
    const val = parseFloat(valueStr);
    if (!isNaN(val)) {
      setConfig((prev) => ({ ...prev, [key]: Math.round(val * 100) }));
    } else {
      setConfig((prev) => ({ ...prev, [key]: 0 }));
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--color-fg-muted)]">Loading settings...</div>;

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold text-[var(--color-fg)] mb-6">Promotions &amp; Settings</h2>
      
      <form onSubmit={handleSave} className="space-y-6 max-w-md">
        <div className="space-y-4 border border-[var(--color-surface-sunken)] p-4 rounded-[var(--radius-card)]">
          <h3 className="font-bold text-[16px] text-[var(--color-fg)]">Sauce Tiered Pricing</h3>
          
          <div>
            <label className="block text-[14px] font-medium text-[var(--color-fg-muted)] mb-1">
              Single Sauce Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={(config.single_price_cents / 100).toFixed(2)}
              onChange={(e) => handleCentsChange('single_price_cents', e.target.value)}
              className="w-full bg-[var(--color-surface-base)] border border-[var(--color-surface-sunken)] rounded-[var(--radius-base)] px-3 py-2 text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[var(--color-fg-muted)] mb-1">
              Pair of Sauces Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={(config.pair_price_cents / 100).toFixed(2)}
              onChange={(e) => handleCentsChange('pair_price_cents', e.target.value)}
              className="w-full bg-[var(--color-surface-base)] border border-[var(--color-surface-sunken)] rounded-[var(--radius-base)] px-3 py-2 text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)]"
            />
            <p className="text-[12px] text-[var(--color-fg-subtle)] mt-1">If a user buys 2 sauces, they will be charged this price instead of 2x the single price.</p>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[var(--color-fg-muted)] mb-1">
              Free Sauce Cart Threshold ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={(config.free_threshold_cents / 100).toFixed(2)}
              onChange={(e) => handleCentsChange('free_threshold_cents', e.target.value)}
              className="w-full bg-[var(--color-surface-base)] border border-[var(--color-surface-sunken)] rounded-[var(--radius-base)] px-3 py-2 text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)]"
            />
            <p className="text-[12px] text-[var(--color-fg-subtle)] mt-1">Cart subtotal (excluding sauces) must reach this to unlock 1 free sauce.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[var(--color-brand)] text-white px-6 py-2.5 rounded-[var(--radius-pill)] font-medium hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          {message && (
            <span className={`text-[14px] ${message.includes('successfully') ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
