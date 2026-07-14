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

/**
 * Picks the largest font size (down to minSize) at which `text` fits
 * within `maxWidth`. Prevents any label/value from overflowing its box.
 * fontBuilder(size) must return a valid canvas font string for that size.
 */
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

/** Truncates text with an ellipsis if it still doesn't fit at minSize. */
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
  const badgeW = 280, badgeH = 56, badgeY = 110;

  ctx.fillStyle = 'rgba(42,42,42,0.8)';
  roundRect(ctx, centerX - badgeW / 2, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();

  ctx.font = "26px 'Anton', sans-serif";
  ctx.textBaseline = 'middle';

  const text = 'GARUNA';
  const dotRadius = 9;
  const gap = 16;

  const textWidth = ctx.measureText(text).width;
  const totalWidth = dotRadius * 2 + gap + textWidth;

  const startX = centerX - totalWidth / 2;

  // Dot
  ctx.fillStyle = C.lime;
  ctx.beginPath();
  ctx.arc(startX + dotRadius, badgeY + badgeH / 2, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = C.paper;
  ctx.textAlign = 'left';
  ctx.fillText(
    text,
    startX + dotRadius * 2 + gap,
    badgeY + 5 + badgeH / 2
  );

  // Card image — bigger, and sized to the artwork's real aspect ratio so it
  // is never stretched/squashed (that stretching is what was "slicing" the
  // card art before). Falls back to the standard trading-card ratio if the
  // image can't be loaded/measured.
  const cardW = 640;
  let cardImg = null;
  try {
    cardImg = await loadImage(data.cardImage);
  } catch { /* skip if card not loaded */ }
  const cardAspect = cardImg && cardImg.naturalWidth
    ? cardImg.naturalHeight / cardImg.naturalWidth
    : 900 / 640;
  const cardH = Math.round(cardW * cardAspect);
  const cardX = centerX - cardW / 2;
  const cardY = 200;
  if (cardImg) ctx.drawImage(cardImg, cardX, cardY, cardW, cardH);

  // Draw stats on card (Pace | Duration | Distance)
  if (data.stats) {
    // Position the overlay in the lower portion of the card, matching the
    // in-app preview (which anchors it well clear of the card's bottom
    // edge, not hugging it) — roughly 17% of the card's height up from
    // the bottom.
    const overlayH = 210; // total height of the name + stats overlay
    const bottomMargin = Math.round(cardH * 0.17); // gap from block to card's bottom edge
    const statsY = cardY + cardH - overlayH - bottomMargin;
    const statsW = cardW - 48; // padding on each side
    const statsX = cardX + 24;

    // Darken-for-readability effect, masked to the card artwork's own
    // shape (its alpha channel) instead of a plain rectangle — this is
    // what makes it follow the card's curved/shield-shaped bottom rather
    // than showing up as a box that clashes with that curve. Rendered as
    // a soft gradient (transparent → dark) rather than a flat fill so
    // there's no hard edge at all, just a natural vignette.
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

    // Name on card — shrink to fit, then truncate as a last resort
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const nameMaxW = statsW - 24;
    const nameFontBuilder = (size) => `${size}px 'Anton', sans-serif`;
    const { size: nameSize, text: displayName } = fitAndTruncate(
      ctx, data.name, nameMaxW, nameFontBuilder, 42, 24
    );
    ctx.font = nameFontBuilder(nameSize);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 8;
    ctx.fillText(displayName, centerX, statsY + 10);

    // Runner type subtitle
    ctx.font = "18px 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const { size: titleSize, text: displayTitle } = fitAndTruncate(
      ctx, data.title, nameMaxW, (s) => `${s}px 'JetBrains Mono', monospace`, 18, 12
    );
    ctx.font = `${titleSize}px 'JetBrains Mono', monospace`;
    ctx.fillText(displayTitle, centerX, statsY + 70);
    ctx.shadowBlur = 0;

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(statsX + 0 + 10, statsY + 120);
    ctx.lineTo(statsX + 0 + statsW - 10, statsY + 120);
    ctx.stroke();

    // Stats row — Pace | Duration | Distance
    const colW = statsW / 3;
    const colInnerW = colW - 20; // keep every value clear of its column edges
    const statItems = [
      { label: 'PACE', value: data.stats.pace },
      { label: 'DURATION', value: data.stats.duration },
      { label: 'DISTANCE', value: data.stats.distance },
    ];

    statItems.forEach((item, i) => {
      const cx = statsX + colW * i + colW / 2;

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      const labelFontBuilder = (s) => `${s}px 'JetBrains Mono', monospace`;
      const labelFit = fitAndTruncate(ctx, item.label, colInnerW, labelFontBuilder, 15, 10);
      ctx.font = labelFontBuilder(labelFit.size);
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(labelFit.text, cx, statsY + 150);

      // Value — sized to always fit inside its column
      const valueFontBuilder = (s) => `${s}px 'Anton', sans-serif`;
      const valueFit = fitAndTruncate(ctx, item.value, colInnerW, valueFontBuilder, 34, 18);
      ctx.font = valueFontBuilder(valueFit.size);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
      ctx.fillText(valueFit.text, cx, statsY + 180);
      ctx.shadowBlur = 0;

      // Vertical divider between columns
      if (i < statItems.length - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + colW * (i + 1), statsY + 150);
        ctx.lineTo(statsX + colW * (i + 1), statsY + 210);
        ctx.stroke();
      }
    });
  }

  // Name + type below card
  const belowMaxW = w - padH * 2;
  let curY = cardY + cardH + 40;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const bigNameFit = fitAndTruncate(
    ctx, data.name, belowMaxW, (s) => `${s}px 'Anton', sans-serif`, 60, 34
  );
  ctx.font = `${bigNameFit.size}px 'Anton', sans-serif`;
  ctx.fillStyle = C.paper;
  ctx.fillText(bigNameFit.text, centerX, curY);
  curY += Math.round(bigNameFit.size * 1.15) + 16;

  ctx.fillStyle = C.grey400;
  ctx.font = "30px 'Space Grotesk', sans-serif";
  ctx.fillText(`${data.emoji} ${data.title}`, centerX, curY);
  curY += 58;

  // Quote
  curY += 18;
  ctx.fillStyle = C.lime;
  ctx.font = "italic 32px 'Space Grotesk', sans-serif";
  const quoteLines = wrapText(ctx, data.quote, w - padH * 2);
  for (const line of quoteLines) {
    ctx.fillText(line, centerX, curY);
    curY += 48;
  }

  // Signature Moves & Starter Pack / Gear section
  curY += 44;

  // Use the same padH as the badge/name/quote/footer above, instead of a
  // separate margin — that mismatch was what made this block read as
  // off-center relative to everything else on the card.
  const gapBetweenCols = 32;
  const colWidth = (w - padH * 2 - gapBetweenCols) / 2;
  const sectionStartX = padH;
  const sectionTopY = curY;
  let moveEndY = sectionTopY;
  let gearEndY = sectionTopY;

  // Signature Moves column
  if (data.signatureMoves) {
    ctx.textAlign = 'left';
    ctx.fillStyle = C.grey400;
    ctx.font = "20px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'top';
    ctx.fillText('SIGNATURE MOVES', sectionStartX, sectionTopY);

    const moves = data.signatureMoves.split(';').map(s => s.trim()).filter(Boolean);
    ctx.fillStyle = 'rgba(245,245,240,0.75)';
    ctx.font = "24px 'Space Grotesk', sans-serif";
    let moveY = sectionTopY + 40;
    moves.forEach(move => {
      const lines = wrapText(ctx, `• ${move}`, colWidth);
      lines.forEach((line) => {
        ctx.fillText(line, sectionStartX, moveY);
        moveY += 34;
      });
      moveY += 6;
    });
    moveEndY = moveY;
  }

  // Starter Pack / Gear column
  if (data.starterPack) {
    const rightColX = sectionStartX + colWidth + gapBetweenCols;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.grey400;
    ctx.font = "20px 'JetBrains Mono', monospace";
    ctx.textBaseline = 'top';
    ctx.fillText('STARTER PACK / GEAR', rightColX, sectionTopY);

    const gears = data.starterPack.split(';').map(s => s.trim()).filter(Boolean);
    ctx.fillStyle = 'rgba(245,245,240,0.75)';
    ctx.font = "24px 'Space Grotesk', sans-serif";
    let gearY = sectionTopY + 40;
    gears.forEach(gear => {
      const lines = wrapText(ctx, `• ${gear}`, colWidth);
      lines.forEach((line) => {
        ctx.fillText(line, rightColX, gearY);
        gearY += 34;
      });
      gearY += 6;
    });
    gearEndY = gearY;
  }

  // Footer — styled as the same kind of pill badge as the header, placed
  // right after the taller of the two columns with a modest, header-like
  // gap (not a lone line stuck far down the canvas, and not glued right
  // under the lists either). Any remaining blank space below it, down to
  // the bottom of the 1080×1920 story canvas, is expected and left as-is.
  const footerText = 'Garuna · Discover your runner card';
  const footerFont = "20px 'JetBrains Mono', monospace";
  ctx.font = footerFont;
  const footerTextW = ctx.measureText(footerText).width;
  const footerBadgeW = footerTextW + 72;
  const footerBadgeH = 52;
  const footerY = Math.max(moveEndY, gearEndY) + 70;

  ctx.fillStyle = 'rgba(42,42,42,0.8)';
  roundRect(ctx, centerX - footerBadgeW / 2, footerY, footerBadgeW, footerBadgeH, footerBadgeH / 2); ctx.fill();
  ctx.fillStyle = C.lime;
  ctx.beginPath();
  ctx.arc(centerX - footerBadgeW / 2 + 26, footerY + footerBadgeH / 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.paper;
  ctx.font = footerFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(footerText, centerX - footerBadgeW / 2 + 44, footerY + footerBadgeH / 2);

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
  ctx.fillText('GARUNA', padH + B.textOffX, badgeY + B.h / 2);

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
  ctx.fillText('garuna.app · Discover your runner type', padH, contentBottom - F.fromBottom);

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
    const slug = (data?.title || 'garuna-result').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `garuna-${slug}-${activeFmt}.png`;
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