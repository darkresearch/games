'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './components/auth';

// Dynamically import the game component with no SSR to avoid server-side rendering issues with Three.js
const GameContainer = dynamic(
  () => import('./components/game/GameContainer'),
  { ssr: false }
);

export default function Home() {
  const { isAuthenticated, isLoading, user, session } = useAuth();
  const router = useRouter();

  // Debug authentication state
  useEffect(() => {
    console.log('Auth state in home page:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user,
      hasSession: !!session 
    });
  }, [isAuthenticated, isLoading, user, session]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login page...');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  // Ensure user is authenticated before showing game
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    );
  }

  // Show game container when authenticated
  return (
    <>
      <GameContainer />
    </>
  );
}
