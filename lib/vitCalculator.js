'use client';

function clamp(v, min = 0, max = 99) {
  if (typeof v !== 'number' || isNaN(v)) return min;
  return Math.round(Math.max(min, Math.min(max, v)));
}

function paceSeconds(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return null;
  return 3600 / speedKmh;
}

export function calcPac(avgSpeedKmh) {
  const s = paceSeconds(avgSpeedKmh);
  if (!s) return 60;
  if (s <= 220) return clamp(98 + (220 - s) * 0.1);
  if (s <= 270) return clamp(98 - (s - 220) * (8 / 50));
  if (s <= 330) return clamp(90 - (s - 270) * (10 / 60));
  if (s <= 390) return clamp(80 - (s - 330) * (10 / 60));
  if (s <= 450) return clamp(70 - (s - 390) * (10 / 60));
  return clamp(60 - (s - 450) * 0.1);
}

export function calcEnd(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 55;
  if (distanceKm >= 50) return 99;
  if (distanceKm >= 42.2) return clamp(97 + (distanceKm - 42.2) * 0.1);
  if (distanceKm >= 21.1) return clamp(90 + (distanceKm - 21.1) * (7 / 21.1));
  if (distanceKm >= 10) return clamp(78 + (distanceKm - 10) * (12 / 11.1));
  if (distanceKm >= 5) return clamp(65 + (distanceKm - 5) * (13 / 5));
  return clamp(50 + distanceKm * (15 / 5));
}

export function calcCon(series) {
  if (!series || series.length < 3) return 75;
  const speeds = series.map(p => p.speedKmh).filter(v => v !== null && v > 0);
  if (speeds.length < 3) return 75;

  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((sum, v) => sum + (v - mean) ** 2, 0) / speeds.length;
  const cv = Math.sqrt(variance) / mean;

  if (cv <= 0.05) return clamp(95);
  if (cv <= 0.10) return clamp(95 - (cv - 0.05) * (10 / 0.05));
  if (cv <= 0.20) return clamp(85 - (cv - 0.10) * (20 / 0.10));
  if (cv <= 0.30) return clamp(65 - (cv - 0.20) * (15 / 0.10));
  return clamp(50);
}

export function calcRec(avgHr, maxHr, avgSpeedKmh) {
  if (avgHr === null || avgHr === undefined || avgHr <= 0) return 70;
  const pace = paceSeconds(avgSpeedKmh);
  if (!pace) return 70;

  const paceFactor = pace / 300;
  const expectedHr = 140 + (paceFactor - 1) * 30;
  const ratio = expectedHr / avgHr;
  return clamp(75 + (ratio - 1) * 80);
}

export function calcCad(avgSpeedKmh) {
  const pace = paceSeconds(avgSpeedKmh);
  if (!pace) return 75;
  if (pace <= 240) return clamp(92);
  if (pace <= 300) return clamp(85);
  if (pace <= 360) return clamp(78);
  if (pace <= 420) return clamp(72);
  return clamp(68);
}

export function calcClb(elevationGain, distanceKm) {
  if (elevationGain === null || elevationGain === undefined || !distanceKm || distanceKm <= 0) return 65;
  const gainPerKm = elevationGain / distanceKm;
  if (gainPerKm >= 80) return 95;
  if (gainPerKm >= 50) return clamp(88 + (gainPerKm - 50) * (7 / 30));
  if (gainPerKm >= 30) return clamp(78 + (gainPerKm - 30) * (10 / 20));
  if (gainPerKm >= 10) return clamp(65 + (gainPerKm - 10) * (13 / 20));
  return clamp(55 + gainPerKm * (10 / 10));
}

export function calcAll(activity) {
  if (!activity) return null;

  const pac = calcPac(activity.avgSpeedKmh) || 60;
  const end = calcEnd(activity.distanceKm) || 55;
  const con = calcCon(activity.series) || 75;
  const rec = calcRec(activity.avgHr, activity.maxHr, activity.avgSpeedKmh) || 70;
  const cad = calcCad(activity.avgSpeedKmh) || 75;
  const clb = calcClb(activity.elevationGain, activity.distanceKm) || 65;

  const hus = 70;
  const ach = 65;
  const exp = 60;
  const prg = 68;

  const ovr = clamp(
    (pac || 0) * 0.20 +
    (end || 0) * 0.20 +
    (con || 0) * 0.15 +
    (cad || 0) * 0.10 +
    (rec || 0) * 0.10 +
    (prg || 0) * 0.10 +
    (ach || 0) * 0.10 +
    (exp || 0) * 0.05
  );

  const attrs = { pac, end, con, rec, cad, clb, hus, ach, exp, prg };
  const labels = {
    pac: { label: 'PACE', icon: '', name: 'Pace' },
    end: { label: 'ENDURANCE', icon: '', name: 'Endurance' },
    con: { label: 'CONSISTENCY', icon: '', name: 'Consistency' },
    rec: { label: 'RECOVERY', icon: '', name: 'Recovery' },
    cad: { label: 'CADENCE', icon: '', name: 'Cadence' },
    clb: { label: 'CLIMBING', icon: '', name: 'Climbing' },
    hus: { label: 'HUSTLE', icon: '', name: 'Hustle' },
    ach: { label: 'ACHIEVEMENT', icon: '', name: 'Achievement' },
    exp: { label: 'EXPLORER', icon: '', name: 'Explorer' },
    prg: { label: 'PROGRESS', icon: '', name: 'Progress' },
  };

  return { ovr, attrs, labels };
}

function formatPaceShort(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return '—';
  const secPerKm = 3600 / speedKmh;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(sec) {
  if (!sec) return '—';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function deriveActivityInfo(activity) {
  return {
    distance: activity.distanceKm ? `${activity.distanceKm.toFixed(2)} km` : '—',
    duration: formatDuration(activity.durationSec),
    pace: formatPaceShort(activity.avgSpeedKmh),
    avgHr: activity.avgHr ? `${activity.avgHr} bpm` : '—',
    maxHr: activity.maxHr ? `${activity.maxHr} bpm` : '—',
    elevation: activity.elevationGain !== null && activity.elevationGain !== undefined ? `${activity.elevationGain} m` : '—',
  };
}
