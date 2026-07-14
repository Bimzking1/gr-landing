'use client';

import { useState } from 'react';
import { EXPERIENCE_LEVELS, SHOE_MODIFIERS, GOAL_MODIFIERS, computeProjection } from '@/lib/projection';
import ShareCardModal from './ShareCardModalRunningProfile';

export default function ProjectionGame() {
  const [experienceId, setExperienceId] = useState(EXPERIENCE_LEVELS[0].id);
  const [shoeId, setShoeId] = useState(SHOE_MODIFIERS[0].id);
  const [goalId, setGoalId] = useState(GOAL_MODIFIERS[0].id);
  const [hasPacer, setHasPacer] = useState(false);
  const [projection, setProjection] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  function run() {
    setProjection(computeProjection({ experienceId, shoeId, goalId, hasPacer }));
  }

  const experienceLabel = EXPERIENCE_LEVELS.find((e) => e.id === experienceId)?.label ?? '';
  const goalLabel = GOAL_MODIFIERS.find((g) => g.id === goalId)?.label ?? '';

  /* Build the data object passed to ShareCardModal */
  const shareData = projection
    ? {
        section: 'Season Projection',
        title: 'MY NEXT SEASON',
        accentWord: 'SEASON',
        tagline: `${experienceLabel} · Goal: ${goalLabel}${hasPacer ? ' · With pacer' : ''}`,
        description: null,
        praise: null,
        stats: [
          { label: 'Projected Pace', value: projection.pace },
          { label: 'Daily Mileage', value: `${projection.dailyKm} km` },
          { label: 'Longest Run', value: projection.longestRun },
        ],
      }
    : null;

  return (
    <>
      <section id="projection" className="relative border-b border-grey-600/40 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-lime">Mini game</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">
            PROJECT YOUR
            <br />
            NEXT SEASON.
          </h2>
          <p className="mt-4 text-grey-400">
            Same gear, one more question about where you&rsquo;re at. We&rsquo;ll project your pace,
            your daily mileage, and how far you could realistically go.
          </p>
        </div>

        <div className="mt-10 max-w-md mx-auto rounded-2xl border border-grey-600/60 bg-ink-soft p-6 sm:p-8">
          <div className="space-y-6">
            <Picker
              label="How long have you been running?"
              value={experienceId}
              onChange={setExperienceId}
              options={EXPERIENCE_LEVELS}
            />
            <Picker
              label="Your shoes"
              value={shoeId}
              onChange={setShoeId}
              options={SHOE_MODIFIERS}
            />
            <Picker
              label="Your goal"
              value={goalId}
              onChange={setGoalId}
              options={GOAL_MODIFIERS}
            />

            <label className="flex items-center gap-3 rounded-xl border border-grey-600 bg-ink px-4 py-3.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasPacer}
                onChange={(e) => setHasPacer(e.target.checked)}
                className="h-4 w-4 accent-lime"
              />
              I run with a pacer or a regular running buddy
            </label>

            <button
              onClick={run}
              className="w-full rounded-xl bg-lime text-ink font-semibold px-4 py-3.5 hover:bg-lime-soft transition-colors"
            >
              Project my stats →
            </button>
          </div>

          {projection && (
            <div className="mt-8 pt-6 border-t border-grey-600 animate-floatUp">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Projected pace" value={projection.pace} />
                <Stat label="Daily mileage" value={`${projection.dailyKm} km`} />
                <Stat label="Longest run" value={projection.longestRun} />
              </div>

              {/* Share action */}
              <div className="mt-5">
                <button
                  onClick={() => setShareOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-lime/40 text-lime px-4 py-3 text-sm font-semibold hover:bg-lime/5 transition-colors"
                >
                  <span>↗</span> Share my projection
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <ShareCardModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        data={shareData}
      />
    </>
  );
}

function Picker({ label, value, onChange, options }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`rounded-xl border px-3 py-2.5 text-xs text-left transition-colors ${
              value === opt.id
                ? 'border-lime text-lime bg-lime/5'
                : 'border-grey-600 hover:border-grey-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-grey-400">{label}</p>
      <p className="mt-1 font-display text-xl text-lime">{value}</p>
    </div>
  );
}
