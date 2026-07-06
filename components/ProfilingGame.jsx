'use client';

import { useState } from 'react';
import { GEAR_STEPS, matchRunnerType } from '@/lib/runnerTypes';
import ShareCardModal from './ShareCardModal';

const TOTAL_STEPS = GEAR_STEPS.length + 1; // + lead-capture step

export default function ProfilingGame() {
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState([]);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const isLeadStep = stepIndex === GEAR_STEPS.length;
  const step = GEAR_STEPS[stepIndex];

  function choose(option) {
    const nextPicks = [...picks, option.axes];
    setPicks(nextPicks);
    setStepIndex((i) => i + 1);
  }

  function reveal() {
    setResult(matchRunnerType(picks));
  }

  function restart() {
    setStepIndex(0);
    setPicks([]);
    setResult(null);
    setNickname('');
    setEmail('');
  }

  /* Build the data object passed to ShareCardModal */
  const shareData = result
    ? {
      section: 'My Runner Type:',
      title: result.name,
      accentWord: null,
      tagline: result.tagline,
      description: result.description,
      praise: result.praise,
      stats: [],
    }
    : null;

  return (
    <>
      <section id="profiling" className="relative border-b border-grey-600/40 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-lime">Mini game</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">
            WHAT&rsquo;S YOUR
            <br />
            RUNNER TYPE?
          </h2>
          <p className="mt-4 text-grey-400">
            Pick your gear, your time, your goal. We&rsquo;ll reveal your runner type — then dare your
            friends to see if theirs beats it.
          </p>
        </div>

        <div className="mt-10 max-w-md mx-auto rounded-2xl border border-grey-600/60 bg-ink-soft p-6 sm:p-8">
          {!result && !isLeadStep && step && (
            <div key={step.id} className="animate-floatUp">
              <div className="flex items-center gap-2 mb-6">
                {GEAR_STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-lime' : 'bg-grey-600'
                      }`}
                  />
                ))}
              </div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400">
                Step {stepIndex + 1} of {GEAR_STEPS.length}
              </p>
              <h3 className="mt-2 font-display text-2xl">{step.title}</h3>
              <p className="mt-1 text-sm text-grey-400">{step.subtitle}</p>

              <div className="mt-6 grid grid-cols-1 gap-2.5">
                {step.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => choose(opt)}
                    className="text-left rounded-xl border border-grey-600 bg-ink px-4 py-3.5 text-sm hover:border-lime hover:text-lime transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!result && isLeadStep && (
            <div className="animate-floatUp text-left">
              <h3 className="font-display text-2xl text-center">Almost there</h3>
              <p className="mt-1 text-sm text-grey-400 text-center">
                One tap away from your runner type.
              </p>
              <div className="mt-6 space-y-3">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="w-full rounded-xl border border-grey-600 bg-ink px-4 py-3.5 text-sm placeholder:text-grey-500 focus:outline-none focus:border-lime"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email — we'll notify you at launch"
                  className="w-full rounded-xl border border-grey-600 bg-ink px-4 py-3.5 text-sm placeholder:text-grey-500 focus:outline-none focus:border-lime"
                />
                <button
                  onClick={reveal}
                  className="w-full rounded-xl bg-lime text-ink font-semibold px-4 py-3.5 hover:bg-lime-soft transition-colors"
                >
                  Reveal my runner type →
                </button>
                <p className="text-center font-mono text-[10px] uppercase tracking-widest text-grey-500">
                  No spam. We&rsquo;ll only reach out when GARUNNA drops.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="animate-floatUp text-center">
              <span className="font-mono text-[11px] uppercase tracking-widest text-lime">You are</span>
              <h3 className="mt-2 font-display text-3xl">{result.name}</h3>
              <p className="mt-1 text-sm text-grey-400 italic">{result.tagline}</p>
              <p className="mt-5 text-sm text-paper/90 leading-relaxed">{result.description}</p>
              <p className="mt-4 text-sm text-lime-soft leading-relaxed border-t border-grey-600 pt-4">
                {result.praise}
              </p>

              {/* Primary actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={restart}
                  className="flex-1 rounded-xl border border-grey-600 px-4 py-3 text-sm hover:border-lime hover:text-lime transition-colors"
                >
                  ↺ Try again
                </button>
                <a
                  href="#projection"
                  className="flex-1 rounded-xl bg-lime text-ink font-semibold px-4 py-3 text-sm hover:bg-lime-soft transition-colors"
                >
                  Project my pace →
                </a>
              </div>

              {/* Share action */}
              <div className="mt-3">
                <button
                  onClick={() => setShareOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-lime/40 text-lime px-4 py-3 text-sm font-semibold hover:bg-lime/5 transition-colors"
                >
                  <span>↗</span> Share my runner type
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
