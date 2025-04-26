'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import AuthContext from './AuthContext';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSputnikUuid, setUserSputnikUuid] = useState<string | null>(null);
  const [sputnikCreationNumber, setSputnikCreationNumber] = useState<number | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth and checking session...');
        
        // Force a session refresh on every page load
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        console.log('Initial session check:', { 
          hasSession: !!sessionData.session,
          user: sessionData.session?.user?.email
        });
        
        // If we have a session, update state
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          
          // Fetch the user's sputnik UUID if we have a user
          if (sessionData.session.user) {
            fetchUserSputnikUuid(sessionData.session.user.id);
          }
        } else {
          // Try refreshing the session one more time
          const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
          
          if (refreshError) {
            console.log('Session refresh failed:', refreshError.message);
          } else if (refreshData.session) {
            console.log('Session refreshed successfully');
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            
            if (refreshData.session.user) {
              fetchUserSputnikUuid(refreshData.session.user.id);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes with better handling of events
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, hasUser: !!session?.user });
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Handle successful sign-in or token refresh
          if (session) {
            setSession(session);
            setUser(session.user);
            
            if (session.user) {
              fetchUserSputnikUuid(session.user.id);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Reset state on sign out
          setSession(null);
          setUser(null);
          setUserSputnikUuid(null);
          setSputnikCreationNumber(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Get user's Sputnik UUID from database
  const fetchUserSputnikUuid = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('user_sputniks')
        .select('sputnik_uuid, sputnik_creation_number')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user sputnik:', error);
        // No fallback, set to null
        setUserSputnikUuid(null);
        setSputnikCreationNumber(null);
      } else if (data) {
        setUserSputnikUuid(data.sputnik_uuid);
        setSputnikCreationNumber(data.sputnik_creation_number);
      }
    } catch (error) {
      console.error('Error in sputnik fetch:', error);
      // No fallback, set to null
      setUserSputnikUuid(null);
      setSputnikCreationNumber(null);
    }
  };

  const signInWithTwitter = async () => {
    try {
      console.log('Initiating Twitter sign-in flow...');
      
      // Determine the appropriate redirect URL based on environment
      let redirectUrl: string | undefined;
      if (typeof window !== 'undefined') {
        // Always use production URL to rule out hostname detection issues
        redirectUrl = 'https://sputnik.darkresearch.ai/auth/callback';
      }
      
      console.log('Using redirect URL:', redirectUrl);

      // Configure Supabase to allow minimal profile without email requirement
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          scopes: 'email',
          queryParams: {
            // Twitter v2 API requires these scopes
            'screen_name': 'true',   // Get the user's screen name
            'include_email': 'true', // Request email (may require additional verification)
          }
        }
      });
      
      if (error) {
        console.error('Twitter sign-in error:', error);
      } else {
        console.log('Twitter sign-in initiated, URL:', data?.url);
        // The browser will automatically redirect to Twitter
      }
    } catch (error) {
      console.error('Error signing in with Twitter:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      // Set to null on sign out
      setUserSputnikUuid(null);
      setSputnikCreationNumber(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userSputnikUuid,
        sputnikCreationNumber,
        isAuthenticated: !!user,
        signInWithTwitter,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 