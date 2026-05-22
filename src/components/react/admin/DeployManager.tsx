import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DeployManager() {
  const [loading, setLoading] = useState(false);
  const [lastDeploy, setLastDeploy] = useState<Date | null>(null);

  const fetchLastDeploy = async () => {
    const { data } = await supabase
      .from('deploy_triggers')
      .select('triggered_at')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.triggered_at) {
      setLastDeploy(new Date(data.triggered_at));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLastDeploy();
  }, []);

  const triggerDeploy = async () => {
    if (!confirm('Push all recent changes to the live site?')) return;
    setLoading(true);

    // Fetch GitHub credentials from admin_secrets (admin-only RLS).
    const { data: secrets, error: secretsErr } = await supabase
      .from('admin_secrets')
      .select('key, value');

    if (secretsErr) {
      alert(`Could not load deploy credentials: ${secretsErr.message}`);
      setLoading(false);
      return;
    }

    const kv = (secrets ?? []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {} as Record<string, string>);
    const owner = kv['github_owner'];
    const repo = kv['github_repo'];
    const token = kv['github_dispatch_token'];

    if (!owner || !repo || !token) {
      alert('GitHub deploy credentials are not configured. Go to Site Settings → Deploy Integration to set them up.');
      setLoading(false);
      return;
    }

    // Call workflow_dispatch.
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    );

    if (!res.ok) {
      alert(`GitHub deploy failed (${res.status}). Check your credentials in Site Settings.`);
      setLoading(false);
      return;
    }

    // Audit log — best-effort, non-blocking.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('deploy_triggers').insert({ triggered_by: session.user.id });
    }

    alert('Deploy triggered. The live site will update in ~2 minutes.');
    await fetchLastDeploy();
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      {lastDeploy && (
        <span className="text-[12px] text-[var(--color-fg-muted)] hidden md:inline">
          Last deployed: {lastDeploy.toLocaleString()}
        </span>
      )}
      <button
        onClick={triggerDeploy}
        disabled={loading}
        className={`px-4 py-2.5 rounded-[var(--radius-pill)] font-semibold text-[14px] transition-colors flex items-center justify-center shadow-sm ${
          loading
            ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)] cursor-not-allowed'
            : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'
        }`}
      >
        {loading ? 'Triggering…' : 'Publish to Live Site'}
      </button>
    </div>
  );
}
