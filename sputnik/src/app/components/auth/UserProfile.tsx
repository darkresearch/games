'use client';

import { useAuth } from './AuthContext';
import Image from 'next/image';

export default function UserProfile() {
  const { user, isAuthenticated, isLoading, userSputnikUuid, signOut } = useAuth();
  
  if (isLoading) {
    return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>;
  }
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-2">
      {/* User profile info */}
      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-md">
        {user.user_metadata.avatar_url && (
          <Image 
            src={user.user_metadata.avatar_url} 
            alt={user.user_metadata.name || 'User'} 
            width={32} 
            height={32} 
            className="rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.user_metadata.name}</span>
          <span className="text-xs text-gray-400">Sputnik: {userSputnikUuid?.substring(0, 8)}...</span>
        </div>
      </div>
      
      {/* Sign out button */}
      <button 
        onClick={signOut}
        className="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors w-full text-center"
      >
        Sign Out
      </button>
    </div>
  );
} 