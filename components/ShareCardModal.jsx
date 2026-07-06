'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ------------------------------------------------------------------
   Canvas dimensions for each format (physical pixels at 2x density)
   Safe zones account for Instagram / Snapchat story UI chrome:
     - Portrait: 260px top + 260px bottom kept clear
     - Square  : 80px all sides
     - Landscape: 60px top + bottom
   ------------------------------------------------------------------ */
const FORMATS = {
  portrait: {
    label: 'Portrait',
    sublabel: '9:16 · Stories & Reels',
    icon: '▯',
    w: 1080,
    h: 1920,
    safeTop: 280,
    safeBottom: 280,
  },
  square: {
    label: 'Square',
    sublabel: '1:1 · Feed & WhatsApp',
    icon: '■',
    w: 1080,
    h: 1080,
    safeTop: 90,
    safeBottom: 90,
  },
  landscape: {
    label: 'Landscape',
    sublabel: '16:9 · Desktop & Twitter',
    icon: '▬',
    w: 1920,
    h: 1080,
    safeTop: 80,
    safeBottom: 80,
  },
};

/* ------------------------------------------------------------------
   Color palette (matching the app design system)
   ------------------------------------------------------------------ */
const C = {
  ink: '#0a0a0a',
  inkSoft: '#111111',
  inkRaised: '#1e1e1e',
  lime: '#c8ff00',
  limeSoft: '#daf748',
  paper: '#f5f5f0',
  grey400: '#888888',
  grey500: '#555555',
  grey600: '#2a2a2a',
};

/* ------------------------------------------------------------------
   Thin helper: draw rounded rectangle
   ------------------------------------------------------------------ */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ------------------------------------------------------------------
   Dot-grid helper
   ------------------------------------------------------------------ */
