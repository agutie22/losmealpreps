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
