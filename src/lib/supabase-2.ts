import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[PrimeOS] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env\n' +
    'Copy .env.example to .env and fill in your Supabase credentials.'
  )
}

// Use placeholder values so the client doesn't crash on import when env vars
// are missing — the app will still show an error state instead of a white screen.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