function drawDotGrid(ctx, w, h, color = 'rgba(245,245,240,0.06)', spacing = 40) {
  ctx.fillStyle = color;
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ------------------------------------------------------------------
   Word-wrap helper: returns array of lines that fit within maxWidth
   ------------------------------------------------------------------ */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ------------------------------------------------------------------
   Core canvas renderer — called once per generate
   ------------------------------------------------------------------ */
function renderCard(fmt, data) {
  const { w, h, safeTop, safeBottom } = FORMATS[fmt];
  const dpr = 1; // we already work at full resolution
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  /* background */
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, w, h);

  /* subtle dot grid */
  drawDotGrid(ctx, w, h);

  /* lime accent strip at top */
  const stripH = Math.round(h * 0.004);
  ctx.fillStyle = C.lime;
  ctx.fillRect(0, 0, w, stripH);

  /* safe-zone content bounds */
  const padH = Math.round(w * 0.08);
  const contentTop = safeTop;
  const contentBottom = h - safeBottom;
  const contentH = contentBottom - contentTop;
  const contentW = w - padH * 2;

  /* ── LOGO / brand badge ── */
  const badgeY = contentTop + Math.round(contentH * 0.05);
  ctx.fillStyle = C.grey600;
  roundRect(ctx, padH, badgeY, Math.round(w * 0.22), Math.round(h * 0.028), 100);
  ctx.fill();

  // pulseDot
  ctx.fillStyle = C.lime;
  ctx.beginPath();
  ctx.arc(padH + Math.round(w * 0.032), badgeY + Math.round(h * 0.014), Math.round(w * 0.008), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.paper;
  ctx.font = `bold ${Math.round(w * 0.018)}px 'Anton', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('GARUNNA', padH + Math.round(w * 0.054), badgeY + Math.round(h * 0.014));

  /* ── Section label ── */
  const labelY = badgeY + Math.round(h * 0.07);
  ctx.fillStyle = C.lime;
  ctx.font = `${Math.round(w * 0.015)}px 'JetBrains Mono', monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(data.section.toUpperCase(), padH, labelY);

  /* ── Main title ── */
  const titleSize = fmt === 'landscape' ? Math.round(w * 0.055) : Math.round(w * 0.075);
  ctx.fillStyle = C.paper;
  ctx.font = `${titleSize}px 'Anton', sans-serif`;
  ctx.textBaseline = 'top';

  const titleLines = wrapText(ctx, data.title, contentW);
  let cursorY = labelY + Math.round(h * 0.04);
  for (const line of titleLines) {
    // Highlight accent word(s) in lime
    if (data.accentWord && line.includes(data.accentWord)) {
      const before = line.substring(0, line.indexOf(data.accentWord));
      const accent = data.accentWord;
      const after = line.substring(line.indexOf(data.accentWord) + accent.length);
      const bw = ctx.measureText(before).width;
      const aw = ctx.measureText(accent).width;
      ctx.fillStyle = C.paper;
      ctx.fillText(before, padH, cursorY);
      ctx.fillStyle = C.lime;
      ctx.fillText(accent, padH + bw, cursorY);
      ctx.fillStyle = C.paper;
      ctx.fillText(after, padH + bw + aw, cursorY);
    } else {
      ctx.fillStyle = C.paper;
      ctx.fillText(line, padH, cursorY);
    }
    cursorY += titleSize * 1.1;
  }

  /* ── Tagline / subtitle ── */
  cursorY += Math.round(h * 0.01);
  ctx.fillStyle = C.grey400;
  ctx.font = `italic ${Math.round(w * 0.022)}px 'Space Grotesk', sans-serif`;
  ctx.textBaseline = 'top';
  const tagLines = wrapText(ctx, data.tagline, contentW * 0.85);
  for (const line of tagLines) {
    ctx.fillText(line, padH, cursorY);
    cursorY += Math.round(w * 0.022) * 1.4;
  }

  /* ── Card / stats block ── */
  cursorY += Math.round(h * 0.02);
  const cardPad = Math.round(w * 0.05);
  const cardRadius = Math.round(w * 0.025);

  if (data.stats && data.stats.length > 0) {
    /* Stats grid */
    const statCols = data.stats.length <= 3 ? data.stats.length : 2;
    const statRows = Math.ceil(data.stats.length / statCols);
    const statW = Math.floor(contentW / statCols);
    const statH = Math.round(h * 0.09);
    const gridH = statRows * statH + (statRows - 1) * Math.round(h * 0.01);

    /* card bg */
    ctx.fillStyle = C.inkRaised;
    roundRect(ctx, padH, cursorY, contentW, gridH + cardPad * 2, cardRadius);
    ctx.fill();

    /* border */
    ctx.strokeStyle = C.grey600;
    ctx.lineWidth = 1.5;
    roundRect(ctx, padH, cursorY, contentW, gridH + cardPad * 2, cardRadius);
    ctx.stroke();

    for (let i = 0; i < data.stats.length; i++) {
      const col = i % statCols;
      const row = Math.floor(i / statCols);
      const sx = padH + col * statW + cardPad;
      const sy = cursorY + cardPad + row * (statH + Math.round(h * 0.01));

      ctx.fillStyle = C.grey400;
      ctx.font = `${Math.round(w * 0.014)}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText(data.stats[i].label.toUpperCase(), sx, sy);

      ctx.fillStyle = C.lime;
      ctx.font = `bold ${Math.round(w * 0.032)}px 'Anton', sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(data.stats[i].value, sx, sy + Math.round(h * 0.022));
    }

    cursorY += gridH + cardPad * 2 + Math.round(h * 0.025);
  }

  /* ── Description text ── */
  if (data.description) {
    const descSize = Math.round(w * 0.02);
    ctx.fillStyle = C.paper;
    ctx.globalAlpha = 0.85;
    ctx.font = `${descSize}px 'Space Grotesk', sans-serif`;
    ctx.textBaseline = 'top';
    const descLines = wrapText(ctx, data.description, contentW);
    const maxDescLines = fmt === 'portrait' ? 4 : 3;
    for (let i = 0; i < Math.min(descLines.length, maxDescLines); i++) {
      ctx.fillText(descLines[i], padH, cursorY);
      cursorY += descSize * 1.55;
    }
    ctx.globalAlpha = 1;
  }

  /* ── Praise / highlight quote ── */
  if (data.praise) {
    cursorY += Math.round(h * 0.015);
    const praiseSize = Math.round(w * 0.018);
    ctx.fillStyle = C.limeSoft;
    ctx.font = `${praiseSize}px 'Space Grotesk', sans-serif`;
    ctx.textBaseline = 'top';
    const praiseLines = wrapText(ctx, data.praise, contentW);
    const maxPraiseLines = fmt === 'portrait' ? 3 : 2;
    for (let i = 0; i < Math.min(praiseLines.length, maxPraiseLines); i++) {
      ctx.fillText(praiseLines[i], padH, cursorY);
      cursorY += praiseSize * 1.5;
    }
  }

  /* ── Bottom watermark / CTA ── */
  const footerY = contentBottom - Math.round(h * 0.04);
  ctx.fillStyle = C.grey500;
  ctx.font = `${Math.round(w * 0.016)}px 'JetBrains Mono', monospace`;
  ctx.textBaseline = 'bottom';
  ctx.fillText('garunna.app · Discover your runner type', padH, footerY);

  /* ── Safe zone indicator lines (very faint) — helps user see the edge ── */
  ctx.strokeStyle = 'rgba(200,255,0,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, safeTop);
  ctx.lineTo(w, safeTop);
  ctx.moveTo(0, h - safeBottom);
  ctx.lineTo(w, h - safeBottom);
  ctx.stroke();
  ctx.setLineDash([]);

  return canvas;
}

/* ------------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------------ */
export default function ShareCardModal({ isOpen, onClose, data }) {
  const [fmt, setFmt] = useState('portrait');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [shareStatus, setShareStatus] = useState(''); // '', 'downloading', 'sharing', 'done'
  const canvasRef = useRef(null);

  /* Generate preview whenever format changes or modal opens */
  const generate = useCallback(() => {
    if (!data) return;
    setGenerating(true);
    // Defer to next tick so the UI can show the spinner
    setTimeout(() => {
      try {
        const canvas = renderCard(fmt, data);
        setPreviewUrl(canvas.toDataURL('image/png'));
        canvasRef.current = canvas;
      } catch (e) {
        console.error('Card render error', e);
      } finally {
        setGenerating(false);
      }
    }, 30);
  }, [fmt, data]);

  useEffect(() => {
    if (isOpen && data) generate();
  }, [isOpen, fmt, data, generate]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setShareStatus('');
    }
  }, [isOpen]);

  function getFilename() {
    const slug = (data?.title || 'garunna-result').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `garunna-${slug}-${fmt}.png`;
  }

  async function handleDownload() {
    if (!canvasRef.current) return;
    setShareStatus('downloading');
    const link = document.createElement('a');
    link.download = getFilename();
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    setTimeout(() => setShareStatus(''), 1500);
  }

  async function handleShare() {
    if (!canvasRef.current) return;
    setShareStatus('sharing');
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) { setShareStatus(''); return; }
        const file = new File([blob], getFilename(), { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `GARUNNA — ${data?.title || 'My Result'}`,
            text: data?.tagline || 'Check out my runner type on GARUNNA!',
          });
          setShareStatus('done');
        } else {
          // Fallback: download
          const link = document.createElement('a');
          link.download = getFilename();
          link.href = URL.createObjectURL(blob);
          link.click();
          setShareStatus('done');
        }
        setTimeout(() => setShareStatus(''), 2000);
      }, 'image/png');
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
      setShareStatus('');
    }
  }

  if (!isOpen) return null;

  const fmtConfig = FORMATS[fmt];
  // Preview aspect ratio (CSS)
  const previewAspect = `${fmtConfig.w} / ${fmtConfig.h}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-grey-600 bg-ink-soft overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-600">
          <div>
            <p className="font-display text-lg">Share your result</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mt-0.5">
              Choose a format, then share or download
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full border border-grey-600 text-grey-400 hover:border-lime hover:text-lime transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format picker */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">Format</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FORMATS).map(([key, f]) => (
                <button
                  key={key}
                  onClick={() => setFmt(key)}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    fmt === key
                      ? 'border-lime bg-lime/5 text-lime'
                      : 'border-grey-600 hover:border-grey-400 text-grey-400'
                  }`}
                >
                  <span className="block text-2xl mb-1.5">{f.icon}</span>
                  <span className="block font-mono text-[11px] font-semibold uppercase tracking-widest">
                    {f.label}
                  </span>
                  <span className="block font-mono text-[10px] text-grey-500 mt-0.5">
                    {f.sublabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Safe zone info banner */}
          {fmt === 'portrait' && (
            <div className="flex items-start gap-3 rounded-xl border border-lime/20 bg-lime/5 px-4 py-3">
              <span className="text-lime text-lg mt-0.5">⚠</span>
              <p className="font-mono text-[11px] text-lime/80 leading-relaxed">
                Portrait mode has safe zones at top & bottom — your content will stay clear of
                Instagram / Snapchat story UI (username, reply bar, etc.)
              </p>
            </div>
          )}

          {/* Preview */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">Preview</p>
            <div
              className="mx-auto overflow-hidden rounded-xl border border-grey-600 bg-ink"
              style={{
                aspectRatio: previewAspect,
                maxHeight: fmt === 'portrait' ? '55vh' : fmt === 'square' ? '40vh' : '32vh',
                width: fmt === 'portrait' ? 'auto' : '100%',
              }}
            >
              {generating ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-grey-400 animate-pulse">Rendering…</span>
                </div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Share card preview"
                  className="w-full h-full object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-grey-600 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            disabled={!previewUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-grey-600 px-4 py-3 text-sm font-semibold hover:border-lime hover:text-lime transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {shareStatus === 'downloading' ? (
              <span className="animate-pulse">Saving…</span>
            ) : (
              <>
                <span>↓</span> Download PNG
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            disabled={!previewUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-lime text-ink font-semibold px-4 py-3 text-sm hover:bg-lime-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {shareStatus === 'sharing' ? (
              <span className="animate-pulse">Opening…</span>
            ) : shareStatus === 'done' ? (
              <span>✓ Shared!</span>
            ) : (
              <>
                <span>↗</span> Share to…
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
