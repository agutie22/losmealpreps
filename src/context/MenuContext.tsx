import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultMenuData } from '../data/defaultMenu';
import { isSupabaseConfigured } from '../lib/supabase';
import { getMenuData } from '../services/menuService';
import type { MenuData } from '../types/menu';

interface MenuContextType {
    menu: MenuData;
    loading: boolean;
    error: string | null;
    usingFallback: boolean;
    refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

/** When Supabase is on, do not use bundled `data/meals.ts` before the first real fetch (avoids fake "Signature meals"). */
function initialMenuState(): MenuData {
    if (!isSupabaseConfigured) {
        return defaultMenuData;
    }
    return { ...defaultMenuData, meals: [] };
}

export const MenuProvider = ({ children }: { children: ReactNode }) => {
    const [menu, setMenu] = useState<MenuData>(() => initialMenuState());
    const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
    const [error, setError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState<boolean>(!isSupabaseConfigured);

    const refreshMenu = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setUsingFallback(true);
            setLoading(false);
            setError(null);
            setMenu(defaultMenuData);
            return;
        }

        setLoading(true);
        try {
            const freshMenu = await getMenuData();
            setMenu(freshMenu);
            setUsingFallback(false);
            setError(null);
        } catch {
            // Keep ingredient/bundle fallbacks for the customizer, but never show fake `data/meals` as live data.
            setMenu({ ...defaultMenuData, meals: [] });
            setUsingFallback(true);
            setError('Unable to load live menu from Supabase. Using local fallback menu.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshMenu();
    }, [refreshMenu]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible' && isSupabaseConfigured) {
                void refreshMenu();
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshMenu]);

    const value = useMemo<MenuContextType>(() => ({
        menu,
        loading,
        error,
        usingFallback,
        refreshMenu
    }), [menu, loading, error, usingFallback, refreshMenu]);

    return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};