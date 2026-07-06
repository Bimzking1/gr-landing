// Demo-only "community feed": stores parsed activity summaries in
// localStorage so the landing page can show "other users' stats"
// without standing up a real backend yet. Swap this out for a real
// API route + database (Postgres, Supabase, etc.) once GARUNNA has one —
// nothing else in <FitReader> needs to change, it only calls these two
// functions.

const KEY = 'garunna_feed_v1';

export function saveActivityToFeed(entry) {
  if (typeof window === 'undefined') return;
  const feed = getFeed();
  feed.unshift({ ...entry, id: `${Date.now()}` });
  window.localStorage.setItem(KEY, JSON.stringify(feed.slice(0, 25)));
}

export function getFeed() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
