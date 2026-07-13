'use client';

import { useState, useMemo, useRef } from 'react';
import { QUIZ_STEPS, RUNNER_ARCHETYPES, RARITY_CARDS, RARITY_STATS, matchRunnerType } from '@/lib/runnerTypes';
import ShareCardModal from './ShareCardModal';

const TOTAL_SCORED_STEPS = QUIZ_STEPS.length;

export default function ProfilingGame() {
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [nickname, setNickname] = useState('');
  const [result, setResult] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const sectionRef = useRef(null);

  const isNameStep = stepIndex === TOTAL_SCORED_STEPS;
  const step = QUIZ_STEPS[stepIndex];

  // Pick random description & quote indices once per result
  const randomIdx = useMemo(() => ({
    desc: Math.floor(Math.random() * 3),
    quote: Math.floor(Math.random() * 3),
  }), [result]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(option) {
    const next = [...choices, option.id];
    setChoices(next);
    setStepIndex(i => i + 1);
  }

  function reveal() {
    const matched = matchRunnerType(choices);
    setResult(matched);
  }

  function restart() {
    setStepIndex(0);
    setChoices([]);
    setResult(null);
    setNickname('');
    // Scroll back up to the profiling section
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  const progressPercent = Math.min(((stepIndex) / TOTAL_SCORED_STEPS) * 100, 100);

  const cardStats = result ? RARITY_STATS[result.rarity] : null;

  const shareData = result
    ? {
      mode: 'runner-type',
      section: 'My Runner Type:',
      title: result.title,
      name: nickname || 'Runner',
      rarity: result.rarity,
      emoji: result.emoji,
      tagline: result.tagline,
      description: result.descriptions[randomIdx.desc],
      quote: result.quotes[randomIdx.quote],
      cardImage: RARITY_CARDS[result.rarity],
      signatureMoves: result.signatureMoves,
      starterPack: result.starterPack,
      stats: cardStats,
    }
    : null;

  return (
    <>
      <section id="profiling" ref={sectionRef} className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto glass-panel p-8 sm:p-12">
          {!result && (
            <div className="max-w-2xl mx-auto text-center mb-10">
              <span className="font-mono text-xs uppercase tracking-widest text-lime">Mini game</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">
                OWN YOUR
                <br />
                <span className="text-lime">RUNNER</span> CARD.
              </h2>
              <p className="mt-4 text-grey-400">
                GARUNNA is a running app that knows exactly what kind of runner you are.
                Find out now then challenge your friends to try.
              </p>
            </div>
          )}

          <div className="max-w-lg mx-auto">
          {/* ── Quiz steps ── */}
          {!result && !isNameStep && step && (
            <div key={step.id} className="animate-floatUp">
              <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-2">
                Step {stepIndex + 1} of {TOTAL_SCORED_STEPS}
              </p>
              <h3 className="font-display text-2xl text-lime">{step.title} :</h3>
              <p className="mt-1 text-sm text-grey-400">{step.subtitle}</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {step.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => choose(opt)}
                    className="flex items-center justify-between text-left rounded-xl border border-grey-600 bg-ink/50 px-4 py-3.5 text-sm hover:border-lime hover:text-lime transition-colors group"
                  >
                    <span>{opt.label}</span>
                    <span className="text-grey-500 group-hover:text-lime transition-colors">→</span>
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-grey-600 overflow-hidden">
                  <div
                    className="h-full bg-lime rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/newer-design/card-together.png"
                  alt="Cards"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* ── Name step ── */}
          {!result && isNameStep && (
            <div className="animate-floatUp text-center">
              <h3 className="font-display text-2xl">Almost there</h3>
              <p className="mt-1 text-sm text-grey-400">
                One tap away from your runner card.
              </p>
              <div className="mt-6 space-y-3">
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="w-full rounded-xl border border-grey-600 bg-ink/50 px-4 py-3.5 text-sm placeholder:text-grey-500 focus:outline-none focus:border-lime"
                />
                {!nickname.trim() && (
                  <p className="text-xs text-red-400 -mt-1">Please enter your name to continue</p>
                )}
                <button
                  onClick={reveal}
                  disabled={!nickname.trim()}
                  className="w-full rounded-xl bg-lime text-ink font-semibold px-4 py-3.5 hover:bg-lime-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reveal my runner card →
                </button>
              </div>

              {/* Progress bar full */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-grey-600 overflow-hidden">
                  <div className="h-full bg-lime rounded-full w-full" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/newer-design/card-together.png"
                  alt="Cards"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && (
            <div className="animate-floatUp">
              {/* Header */}
              <p className="text-center font-mono text-xs uppercase tracking-widest text-lime font-bold mb-4">
                CONGRATULATIONS !!!
              </p>

              {/* Name & type */}
              <div className="text-center mb-6">
                <h3 className="font-display text-3xl">{nickname || 'Runner'}</h3>
                <p className="text-grey-400 text-sm mt-1">
                  {result.emoji} {result.title}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-paper/90 leading-relaxed text-center mb-6">
                {result.descriptions[randomIdx.desc]}
              </p>

              {/* Card image with stats overlay */}
              <div className="flex justify-center mb-6">
                <div className="relative w-56 sm:w-64">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={RARITY_CARDS[result.rarity]}
                    alt={`${result.rarity} card`}
                    className="w-full h-auto drop-shadow-2xl"
                  />
                  {/* Stats overlay at bottom of card */}
                  {cardStats && (
                    <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[85%]">
                      {/* Name overlay */}
                      <div className="text-center mb-1">
                        <p className="font-display text-sm sm:text-base text-white drop-shadow-lg leading-tight">
                          {nickname || 'Runner'}
                        </p>
                        <p className="font-mono text-[8px] sm:text-[9px] text-white/60 uppercase tracking-wider">
                          {result.title}
                        </p>
                      </div>
                      {/* Divider */}
                      <div className="w-full h-px bg-white/20 my-2" />
                      {/* Pace | Duration | Distance */}
                      <div className="flex items-center justify-between text-center px-1">
                        <div className="flex-1">
                          <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-wider text-white/50">Pace</p>
                          <p className="font-display text-xs sm:text-sm text-white drop-shadow-lg">{cardStats.pace}</p>
                        </div>
                        <div className="w-px h-6 bg-white/20" />
                        <div className="flex-1">
                          <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-wider text-white/50">Duration</p>
                          <p className="font-display text-xs sm:text-sm text-white drop-shadow-lg">{cardStats.duration}</p>
                        </div>
                        <div className="w-px h-6 bg-white/20" />
                        <div className="flex-1">
                          <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-wider text-white/50">Distance</p>
                          <p className="font-display text-xs sm:text-sm text-white drop-shadow-lg">{cardStats.distance}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote */}
              <div className="glass-panel-inner p-4 text-center mb-6">
                <p className="text-lime italic text-sm">
                  {result.quotes[randomIdx.quote]}
                </p>
              </div>

              {/* Signature Moves & Starter Pack */}
              <div className="grid grid-cols-2 gap-4 mb-12">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-grey-400 mb-2">
                    Signature Moves
                  </p>
                  <p className="text-xs text-paper/80 leading-relaxed">
                    {result.signatureMoves.split(';').map(s => s.trim()).join('; ')}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-grey-400 mb-2">
                    Starter Pack / Gear
                  </p>
                  <p className="text-xs text-paper/80 leading-relaxed">
                    {result.starterPack.split(';').map(s => s.trim()).join('; ')}
                  </p>
                </div>
              </div>

              {/* Spotify Embed */}
              <div className="mb-6 rounded-xl overflow-hidden">
                <iframe
                  title="Spotify Playlist"
                  src={`https://open.spotify.com/embed/playlist/${result.spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '12px' }}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={restart}
                  className="flex-1 rounded-xl border border-grey-600 px-4 py-3 text-sm hover:border-lime hover:text-lime transition-colors"
                >
                  ↺ Try again
                </button>
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex-1 rounded-xl bg-lime text-ink font-semibold px-4 py-3 text-sm hover:bg-lime-soft transition-colors"
                >
                  ↗ Share to Instagram
                </button>
              </div>
            </div>
          )}
        </div>
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
