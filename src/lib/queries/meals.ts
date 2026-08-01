import { buildClient } from '@/lib/supabase/build';
import type { Database } from '@/types/database.types';

export type Meal = Database['public']['Tables']['meals']['Row'];

export async function getActiveMeals(): Promise<Meal[]> {
  const { data, error } = await buildClient
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch active meals: ${error.message}`);
  return data ?? [];
}

/** Featured meal with image for homepage hero; falls back to first active with image. */
export async function getHeroMeal(): Promise<Meal | null> {
  const { data: featured, error: featuredError } = await buildClient
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .neq('hero_image_url', '')
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featuredError) {
    console.warn(`[meals] getHeroMeal featured query failed: ${featuredError.message}`);
  } else if (featured?.hero_image_url) {
    return featured;
  }

  const { data: fallback, error: fallbackError } = await buildClient
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .neq('hero_image_url', '')
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    console.warn(`[meals] getHeroMeal fallback query failed: ${fallbackError.message}`);
    return null;
  }

  return fallback?.hero_image_url ? fallback : null;
}
