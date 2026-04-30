import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { normalizeBundleDealRow, normalizeIngredientRow, normalizeMealItemRow } from '../lib/normalizeFromSupabase';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useMenu } from '../context/MenuContext';
import { ADMIN_EMAIL } from '../config/admin';
import BundlesManager from './admin/BundlesManager';
import IngredientsManager from './admin/IngredientsManager';
import MealsManager from './admin/MealsManager';
import type { BundleDealRow, BundleProteinMap, IngredientRow, MealRow } from './admin/types';
import './Admin.css';

type AdminTab = 'bundles' | 'meals' | 'ingredients';

const defaultBundleProteinMap: BundleProteinMap = { standard: [], premium: [] };

export default function Admin() {
    const { refreshMenu } = useMenu();
    const [session, setSession] = useState<Session | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [meals, setMeals] = useState<MealRow[]>([]);
    const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
    const [bundleDeals, setBundleDeals] = useState<BundleDealRow[]>([]);
    const [bundleProteinMap, setBundleProteinMap] = useState<BundleProteinMap>(defaultBundleProteinMap);
    const [activeTab, setActiveTab] = useState<AdminTab>('bundles');
    const [mealQuery, setMealQuery] = useState('');
    const [ingredientQuery, setIngredientQuery] = useState('');
    const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState<'all' | IngredientRow['category']>('all');

    const proteinOptions = useMemo(
        () => ingredients.filter((item) => item.category === 'protein'),
        [ingredients]
    );

    const mealStats = useMemo(() => {
        const active = meals.filter((m) => m.is_active).length;
        return { total: meals.length, active };
    }, [meals]);

    const patchIngredient = (id: string, patch: Partial<IngredientRow>) => {
        setIngredients((prev) => {
            const i = prev.findIndex((m) => m.id === id);
            if (i < 0) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    };

    const patchBundle = (variant: BundleDealRow['variant'], patch: Partial<BundleDealRow>) => {
        setBundleDeals((prev) => {
            const i = prev.findIndex((b) => b.variant === variant);
            if (i < 0) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    };

    const loadAdminData = async () => {
        if (!supabase) return;
        setLoading(true);
        setMessage(null);
        const [mealsRes, ingredientsRes, bundleDealsRes, bundleProteinsRes] = await Promise.all([
            supabase.from('meal_items').select('*').order('display_order', { ascending: true }),
            supabase.from('ingredients').select('*').order('display_order', { ascending: true }),
            supabase.from('bundle_deals').select('*').order('variant', { ascending: true }),
            supabase.from('bundle_deal_proteins').select('bundle_variant,protein_id,display_order').order('display_order', { ascending: true })
        ]);
        setLoading(false);

        const firstError = [mealsRes, ingredientsRes, bundleDealsRes, bundleProteinsRes].find((r) => r.error);
        if (firstError?.error) {
            const details = [mealsRes, ingredientsRes, bundleDealsRes, bundleProteinsRes]
                .map((r, i) => {
                    const name = ['meal_items', 'ingredients', 'bundle_deals', 'bundle_deal_proteins'][i];
                    return r.error ? `${name}: ${r.error.message}` : null;
                })
                .filter(Boolean)
                .join(' | ');
            const hint = /Could not find the table|schema cache/i.test(details)
                ? ` Your VITE_SUPABASE_URL must point to the project where you created the tables. In that project: SQL Editor → run the full file supabase/setup-complete.sql from this repo, then wait a minute or reload the API schema (Project Settings → API) and refresh /admin. Current env URL: ${import.meta.env.VITE_SUPABASE_URL ?? '(not set)'}.`
                : ` Confirm you are signed in as ${ADMIN_EMAIL} and RLS policies include admin-allowlist-email.sql.`;
            setMessage(`Failed to load admin data. ${details}${hint}`);
            return;
        }

        setMeals((mealsRes.data ?? []).map((row) => normalizeMealItemRow(row as Record<string, unknown>)));
        setIngredients((ingredientsRes.data ?? []).map((row) => normalizeIngredientRow(row as Record<string, unknown>)));
        setBundleDeals((bundleDealsRes.data ?? []).map((row) => normalizeBundleDealRow(row as Record<string, unknown>)));

        const nextMap: BundleProteinMap = { standard: [], premium: [] };
        (bundleProteinsRes.data ?? []).forEach((row) => {
            const variant = row.bundle_variant as 'standard' | 'premium';
            nextMap[variant].push(row.protein_id as string);
        });
        setBundleProteinMap(nextMap);
    };

    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!session) return;
        const id = requestAnimationFrame(() => {
            void loadAdminData();
        });
        return () => cancelAnimationFrame(id);
    }, [session]);

    const sendMagicLink = async () => {
        if (!supabase) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: ADMIN_EMAIL,
            options: { shouldCreateUser: false }
        });
        setLoading(false);
        setMessage(
            error
                ? error.message
                : `Magic link sent to ${ADMIN_EMAIL}. Check your inbox (and that this user exists in Supabase with signups disabled for strangers).`
        );
    };

    const signOut = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setMessage('Signed out.');
    };

    const saveNonMealChanges = async () => {
        if (!supabase) return;
        setSaving(true);
        setMessage(null);

        const ingredientsRes = await supabase.from('ingredients').upsert(ingredients, { onConflict: 'id' });
        const bundlesRes = await supabase.from('bundle_deals').upsert(bundleDeals, { onConflict: 'variant' });
        const deleteMapRes = await supabase.from('bundle_deal_proteins').delete().in('bundle_variant', ['standard', 'premium']);
        const mapRows = (Object.keys(bundleProteinMap) as Array<'standard' | 'premium'>).flatMap((variant) =>
            bundleProteinMap[variant].map((proteinId, index) => ({
                bundle_variant: variant,
                protein_id: proteinId,
                display_order: index + 1
            }))
        );
        const insertMapRes = mapRows.length > 0
            ? await supabase.from('bundle_deal_proteins').insert(mapRows)
            : { error: null };

        setSaving(false);

        if (ingredientsRes.error || bundlesRes.error || deleteMapRes.error || insertMapRes.error) {
            setMessage('Save failed. Check auth or row-level security policies.');
            return;
        }

        await refreshMenu();
        setMessage('Saved successfully.');
    };

    const addIngredient = (): string => {
        const id = `ing_${Date.now()}`;
        const nextOrder = ingredients.length + 1;
        setIngredients((prev) => [...prev, {
            id,
            name: 'New Ingredient',
            category: 'protein',
            price: 0,
            price_large: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            calories: 0,
            protein_large: 0,
            carbs_large: 0,
            fat_large: 0,
            calories_large: 0,
            is_premium: false,
            is_active: true,
            display_order: nextOrder
        }]);
        return id;
    };

    if (!isSupabaseConfigured) {
        return (
            <div className="page-container admin-page">
                <h1>Admin Dashboard</h1>
                <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable admin login.</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="page-container admin-page">
                <div className="admin-card">
                    <h1>Admin Login</h1>
                    <p className="admin-help">
                        A sign-in link is only sent to the authorized address. Public signups should be off in Supabase; see README.
                    </p>
                    <p className="admin-email-shown">
                        <span className="admin-email-label">Account</span>
                        <strong>{ADMIN_EMAIL}</strong>
                    </p>
                    <button className="admin-btn" onClick={sendMagicLink} disabled={loading}>
                        {loading ? 'Sending...' : 'Send magic link'}
                    </button>
                    {message && <p className="admin-message">{message}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container admin-page admin-app-shell">
            <header className="admin-page-header">
                <div>
                    <h1>Admin</h1>
                    <p className="admin-page-subtitle">
                        Manage bundles, meals, and nutrition data. Save nutrition data & bundles from the button below; meals use their
                        own save bar.
                    </p>
                </div>
                <div className="admin-header-actions">
                    <button className="admin-btn secondary" onClick={() => void loadAdminData()} disabled={loading}>
                        {loading ? 'Loading…' : 'Reload'}
                    </button>
                    <button className="admin-btn secondary" onClick={signOut}>
                        Sign out
                    </button>
                    {activeTab !== 'meals' && (
                        <button className="admin-btn" onClick={saveNonMealChanges} disabled={saving || loading}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    )}
                </div>
            </header>
            {message && <p className="admin-message" role="status">{message}</p>}
            {loading && <p className="admin-loading" aria-live="polite">Loading data…</p>}
            <div className="admin-tabs" role="tablist">
                <button type="button" className={`admin-tab ${activeTab === 'bundles' ? 'active' : ''}`} onClick={() => setActiveTab('bundles')}>
                    Bundle deals
                </button>
                <button type="button" className={`admin-tab ${activeTab === 'meals' ? 'active' : ''}`} onClick={() => setActiveTab('meals')}>
                    Meals
                    {mealStats.total > 0 && <span className="admin-tab-count">{mealStats.active}/{mealStats.total} live</span>}
                </button>
                <button type="button" className={`admin-tab ${activeTab === 'ingredients' ? 'active' : ''}`} onClick={() => setActiveTab('ingredients')}>
                    Nutrition Data
                </button>
            </div>

            {activeTab === 'bundles' && supabase && (
                <BundlesManager
                    bundleDeals={bundleDeals}
                    patchBundle={patchBundle}
                    bundleProteinMap={bundleProteinMap}
                    setBundleProteinMap={setBundleProteinMap}
                    proteinOptions={proteinOptions}
                    supabase={supabase}
                />
            )}

            {activeTab === 'meals' && supabase && (
                <MealsManager
                    meals={meals}
                    setMeals={setMeals}
                    mealQuery={mealQuery}
                    setMealQuery={setMealQuery}
                    supabase={supabase}
                    refreshMenu={refreshMenu}
                    setMessage={setMessage}
                    loading={loading}
                    reloadMeals={loadAdminData}
                />
            )}

            {activeTab === 'ingredients' && (
                <IngredientsManager
                    ingredients={ingredients}
                    setIngredients={setIngredients}
                    patchIngredient={patchIngredient}
                    deleteIngredient={(id) => setIngredients((prev) => prev.filter((item) => item.id !== id))}
                    addIngredient={addIngredient}
                    ingredientQuery={ingredientQuery}
                    setIngredientQuery={setIngredientQuery}
                    ingredientCategoryFilter={ingredientCategoryFilter}
                    setIngredientCategoryFilter={setIngredientCategoryFilter}
                />
            )}
        </div>
    );
}
