'use client';

/**
 * LoopingColumns — A grid-motion-inspired background with vertically
 * scrolling columns of runner card images. Each column loops infinitely
 * using a duplicated-image CSS animation technique (the same image is
 * placed twice so the seam is invisible when the translate resets).
 *
 * - Desktop: 4 columns
 * - Mobile:  2 columns (Frame1 & Frame2)
 *
 * Frame1/Frame3 scroll upward, Frame2/Frame4 scroll downward.
 */

const columns = [
  { src: '/newer-design/Frame1.png', direction: 'up' },
  { src: '/newer-design/Frame2.png', direction: 'down' },
  { src: '/newer-design/Frame3.png', direction: 'up' },
  { src: '/newer-design/Frame4.png', direction: 'down' },
];

export default function LoopingColumns({ className = '' }) {
  return (
    <div className={`looping-columns ${className}`}>
      {columns.map((col, i) => (
        <div
          key={i}
          className={`looping-column ${i >= 2 ? 'looping-column--desktop' : ''}`}
        >
          <div
            className={`looping-column__track looping-column__track--${col.direction}`}
          >
            {/* Two copies create a seamless loop */}
            <img src={col.src} alt="" aria-hidden="true" draggable={false} />
            <img src={col.src} alt="" aria-hidden="true" draggable={false} />
          </div>
        </div>
      ))}

      {/* Gradient overlays for top & bottom fade-to-black */}
      <div className="looping-columns__fade looping-columns__fade--top" />
      <div className="looping-columns__fade looping-columns__fade--bottom" />
    </div>
  );
}
