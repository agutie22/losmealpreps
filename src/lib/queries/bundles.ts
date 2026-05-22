import { buildClient } from '../supabase/build';
import type { Database } from '@/types/database.types';

export type Bundle = Database['public']['Tables']['bundles']['Row'];

export async function getActiveBundles() {
  const { data, error } = await buildClient
    .from('bundles')
    .select('*')
    .eq('is_active', true)
    .order('slot_count', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active bundles: ${error.message}`);
  }

  return data;
}
