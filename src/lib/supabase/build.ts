import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// At build time in Astro, env variables are accessed differently
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const buildClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
