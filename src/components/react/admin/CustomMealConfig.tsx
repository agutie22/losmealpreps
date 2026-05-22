import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Config {
  max_veggie_count: number;
  updated_at: string;
}

interface Form {
  max_veggie_count: string;
}

function configToForm(c: Config): Form {
  return { max_veggie_count: String(c.max_veggie_count) };
}

export default function CustomMealConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('custom_meal_config')
      .select('max_veggie_count, updated_at')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) { console.error(error); }
        if (data) { setConfig(data); setForm(configToForm(data)); }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!form) return;
    const max_veggie = parseInt(form.max_veggie_count);
    if (isNaN(max_veggie) || max_veggie < 1) {
      alert('Max veggie count must be a whole number greater than 0.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('custom_meal_config')
      .update({ max_veggie_count: max_veggie, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('max_veggie_count, updated_at')
      .single();

    if (error) { alert(`Save failed: ${error.message}`); }
    else if (data) { setConfig(data); setForm(configToForm(data)); }
    setSaving(false);
  };

  const inputCls = 'w-full px-3 py-2 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]';
  const labelCls = 'block text-[13px] font-semibold text-[var(--color-fg)] mb-1.5';
  const hintCls = 'text-[12px] text-[var(--color-fg-subtle)] mt-1';

  if (loading) return <div className="text-[var(--color-fg-muted)]">Loading config...</div>;
  if (!form) return <div className="text-[var(--color-fg-muted)]">Config not found.</div>;

  return (
    <div className="max-w-lg">
      <p className="text-[var(--color-fg-muted)] text-[14px] mb-6">
        Controls how many veggies a customer can add to their custom meal. Pricing is determined entirely by the protein variant they select.
      </p>

      <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-card)] border border-[var(--color-surface-sunken)] p-6 space-y-5">
        <div>
          <label className={labelCls}>Max veggies</label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.max_veggie_count}
            onChange={e => setForm(f => f ? { ...f, max_veggie_count: e.target.value } : f)}
            className={inputCls}
          />
          <p className={hintCls}>Maximum number of veggies a customer can pick. All veggies are always included at no extra charge.</p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2.5 text-[14px] font-semibold rounded-[var(--radius-pill)] transition-colors ${saving ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)]' : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'}`}
          >
            {saving ? 'Saving…' : 'Save Config'}
          </button>
          {config && (
            <span className="text-[12px] text-[var(--color-fg-subtle)]">
              Last saved: {new Date(config.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
