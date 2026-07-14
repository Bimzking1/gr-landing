// Demo-only "community feed": stores parsed activity summaries in
// localStorage so the landing page can show "other users' stats"
// without standing up a real backend yet. Swap this out for a real
// API route + database (Postgres, Supabase, etc.) once GARUNA has one —
// nothing else in <FitReader> needs to change, it only calls these two
// functions.

const KEY = 'garunna_feed_v1';

const EMPTY = [];
let _cached = EMPTY;
let _cachedRaw = '[]';

export function saveActivityToFeed(entry) {
  if (typeof window === 'undefined') return;
  const feed = getFeed();
  feed.unshift({ ...entry, id: `${Date.now()}` });
  window.localStorage.setItem(KEY, JSON.stringify(feed.slice(0, 25)));
  _cachedRaw = '[]'; // invalidate cache so next getFeed re-reads
}

export function getFeedServer() {
  return EMPTY;
}

export function getFeed() {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY) || '[]';
    if (raw === _cachedRaw) return _cached;
    _cached = JSON.parse(raw);
    _cachedRaw = raw;
    return _cached;
  } catch {
    return EMPTY;
  }
}
