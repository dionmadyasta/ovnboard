import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Waduh bro! URL atau Key Supabase kamu belom di-set di .env.local!")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
