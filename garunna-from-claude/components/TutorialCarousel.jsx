'use client';

import { useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  {
    src: '/tutorial/strava-4.png',
    title: 'Log in to Strava',
    body: 'Open strava.com and log in with the account your activity is saved under.',
  },
  {
    src: '/tutorial/strava-3.png',
    title: 'Open your activities',
    body: 'From the navbar, open the "Training" dropdown and choose "My Activities".',
  },
  {
    src: '/tutorial/strava-2.png',
    title: 'Pick the activity',
    body: 'Scroll to the run you want and click its title, shown in blue.',
  },
  {
    src: '/tutorial/strava-1.png',
    title: 'Export the original file',
    body: 'Click the ⋯ menu and choose "Export Original". The .fit file downloads straight to your device — upload it below.',
  },
];

export default function TutorialCarousel() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  function openAt(i) {
    setIndex(i);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={() => openAt(0)}
        className="font-mono text-xs uppercase tracking-widest text-lime underline decoration-dotted underline-offset-4 hover:text-lime-soft transition-colors"
      >
        How do I get my .fit file? ↗
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-grey-600 bg-ink-soft overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close tutorial"
              className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-ink/80 border border-grey-600 text-paper hover:border-lime hover:text-lime transition-colors"
            >
              ×
            </button>

            <div className="relative aspect-[16/10] bg-ink">
              <Image
                src={SLIDES[index].src}
                alt={SLIDES[index].title}
                fill
                sizes="(max-width: 640px) 100vw, 576px"
                className="object-cover object-top"
              />
            </div>

            <div className="p-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-lime">
                Step {index + 1} of {SLIDES.length}
              </p>
              <h4 className="mt-1 font-display text-xl">{SLIDES[index].title}</h4>
              <p className="mt-2 text-sm text-grey-400">{SLIDES[index].body}</p>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? 'w-6 bg-lime' : 'w-1.5 bg-grey-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                    className="rounded-full border border-grey-600 px-4 py-2 text-xs disabled:opacity-30 hover:border-lime hover:text-lime transition-colors"
                  >
                    Back
                  </button>
                  {index < SLIDES.length - 1 ? (
                    <button
                      onClick={() => setIndex((i) => i + 1)}
                      className="rounded-full bg-lime text-ink px-4 py-2 text-xs font-semibold hover:bg-lime-soft transition-colors"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-lime text-ink px-4 py-2 text-xs font-semibold hover:bg-lime-soft transition-colors"
                    >
                      Got it
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
