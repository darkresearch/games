'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/auth';
import Image from 'next/image';

// Create a separate component that uses useSearchParams
function LoginContent() {
  const { isAuthenticated, isLoading, session, user, signInWithTwitter } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Check for auth parameters
  useEffect(() => {
    // Check for error
    const error = searchParams.get('error');
    if (error) {
      console.error('Auth error detected:', error);
      setAuthError(error);
      return;
    }
    
    // Check for code/provider parameters that indicate callback
    const code = searchParams.get('code');
    const provider = searchParams.get('provider');
    
    if (code || provider) {
      console.log('Detected auth return parameters, auth should be completing...');
      setAuthInProgress(true);
    }
  }, [searchParams]);
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state in login page:', { 
      isAuthenticated, 
      isLoading, 
      hasSession: !!session,
      hasUser: !!user,
      authInProgress,
      authError
    });
    
    // If authenticated, redirect to home
    if (isAuthenticated && !isLoading && !authError) {
      console.log('User is authenticated, redirecting to home...');
      router.push('/');
    }
  }, [isAuthenticated, isLoading, session, user, authInProgress, authError, router]);
  
  // Add a useEffect to handle hash fragment errors
  useEffect(() => {
    // Check for error in URL hash fragment
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        // Parse error from hash
        const errorMatch = hash.match(/error=([^&]*)/);
        const errorDescMatch = hash.match(/error_description=([^&]*)/);
        
        if (errorMatch) {
          const error = decodeURIComponent(errorMatch[1]);
          const errorDesc = errorDescMatch 
            ? decodeURIComponent(errorDescMatch[1].replace(/\+/g, ' ')) 
            : 'Unknown error';
          
          console.error('Auth error from hash:', { error, errorDesc });
          setAuthError(`${error}: ${errorDesc}`);
          
          // Clear the hash from the URL to prevent showing the error again on refresh
          window.history.replaceState(
            null, 
            document.title, 
            window.location.pathname + window.location.search
          );
        }
      }
    }
  }, []);
  
  // Handle Twitter login click
  const handleTwitterLogin = async () => {
    console.log('Initiating Twitter sign-in...');
    setAuthError(null);
    setAuthInProgress(true);
    await signInWithTwitter();
  };
  
  // Show error state if there was an auth error
  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: '#131313', color: 'white', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div className="text-xl text-red-500 mb-4">Authentication Error</div>
        <div className="mb-6">There was a problem signing in with Twitter. Please try again.</div>
        <button 
          onClick={handleTwitterLogin}
          className="px-4 py-2 bg-black text-[#fafafa] rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2 cursor-pointer border border-gray-700"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
          </svg>
          Sign in with X
        </button>
      </div>
    );
  }
  
  // Show appropriate loading states
  if (authInProgress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: '#131313', color: 'white', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div className="text-xl">Authenticating with Twitter...</div>
      </div>
    );
  }
  
  if (isAuthenticated && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: '#131313', color: 'white', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div className="text-xl">Authenticated! Redirecting to game...</div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ 
      background: '#131313', 
      color: 'white', 
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' 
    }}>
      <div className="flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="DARK Logo" 
          width={60} 
          height={30} 
          priority
        />
        <h2 style={{ 
          color: '#63B3ED', 
          fontSize: '24px', 
          fontWeight: '600',
          margin: '12px 0 28px 0'
        }}>
          SPUTNIK
        </h2>
        <button 
          onClick={handleTwitterLogin}
          className="px-4 py-2 bg-black text-[#fafafa] rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2 cursor-pointer border border-gray-700"
          disabled={isLoading || authInProgress}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
          </svg>
          {isLoading ? 'Loading...' : 'Sign in with X'}
        </button>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ 
        background: '#131313', 
        color: 'white', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' 
      }}>
        <div className="flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="DARK Logo" 
            width={60} 
            height={30} 
            priority
          />
          <h2 style={{ 
            color: '#63B3ED', 
            fontSize: '24px', 
            fontWeight: '600',
            margin: '12px 0 28px 0'
          }}>
            Loading...
          </h2>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 