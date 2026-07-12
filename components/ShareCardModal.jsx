'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ------------------------------------------------------------------
   Canvas dimensions — portrait only for runner-type, multi for others
   ------------------------------------------------------------------ */
const FORMATS = {
  portrait: {
    label: 'Portrait', sublabel: '9:16 · Stories & Reels', icon: '▯',
    w: 1080, h: 1920, safeTop: 280, safeBottom: 280,
  },
  square: {
    label: 'Square', sublabel: '1:1 · Feed & WhatsApp', icon: '■',
    w: 1080, h: 1080, safeTop: 90, safeBottom: 90,
  },
  landscape: {
    label: 'Landscape', sublabel: '16:9 · Desktop & Twitter', icon: '▬',
    w: 1920, h: 1080, safeTop: 80, safeBottom: 80,
  },
};

/* ── Layout config per format (used by legacy renderer) ── */
const LAYOUT = {
  portrait: {
    padH: 88, badge: { w: 250, h: 56, dotR: 9, dotOffX: 36, textSize: 30, textOffX: 60 },
    section: { size: 26, gapAfter: 52 }, badgeToSection: 110,
    title: { size: 128, lineH: 1.08, gapAfter: 18 },
    tagline: { size: 36, lineH: 1.5, maxW: 0.9, gapAfter: 44 },
    stats: { labelSize: 24, valueSize: 58, rowH: 155, colGap: 0, cardPad: 52, radius: 28, lineW: 1.5 },
    statsGapAfter: 46,
    desc: { size: 34, lineH: 1.65, maxLines: 4, gapAfter: 28 },
    praise: { size: 30, lineH: 1.55, maxLines: 3 },
    footer: { size: 26, fromBottom: 68 },
    safeLine: { color: 'rgba(200,255,0,0.07)' },
  },
  square: {
    padH: 80, badge: { w: 220, h: 48, dotR: 8, dotOffX: 32, textSize: 26, textOffX: 54 },
    section: { size: 22, gapAfter: 38 }, badgeToSection: 78,
    title: { size: 108, lineH: 1.08, gapAfter: 14 },
    tagline: { size: 30, lineH: 1.45, maxW: 0.9, gapAfter: 32 },
    stats: { labelSize: 20, valueSize: 48, rowH: 120, colGap: 0, cardPad: 42, radius: 24, lineW: 1.5 },
    statsGapAfter: 36,
    desc: { size: 28, lineH: 1.6, maxLines: 3, gapAfter: 20 },
    praise: { size: 24, lineH: 1.5, maxLines: 2 },
    footer: { size: 22, fromBottom: 54 },
    safeLine: { color: 'rgba(200,255,0,0.07)' },
  },
  landscape: {
    padH: 120, badge: { w: 290, h: 62, dotR: 11, dotOffX: 40, textSize: 34, textOffX: 68 },
    section: { size: 28, gapAfter: 44 }, badgeToSection: 84,
    title: { size: 102, lineH: 1.07, gapAfter: 16 },
    tagline: { size: 38, lineH: 1.4, maxW: 0.75, gapAfter: 36 },
    stats: { labelSize: 24, valueSize: 56, rowH: 130, colGap: 0, cardPad: 44, radius: 22, lineW: 1.5 },
    statsGapAfter: 38,
    desc: { size: 30, lineH: 1.55, maxLines: 3, gapAfter: 22 },
    praise: { size: 26, lineH: 1.5, maxLines: 2 },
    footer: { size: 26, fromBottom: 56 },
    safeLine: { color: 'rgba(200,255,0,0.07)' },
  },
};

/* ── colours ── */
const C = {
  ink: '#0a0a0a', inkSoft: '#111111', inkRaised: '#1e1e1e',
  lime: '#c8ff00', limeSoft: '#daf748',
  paper: '#f5f5f0', grey400: '#888888', grey500: '#555555', grey600: '#2a2a2a',
};

