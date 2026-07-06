'use client';

import { useCallback } from 'react';

// Ambient dot-grid background (reactbits.dev "dot grid" style), kept
// low-contrast against the black page with a slight glow that follows
// the pointer, only visible on hover so it never competes with content.
export default function DotGrid({ className = '' }) {
  const handleMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mx', `${x}%`);
    e.currentTarget.style.setProperty('--my', `${y}%`);
  }, []);

  return (
    <div className={`dot-grid-wrap absolute inset-0 overflow-hidden ${className}`} onMouseMove={handleMove}>
      <div className="dot-grid" />
      <div className="dot-grid-glow" />
    </div>
  );
}
