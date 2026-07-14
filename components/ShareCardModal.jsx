'use client';

import { useState, useRef, useEffect } from 'react';

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

function fitFontSize(ctx, text, maxWidth, fontBuilder, startSize, minSize = 14, step = 1) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = fontBuilder(size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= step;
  }
  ctx.font = fontBuilder(minSize);
  return minSize;
}

function fitAndTruncate(ctx, text, maxWidth, fontBuilder, startSize, minSize = 14) {
  const size = fitFontSize(ctx, text, maxWidth, fontBuilder, startSize, minSize);
  ctx.font = fontBuilder(size);
  let display = text;
  if (ctx.measureText(display).width > maxWidth) {
    while (display.length > 1 && ctx.measureText(display + '…').width > maxWidth) {
      display = display.slice(0, -1);
    }
    display += '…';
  }
  return { size, text: display };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ── FIT rating card renderer (portrait only for Instagram Stories) ── */
async function renderVitCard(data) {
  const w = 1080, h = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  try {
    const bg = await loadImage('/newer-design/Share Background.png');
    ctx.drawImage(bg, 0, 0, w, h);
  } catch {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h);
  }

  const padH = 88;
  const centerX = w / 2;

  // Badge
  const badgeW = 340;
  const badgeH = 60;
  const badgeY = 110;
  const badgeX = centerX - badgeW / 2;

  ctx.fillStyle = "rgba(35,35,35,0.88)";
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();

  ctx.font = "32px 'Anton', sans-serif";
  const text = "GARUNA";
  const textWidth = ctx.measureText(text).width;
  const gap = 14;
  const dotRadius = 10;
  const groupWidth = dotRadius * 2 + gap + textWidth;
  const startX = centerX - groupWidth / 2;

  ctx.fillStyle = C.lime;
  ctx.beginPath();
  ctx.arc(startX + dotRadius, badgeY + badgeH / 2, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#F7F7F2";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, startX + dotRadius * 2 + gap, badgeY + 5 + badgeH / 2);

  // Card image
  const cardW = 640;
  let cardImg = null;
  try {
    cardImg = await loadImage(data.cardImage);
  } catch { /* skip */ }
  const cardAspect = cardImg && cardImg.naturalWidth
    ? cardImg.naturalHeight / cardImg.naturalWidth
    : 900 / 640;
  const cardH = Math.round(cardW * cardAspect);
  const cardX = centerX - cardW / 2;
  const cardY = 200;
  if (cardImg) ctx.drawImage(cardImg, cardX, cardY, cardW, cardH);

  // OVR badge on card
  if (data.ovr) {
    const badgeX = cardX + cardW - 60;
    const badgeY = cardY - 40;
    const badgeW2 = 230;
    const badgeH2 = 98;
    ctx.fillStyle = 'rgba(10,10,10,0.65)';
    roundRect(ctx, badgeX - 24, badgeY, badgeW2, badgeH2, badgeH2 / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth = 2.5;
    roundRect(ctx, badgeX - 24, badgeY, badgeW2, badgeH2, badgeH2 / 2);
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.font = "38px 'Anton', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐', badgeX + 12, badgeY + badgeH2 / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = "50px 'Anton', sans-serif";
    ctx.fillText(`${data.ovr || '--'}`, badgeX + 74, badgeY + 5 + badgeH2 / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = "32px 'JetBrains Mono', monospace";
    ctx.fillText('OVR', badgeX + 150, badgeY + badgeH2 / 2);
  }

  // Stats on card (Pace | Duration | Distance)
  if (data.stats) {
    const overlayH = 210;
    const bottomMargin = Math.round(cardH * 0.17);
    const statsY = cardY + cardH - overlayH - bottomMargin;
    const statsW = cardW - 48;
    const statsX = cardX + 24;

    if (cardImg) {
      const backdropTop = statsY - 20;
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = cardW;
      maskCanvas.height = cardH;
      const mctx = maskCanvas.getContext('2d');
      mctx.drawImage(cardImg, 0, 0, cardW, cardH);
      mctx.globalCompositeOperation = 'source-atop';
      const grad = mctx.createLinearGradient(0, backdropTop - cardY, 0, cardH);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0.75)');
      mctx.fillStyle = grad;
      mctx.fillRect(0, 0, cardW, cardH);
      ctx.drawImage(maskCanvas, cardX, cardY);
    }

    // Name on card
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const nameMaxW = statsW - 24;
    const nameFontBuilder = (size) => `${size}px 'Anton', sans-serif`;
    const { size: nameSize, text: displayName } = fitAndTruncate(
      ctx, data.name, nameMaxW, nameFontBuilder, 58, 34
    );
    ctx.font = nameFontBuilder(nameSize);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
    ctx.fillText(displayName, centerX, statsY - 26);

    // Title subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const { size: titleSize, text: displayTitle } = fitAndTruncate(
      ctx, data.title, nameMaxW, (s) => `${s}px 'JetBrains Mono', monospace`, 30, 16
    );
    ctx.font = `${titleSize}px 'JetBrains Mono', monospace`;
    ctx.fillText(displayTitle, centerX, statsY + 48);
    ctx.shadowBlur = 0;

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(statsX + 10, statsY + 100);
    ctx.lineTo(statsX + statsW - 10, statsY + 100);
    ctx.stroke();

    // Stats row
    const colW = statsW / 3;
    const colInnerW = colW - 20;
    const statItems = [
      { label: 'PACE', value: data.stats.pace },
      { label: 'DURATION', value: data.stats.duration },
      { label: 'DISTANCE', value: data.stats.distance },
    ];

    statItems.forEach((item, i) => {
      const cx = statsX + colW * i + colW / 2;

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const labelFontBuilder = (s) => `${s}px 'JetBrains Mono', monospace`;
      const labelFit = fitAndTruncate(ctx, item.label, colInnerW, labelFontBuilder, 20, 14);
      ctx.font = labelFontBuilder(labelFit.size);
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(labelFit.text, cx, statsY + 128);

      const valueFontBuilder = (s) => `${s}px 'Anton', sans-serif`;
      const valueFit = fitAndTruncate(ctx, item.value, colInnerW, valueFontBuilder, 44, 26);
      ctx.font = valueFontBuilder(valueFit.size);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
      ctx.fillText(valueFit.text, cx, statsY + 162);
      ctx.shadowBlur = 0;

      if (i < statItems.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + colW * (i + 1), statsY + 126);
        ctx.lineTo(statsX + colW * (i + 1), statsY + 198);
        ctx.stroke();
      }
    });
  }

  let curY = cardY + cardH + 6;

  // FIT stats grid (2×5)
  let vitEndY;

  if (data.vitAttrs && data.vitAttrs.length > 0) {
    curY += 30;
    const gridCols = 2;
    const gridRows = 5;
    const gridGap = 20;
    const colW = (w - padH * 2 - gridGap) / gridCols;
    const rowH = 96;
    const gridStartX = padH;
    const gridStartY = curY;

    data.vitAttrs.forEach((attr, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const gx = gridStartX + col * (colW + gridGap);
      const gy = gridStartY + row * rowH;

      roundRect(ctx, gx, gy, colW, rowH - 6, 16);
      ctx.fillStyle = 'rgba(30,30,30,0.8)';
      ctx.fill();

      ctx.font = "34px 'Space Grotesk', sans-serif";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(attr.icon, gx + 18, gy + (rowH - 6) / 2 - 6);

      ctx.fillStyle = 'rgba(245,245,240,0.9)';
      ctx.font = "35px 'Anton', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(`${attr.value}`, gx + colW - 16, gy + (rowH - 6) / 2 - 6);

      ctx.fillStyle = 'rgba(136,136,136,0.75)';
      ctx.font = "bold 18px 'JetBrains Mono', monospace";
      ctx.textAlign = 'left';
      ctx.fillText(attr.label, gx + 18, gy - 10 + (rowH - 6) / 2 - 6);

      const barX = gx + 18;
      const barY = gy + (rowH - 6) / 2 + 12;
      const barW = colW - 36;
      const barH = 16;
      roundRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.fillStyle = 'rgba(42,42,42,0.7)';
      ctx.fill();

      const fillW = Math.max(0, (attr.value / 100) * barW);
      const barColor = attr.value >= 85 ? '#d4ff4d' : attr.value >= 70 ? '#b8e040' : attr.value >= 55 ? '#9ab830' : '#7a9420';
      roundRect(ctx, barX, barY, fillW, barH, barH / 2);
      ctx.fillStyle = barColor;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    vitEndY = gridStartY + gridRows * rowH;
  } else {
    vitEndY = curY;
  }

  // Footer
  const footerText = 'Garuna · Discover your runner card';
  const footerFont = "24px 'JetBrains Mono', monospace";
  ctx.font = footerFont;
  const footerTextW = ctx.measureText(footerText).width;
  const footerBadgeW = footerTextW + 84;
  const footerBadgeH = 60;
  const footerY = vitEndY + 46;

  ctx.fillStyle = 'rgba(42,42,42,0.8)';
  roundRect(ctx, centerX - footerBadgeW / 2, footerY, footerBadgeW, footerBadgeH, footerBadgeH / 2); ctx.fill();
  ctx.fillStyle = C.lime;
  ctx.beginPath();
  ctx.arc(centerX - footerBadgeW / 2 + 30, footerY + footerBadgeH / 2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(245,245,240,0.85)';
  ctx.font = footerFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(footerText, centerX - footerBadgeW / 2 + 52, footerY + footerBadgeH / 2);

  return canvas;
}

/* ------------------------------------------------------------------
   MAIN COMPONENT — FIT rating share modal only
   ------------------------------------------------------------------ */
export default function ShareCardModal({ isOpen, onClose, data }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const canvasRef = useRef(null);
  const generating = !previewUrl;

  useEffect(() => {
    if (!isOpen || !data) return;
    let cancelled = false;
    (async () => {
      try {
        const canvas = await renderVitCard(data);
        if (!cancelled) {
          canvasRef.current = canvas;
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch (e) {
        if (!cancelled) console.error('Card render error', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, data]);

  function getFilename() {
    const slug = (data?.title || 'garuna-result').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `garuna-${slug}-portrait.png`;
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
            title: `GARUNA — ${data?.title || 'My Result'}`,
            text: data?.tagline || 'Check out my result on GARUNA!',
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

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog" aria-modal="true" onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-grey-600 bg-ink-soft overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-600">
          <div>
            <p className="font-display text-lg">Share your FIT Rating</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mt-0.5">
              Portrait card for Instagram Stories
            </p>
          </div>
          <button
            onClick={onClose} aria-label="Close"
            className="h-8 w-8 rounded-full border border-grey-600 text-grey-400 hover:border-lime hover:text-lime transition-colors text-lg leading-none"
          >×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Preview */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">Preview</p>
            <div
              className="mx-auto overflow-hidden rounded-xl border border-grey-600 bg-ink"
              style={{
                aspectRatio: '1080 / 1920',
                maxHeight: '55vh',
                width: 'auto',
              }}
            >
              {generating ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-grey-400 animate-pulse">Rendering…</span>
                </div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="FIT card preview" className="w-full h-full object-contain" />
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
