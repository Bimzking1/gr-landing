// GARUNA projection engine — a deliberately simple, transparent model.
// Not a training-science tool: it's a landing-page hook that turns a
// few taps into a shareable "this could be you" number.

export const EXPERIENCE_LEVELS = [
  { id: 'newbie', label: 'Brand new', baseSecPerKm: 8 * 60 + 30, baseDailyKm: 3, tier: 0 },
  { id: 'm1', label: '1 month in', baseSecPerKm: 7 * 60 + 45, baseDailyKm: 5, tier: 1 },
  { id: 'm3', label: '3 months in', baseSecPerKm: 7 * 60, baseDailyKm: 7, tier: 2 },
  { id: 'm6', label: '6 months in', baseSecPerKm: 6 * 60 + 30, baseDailyKm: 9, tier: 3 },
  { id: 'y2', label: '2+ years in', baseSecPerKm: 5 * 60 + 30, baseDailyKm: 12, tier: 4 },
];

export const SHOE_MODIFIERS = [
  { id: 'trainer', label: 'Daily trainer', paceDeltaSec: 0, mileageMult: 1 },
  { id: 'carbon', label: 'Carbon race plate', paceDeltaSec: -20, mileageMult: 0.95 },
  { id: 'trail', label: 'Trail grip', paceDeltaSec: 20, mileageMult: 1.1 },
  { id: 'sale', label: 'Whatever was on sale', paceDeltaSec: 10, mileageMult: 1 },
];

export const GOAL_MODIFIERS = [
  { id: 'pr', label: 'Chase a new PR', paceDeltaSec: -12, mileageMult: 0.9 },
  { id: 'weight', label: 'Get stronger, lose weight', paceDeltaSec: 8, mileageMult: 1.25 },
  { id: 'headspace', label: 'Clear my head', paceDeltaSec: 15, mileageMult: 1 },
  { id: 'people', label: 'Meet people, join a pack', paceDeltaSec: 5, mileageMult: 1.05 },
  { id: 'medals', label: 'Collect medals', paceDeltaSec: 0, mileageMult: 1.1 },
];

const DISTANCE_TIERS = ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra (50K+)'];

export function computeProjection({ experienceId, shoeId, goalId, hasPacer }) {
  const experience = EXPERIENCE_LEVELS.find((e) => e.id === experienceId) || EXPERIENCE_LEVELS[0];
  const shoe = SHOE_MODIFIERS.find((s) => s.id === shoeId) || SHOE_MODIFIERS[0];
  const goal = GOAL_MODIFIERS.find((g) => g.id === goalId) || GOAL_MODIFIERS[0];

  let secPerKm = experience.baseSecPerKm + shoe.paceDeltaSec + goal.paceDeltaSec;
  let dailyKm = experience.baseDailyKm * shoe.mileageMult * goal.mileageMult;
  let tier = experience.tier;

  if (hasPacer) {
    secPerKm -= 10;
    dailyKm *= 1.1;
    tier += 1;
  }

  secPerKm = Math.max(210, secPerKm); // floor at 3:30/km so the number stays believable
  tier = Math.min(tier, DISTANCE_TIERS.length - 1);

  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);

  return {
    pace: `${mins}:${String(secs).padStart(2, '0')} /km`,
    dailyKm: Math.round(dailyKm * 10) / 10,
    longestRun: DISTANCE_TIERS[tier],
  };
}
