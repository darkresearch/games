/**
 * Responsive style helpers for mobile optimization
 */

import { CSSProperties } from 'react';
import { MOBILE_BREAKPOINT } from '../hooks/useIsMobile';

// Common style variants
export type StyleVariant = 'desktop' | 'mobile';

// Utility to merge multiple style objects with proper precedence
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeStyles = (...styles: any[]): CSSProperties => 
  Object.assign({}, ...styles);

// Generate media query string for CSS-in-JS
export const mobileMediaQuery = `@media (max-width: ${MOBILE_BREAKPOINT}px)`;

// Panel style generators
export const getPanelBaseStyles = (variant: StyleVariant): CSSProperties => {
  const baseStyles: CSSProperties = {
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 5px rgba(66, 153, 225, 0.3)',
    border: '1px solid rgba(250, 250, 250, 0.2)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'white',
  };

  if (variant === 'mobile') {
    return mergeStyles(baseStyles, {
      borderRadius: '6px',
      boxShadow: '0 0 10px rgba(0,0,0,0.4)',
    });
  }

  return baseStyles;
};

// Reusable touch-friendly style adjustments
export const touchFriendlyStyles: CSSProperties = {
  minHeight: '44px',
  minWidth: '44px',
  padding: '12px',
  touchAction: 'manipulation',
};

// Panel-specific responsive styles
export const panelStyles = {
  // Chat panel responsive styles
  chat: {
    desktop: {
      position: 'absolute',
      bottom: '0',
      right: '20px',
      width: '400px',
      maxHeight: '530px',
      zIndex: 1000,
    } as CSSProperties,
    mobile: {
      position: 'absolute',
      bottom: '0',
      right: '0',
      left: '0',
      width: '100%',
      maxHeight: '35vh',
      borderRadius: '8px 8px 0 0',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    } as CSSProperties,
  },
  
  // Nav panel responsive styles
  nav: {
    desktop: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '280px',
      padding: '12px 16px',
      zIndex: 900,
    } as CSSProperties,
    mobile: {
      position: 'absolute',
      top: 'calc(10px + env(safe-area-inset-top, 0px))',
      right: '10px',
      width: '160px',
      padding: '8px 10px',
      zIndex: 900,
      fontSize: '12px',
    } as CSSProperties,
  },
  
  // Planet panel responsive styles
  planet: {
    desktop: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      maxWidth: '90%',
      zIndex: 950,
    } as CSSProperties,
    mobile: {
      position: 'absolute',
      top: 'env(safe-area-inset-top, 0px)',
      left: '0',
      width: '100%',
      height: 'calc(100% - env(safe-area-inset-bottom, 0px))',
      maxWidth: '100%',
      maxHeight: '100%',
      borderRadius: '0',
      zIndex: 950,
    } as CSSProperties,
  },
  
  // Logo panel responsive styles
  logo: {
    desktop: {
      position: 'absolute', 
      top: '27px',
      left: '28px',
      zIndex: 900,
    } as CSSProperties,
    mobile: {
      position: 'absolute',
      top: 'calc(10px + env(safe-area-inset-top, 0px))',
      left: '10px',
      zIndex: 900,
    } as CSSProperties,
  },
}; 