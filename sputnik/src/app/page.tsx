'use client';

import dynamic from 'next/dynamic';

// Dynamically import the game component with no SSR to avoid server-side rendering issues with Three.js
const GameContainer = dynamic(
  () => import('./components/game/GameContainer'),
  { ssr: false }
);

export default function Home() {
  return <GameContainer />;
}
