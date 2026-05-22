import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import LoginForm from './LoginForm';
import MealEditor from './MealEditor';
import IngredientEditor from './IngredientEditor';
import CustomMealConfig from './CustomMealConfig';

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'meals' | 'ingredients' | 'custom-config'>('meals');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-fg-muted)]">Checking session...</div>;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)]">
      <header className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-surface-sunken)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[24px] text-[var(--color-brand)]">Admin Dashboard</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-[14px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8 border-b border-[var(--color-surface-sunken)] mb-8">
          <button
            onClick={() => setActiveTab('meals')}
            className={`pb-4 text-[16px] font-medium transition-colors border-b-2 ${activeTab === 'meals' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
          >
            Manage Meals
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-4 text-[16px] font-medium transition-colors border-b-2 ${activeTab === 'ingredients' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
          >
            Ingredient Library
          </button>
          <button
            onClick={() => setActiveTab('custom-config')}
            className={`pb-4 text-[16px] font-medium transition-colors border-b-2 ${activeTab === 'custom-config' ? 'border-[var(--color-brand)] text-[var(--color-brand)]' : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'}`}
          >
            Custom Meal
          </button>
        </div>

        <div>
          {activeTab === 'meals' && <MealEditor />}
          {activeTab === 'ingredients' && <IngredientEditor />}
          {activeTab === 'custom-config' && <CustomMealConfig />}
        </div>
      </div>
    </div>
  );
}