/* ── helpers ── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDotGrid(ctx, w, h, spacing = 44) {
  ctx.fillStyle = 'rgba(245,245,240,0.055)';
  for (let x = spacing; x < w; x += spacing)
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ── Load image as promise ── */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ── Runner-type portrait renderer (uses Share Background) ── */
async function renderRunnerCard(data) {
  const w = 1080, h = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Try to load share background
  try {
    const bg = await loadImage('/newer-design/Share Background.png');
    ctx.drawImage(bg, 0, 0, w, h);
  } catch {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h);
  }

  const padH = 88;
  const centerX = w / 2;

  // Badge
  const badgeW = 280, badgeH = 56, badgeY = 120;
  ctx.fillStyle = 'rgba(42,42,42,0.8)';
  roundRect(ctx, centerX - badgeW / 2, badgeY, badgeW, badgeH, badgeH / 2); ctx.fill();
  ctx.fillStyle = C.lime;
  ctx.beginPath(); ctx.arc(centerX - badgeW / 2 + 36, badgeY + badgeH / 2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.paper;
  ctx.font = "bold 28px 'Anton', sans-serif";
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('GARUNNA.COM', centerX - badgeW / 2 + 60, badgeY + badgeH / 2);

  // Card image
  const cardW = 440, cardH = 640;
  const cardX = centerX - cardW / 2;
  const cardY = 250;
  try {
    const cardImg = await loadImage(data.cardImage);
    ctx.drawImage(cardImg, cardX, cardY, cardW, cardH);
  } catch { /* skip if card not loaded */ }

  // Draw stats on card (Pace | Duration | Distance)
  if (data.stats) {
    // Position the overlay in the lower portion of the card, well within bounds
    const overlayH = 180; // total height of the name + stats overlay
    const statsY = cardY + cardH - overlayH - 20; // 20px padding from card bottom edge
    const statsW = cardW - 40; // 20px padding on each side
    const statsX = cardX + 20;

    // Semi-transparent backdrop for readability
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, statsX - 10, statsY - 16, statsW + 20, overlayH + 10, 16);
    ctx.fill();

    // Name on card — truncate if too long
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 40px 'Anton', sans-serif";
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 10;
    let displayName = data.name;
    while (ctx.measureText(displayName).width > statsW - 20 && displayName.length > 3) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== data.name) displayName += '…';
    ctx.fillText(displayName, centerX, statsY - 6);

    // Runner type subtitle
    ctx.font = "18px 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(data.title, centerX, statsY + 40);
    ctx.shadowBlur = 0;

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(statsX + 10, statsY + 68);
    ctx.lineTo(statsX + statsW - 10, statsY + 68);
    ctx.stroke();

    // Stats row — Pace | Duration | Distance
    const colW = statsW / 3;
    const statItems = [
      { label: 'PACE', value: data.stats.pace },
      { label: 'DURATION', value: data.stats.duration },
      { label: 'DISTANCE', value: data.stats.distance },
    ];

    statItems.forEach((item, i) => {
      const cx = statsX + colW * i + colW / 2;

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, cx, statsY + 78);

      // Value
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 38px 'Anton', sans-serif";
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
      ctx.fillText(item.value, cx, statsY + 100);
      ctx.shadowBlur = 0;

      // Vertical divider between columns
      if (i < statItems.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + colW * (i + 1), statsY + 76);
        ctx.lineTo(statsX + colW * (i + 1), statsY + 146);
        ctx.stroke();
      }
    });
  }

  // Name + type below card
  let curY = cardY + cardH + 30;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.paper;
  ctx.font = "bold 64px 'Anton', sans-serif";
  ctx.textBaseline = 'top';
  ctx.fillText(data.name, centerX, curY);
  curY += 80;

  ctx.fillStyle = C.grey400;
  ctx.font = "32px 'Space Grotesk', sans-serif";
  ctx.fillText(`${data.emoji} ${data.title}`, centerX, curY);
  curY += 60;

  // Quote
  curY += 20;
  ctx.fillStyle = C.lime;
  ctx.font = "italic 34px 'Space Grotesk', sans-serif";
  const quoteLines = wrapText(ctx, data.quote, w - padH * 2);
  for (const line of quoteLines) {
    ctx.fillText(line, centerX, curY);
    curY += 52;
  }

  // Signature Moves & Starter Pack / Gear section
  curY += 40;

  const sectionPadH = 100;
  const colWidth = (w - sectionPadH * 2) / 2 - 16;
  const sectionStartX = sectionPadH;

  // Signature Moves column
  if (data.signatureMoves) {
    ctx.textAlign = 'left';
    ctx.fillStyle = C.grey400;
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'top';
    ctx.fillText('SIGNATURE MOVES', sectionStartX, curY);

    const moves = data.signatureMoves.split(';').map(s => s.trim());
    ctx.fillStyle = 'rgba(245,245,240,0.75)';
    ctx.font = "26px 'Space Grotesk', sans-serif";
    let moveY = curY + 36;
    moves.forEach(move => {
      ctx.fillText(`• ${move}`, sectionStartX, moveY);
      moveY += 38;
    });
  }

  // Starter Pack / Gear column
  if (data.starterPack) {
    const rightColX = sectionStartX + colWidth + 32;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.grey400;
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'top';
    ctx.fillText('STARTER PACK / GEAR', rightColX, curY);

    const gears = data.starterPack.split(';').map(s => s.trim());
    ctx.fillStyle = 'rgba(245,245,240,0.75)';
    ctx.font = "26px 'Space Grotesk', sans-serif";
    let gearY = curY + 36;
    gears.forEach(gear => {
      ctx.fillText(`• ${gear}`, rightColX, gearY);
      gearY += 38;
    });
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = C.grey500;
  ctx.font = "24px 'JetBrains Mono', monospace";
  ctx.textBaseline = 'bottom';
  ctx.fillText('garunna.app · Discover your runner card', centerX, h - 80);
  ctx.textAlign = 'left';

  return canvas;
}

