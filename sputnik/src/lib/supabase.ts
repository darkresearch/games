import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Warning: Supabase URL or anon key is missing. Using placeholder values. The app will not function correctly.'
  );
}

// Create a Supabase client for client-side (public) operations
export const supabaseClient = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Create an admin client for server-side operations (API routes only)
// This should never be exposed to the client
export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || supabaseAnonKey || 'placeholder-anon-key'
);

if (!supabaseServiceRoleKey && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: SUPABASE_SERVICE_ROLE_KEY is not defined. Backend operations will use the anon key in development mode, but this is not secure for production.'
  );
} else if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
  console.error(
    'Error: SUPABASE_SERVICE_ROLE_KEY is not defined in production mode. Backend operations will not function correctly.'
  );
} 