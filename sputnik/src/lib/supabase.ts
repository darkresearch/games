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
  supabaseAnonKey || 'placeholder-anon-key'
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

// Type definition for spaceship state data
export type SpaceshipStateData = {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number, number];
  fuel: number;
  target_planet_id: string | null;
  updated_at: string;
};

// Utility functions for working with spaceship state
export const spaceshipState = {
  // Get the current spaceship state
  async getState(): Promise<SpaceshipStateData | null> {
    const { data, error } = await supabaseClient
      .from('spaceship_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching spaceship state:', error);
      return null;
    }

    return data as SpaceshipStateData;
  },

  // Subscribe to changes in the spaceship state (client-side only)
  subscribeToState(callback: (state: SpaceshipStateData) => void) {
    return supabaseClient
      .channel('spaceship_state_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spaceship_state',
        },
        (payload) => {
          callback(payload.new as SpaceshipStateData);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'spaceship_state',
        },
        (payload) => {
          callback(payload.new as SpaceshipStateData);
        }
      )
      .subscribe();
  },

  // Update the spaceship state (server-side only)
  async updateState(newState: Partial<SpaceshipStateData>) {
    // This should only be called from API routes (server-side)
    if (typeof window !== 'undefined') {
      console.error('updateState can only be called from server-side code');
      return { data: null, error: new Error('Cannot update state from client') };
    }

    // Use the admin client for state updates
    return await supabaseAdmin.from('spaceship_state').upsert(newState, {
      onConflict: 'id'
    });
  },
}; 