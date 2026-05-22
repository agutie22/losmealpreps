import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Try to sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ text: error.message, error: true });
    } else {
      // Success! The session is saved, AdminApp will detect the state change
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-base)] px-4">
      <div className="w-full max-w-md bg-[var(--color-surface-elevated)] p-8 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[32px] text-center text-[var(--color-brand)] mb-2">
          Admin Login
        </h1>
        <p className="text-center text-[var(--color-fg-muted)] mb-8">
          Sign in to manage the site
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[14px] font-medium text-[var(--color-fg)] mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-shadow"
              placeholder="admin@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-[14px] font-medium text-[var(--color-fg)] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[var(--radius-input)] border border-[var(--color-surface-sunken)] bg-[var(--color-surface-base)] text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-[var(--radius-input)] text-[14px] ${message.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-[var(--radius-pill)] font-semibold text-[16px] transition-colors flex items-center justify-center ${
              loading 
                ? 'bg-[var(--color-surface-sunken)] text-[var(--color-fg-subtle)]' 
                : 'bg-[var(--color-brand)] text-[var(--color-surface-elevated)] hover:bg-[var(--color-brand-hover)]'
            }`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
