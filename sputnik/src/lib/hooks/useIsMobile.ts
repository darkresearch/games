'use client';

import { useState, useEffect } from 'react';

// iPhone 16 width is around 390px, adding some buffer
export const MOBILE_BREAKPOINT = 600;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check on initial load
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Run on mount
    checkIsMobile();
    
    // Set up resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
} 