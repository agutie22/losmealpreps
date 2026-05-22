import { buildClient } from '../supabase/build';
import type { Database } from '@/types/database.types';

export type Meal = Database['public']['Tables']['meals']['Row'];

export async function getActiveMeals() {
  const { data, error } = await buildClient
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active meals: ${error.message}`);
  }

  return data;
}

export async function getFeaturedMeals() {
  const { data, error } = await buildClient
    .from('meals')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch featured meals: ${error.message}`);
  }

  return data;
}