/* ── Legacy renderer for projection/other cards ── */
function renderLegacyCard(fmtKey, data) {
  const fmt = FORMATS[fmtKey];
  const L = LAYOUT[fmtKey];
  const { w, h, safeTop, safeBottom } = fmt;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h);
  drawDotGrid(ctx, w, h);
  ctx.fillStyle = C.lime; ctx.fillRect(0, 0, w, Math.round(h * 0.004));

  const padH = L.padH;
  const contentW = w - padH * 2;
  const contentTop = safeTop;
  const contentBottom = h - safeBottom;

  const B = L.badge;
  const badgeY = contentTop + Math.round((contentBottom - contentTop) * 0.045);
  ctx.fillStyle = C.grey600;
  roundRect(ctx, padH, badgeY, B.w, B.h, B.h / 2); ctx.fill();
  ctx.fillStyle = C.lime;
  ctx.beginPath(); ctx.arc(padH + B.dotOffX, badgeY + B.h / 2, B.dotR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.paper;
  ctx.font = `bold ${B.textSize}px 'Anton', sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText('GARUNNA', padH + B.textOffX, badgeY + B.h / 2);

  const S = L.section;
  let curY = badgeY + B.h + L.badgeToSection;
  ctx.fillStyle = C.lime;
  ctx.font = `${S.size}px 'JetBrains Mono', monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(data.section.toUpperCase(), padH, curY);
  curY += S.size + S.gapAfter;

  const T = L.title;
  ctx.font = `${T.size}px 'Anton', sans-serif`;
  ctx.textBaseline = 'top';
  const titleLines = wrapText(ctx, data.title, contentW);
  for (const line of titleLines) {
    if (data.accentWord && line.includes(data.accentWord)) {
      const before = line.slice(0, line.indexOf(data.accentWord));
      const accent = data.accentWord;
      const after = line.slice(line.indexOf(data.accentWord) + accent.length);
      const bw = ctx.measureText(before).width;
      const aw = ctx.measureText(accent).width;
      ctx.fillStyle = C.paper; ctx.fillText(before, padH, curY);
      ctx.fillStyle = C.lime; ctx.fillText(accent, padH + bw, curY);
      ctx.fillStyle = C.paper; ctx.fillText(after, padH + bw + aw, curY);
    } else {
      ctx.fillStyle = C.paper; ctx.fillText(line, padH, curY);
    }
    curY += Math.round(T.size * T.lineH);
  }
  curY += T.gapAfter;

  const TG = L.tagline;
  ctx.fillStyle = C.grey400;
  ctx.font = `italic ${TG.size}px 'Space Grotesk', sans-serif`;
  ctx.textBaseline = 'top';
  const tagLines = wrapText(ctx, data.tagline, contentW * TG.maxW);
  for (const line of tagLines) {
    ctx.fillText(line, padH, curY);
    curY += Math.round(TG.size * TG.lineH);
  }
  curY += TG.gapAfter;

  if (data.stats && data.stats.length > 0) {
    const ST = L.stats;
    const cols = data.stats.length <= 3 ? data.stats.length : 2;
    const rows = Math.ceil(data.stats.length / cols);
    const colW = Math.floor(contentW / cols);
    const gridH = rows * ST.rowH;
    const cardH = gridH + ST.cardPad * 2;
    ctx.fillStyle = C.inkRaised;
    roundRect(ctx, padH, curY, contentW, cardH, ST.radius); ctx.fill();
    ctx.strokeStyle = C.grey600; ctx.lineWidth = ST.lineW;
    roundRect(ctx, padH, curY, contentW, cardH, ST.radius); ctx.stroke();
    for (let i = 0; i < data.stats.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const sx = padH + col * colW + ST.cardPad;
      const sy = curY + ST.cardPad + row * ST.rowH;
      ctx.fillStyle = C.grey400;
      ctx.font = `${ST.labelSize}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'top';
      ctx.fillText(data.stats[i].label.toUpperCase(), sx, sy);
      ctx.fillStyle = C.lime;
      ctx.font = `bold ${ST.valueSize}px 'Anton', sans-serif`;
      ctx.fillText(data.stats[i].value, sx, sy + ST.labelSize + 10);
    }
    curY += cardH + L.statsGapAfter;
  }

  if (data.description) {
    const D = L.desc;
    ctx.fillStyle = C.paper; ctx.globalAlpha = 0.85;
    ctx.font = `${D.size}px 'Space Grotesk', sans-serif`;
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, data.description, contentW);
    for (let i = 0; i < Math.min(lines.length, D.maxLines); i++) {
      ctx.fillText(lines[i], padH, curY);
      curY += Math.round(D.size * D.lineH);
    }
    ctx.globalAlpha = 1;
    curY += D.gapAfter;
  }

  if (data.praise) {
    const P = L.praise;
    ctx.fillStyle = C.limeSoft;
    ctx.font = `${P.size}px 'Space Grotesk', sans-serif`;
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, data.praise, contentW);
    for (let i = 0; i < Math.min(lines.length, P.maxLines); i++) {
      ctx.fillText(lines[i], padH, curY);
      curY += Math.round(P.size * P.lineH);
    }
  }

  const F = L.footer;
  ctx.fillStyle = C.grey500;
  ctx.font = `${F.size}px 'JetBrains Mono', monospace`;
  ctx.textBaseline = 'bottom';
  ctx.fillText('garunna.app · Discover your runner type', padH, contentBottom - F.fromBottom);

  ctx.strokeStyle = L.safeLine.color; ctx.lineWidth = 1; ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, safeTop); ctx.lineTo(w, safeTop);
  ctx.moveTo(0, h - safeBottom); ctx.lineTo(w, h - safeBottom);
  ctx.stroke(); ctx.setLineDash([]);

  return canvas;
}

/* ------------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------------ */
export default function ShareCardModal({ isOpen, onClose, data }) {
  const isRunnerType = data?.mode === 'runner-type';
  const [fmt, setFmt] = useState('portrait');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const canvasRef = useRef(null);

  const activeFmt = isRunnerType ? 'portrait' : fmt;

  const generate = useCallback(() => {
    if (!data) return;
    setGenerating(true);
    const doRender = async () => {
      try {
        let canvas;
        if (isRunnerType) {
          canvas = await renderRunnerCard(data);
        } else {
          canvas = renderLegacyCard(activeFmt, data);
        }
        setPreviewUrl(canvas.toDataURL('image/png'));
        canvasRef.current = canvas;
      } catch (e) {
        console.error('Card render error', e);
      } finally {
        setGenerating(false);
      }
    };
    doRender();
  }, [activeFmt, data, isRunnerType]);

  useEffect(() => { if (isOpen && data) generate(); }, [isOpen, activeFmt, data, generate]);
  useEffect(() => { if (!isOpen) { setPreviewUrl(null); setShareStatus(''); } }, [isOpen]);

  function getFilename() {
    const slug = (data?.title || 'garunna-result').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `garunna-${slug}-${activeFmt}.png`;
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
            text: data?.tagline || 'Check out my result on GARUNNA!',
          });
          setShareStatus('done');
        } else {
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

  const fmtCfg = FORMATS[activeFmt];
  const previewAspect = `${fmtCfg.w} / ${fmtCfg.h}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog" aria-modal="true" onClick={onClose}
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
              {isRunnerType ? 'Portrait mode for Instagram Stories' : 'Choose a format, then share or download'}
            </p>
          </div>
          <button
            onClick={onClose} aria-label="Close"
            className="h-8 w-8 rounded-full border border-grey-600 text-grey-400 hover:border-lime hover:text-lime transition-colors text-lg leading-none"
          >×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format picker — only for non-runner-type */}
          {!isRunnerType && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">Format</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(FORMATS).map(([key, f]) => (
                  <button
                    key={key} onClick={() => setFmt(key)}
                    className={`rounded-xl border p-3 text-center transition-colors ${fmt === key
                      ? 'border-lime bg-lime/5 text-lime'
                      : 'border-grey-600 hover:border-grey-400 text-grey-400'
                      }`}
                  >
                    <span className="block text-2xl mb-1.5">{f.icon}</span>
                    <span className="block font-mono text-[11px] font-semibold uppercase tracking-widest">{f.label}</span>
                    <span className="block font-mono text-[10px] text-grey-500 mt-0.5">{f.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">Preview</p>
            <div
              className="mx-auto overflow-hidden rounded-xl border border-grey-600 bg-ink"
              style={{
                aspectRatio: previewAspect,
                maxHeight: activeFmt === 'portrait' ? '55vh' : activeFmt === 'square' ? '42vh' : '32vh',
                width: activeFmt === 'portrait' ? 'auto' : '100%',
              }}
            >
              {generating ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-grey-400 animate-pulse">Rendering…</span>
                </div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Share card preview" className="w-full h-full object-contain" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-grey-600 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload} disabled={!previewUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-grey-600 px-4 py-3 text-sm font-semibold hover:border-lime hover:text-lime transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {shareStatus === 'downloading'
              ? <span className="animate-pulse">Saving…</span>
              : <><span>↓</span> Download PNG</>}
          </button>
          <button
            onClick={handleShare} disabled={!previewUrl || generating}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-lime text-ink font-semibold px-4 py-3 text-sm hover:bg-lime-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {shareStatus === 'sharing'
              ? <span className="animate-pulse">Opening…</span>
              : shareStatus === 'done'
                ? <span>✓ Shared!</span>
                : <><span>↗</span> Share to…</>}
          </button>
        </div>
      </div>
    </div>
  );
}
