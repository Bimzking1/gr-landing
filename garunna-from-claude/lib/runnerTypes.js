// GARUNA runner-profiling engine.
// Four quick picks each nudge an 8-axis vector; whichever archetype's
// own vector is closest (dot product) wins. Keeps the game feeling like
// a real quiz instead of a lookup table, without needing real user data.

export const AXES = [
  'speed', 'social', 'discipline', 'style',
  'mood', 'endurance', 'casual', 'bling',
];

const vec = (partial) => {
  const v = Object.fromEntries(AXES.map((a) => [a, 0]));
  return { ...v, ...partial };
};

export const GEAR_STEPS = [
  {
    id: 'jersey',
    title: 'Pick your jersey',
    subtitle: 'What are you actually going to run in?',
    options: [
      { id: 'mono', label: 'Minimalist mono tee', axes: vec({ discipline: 2, style: 1 }) },
      { id: 'club', label: 'Loud club colors', axes: vec({ social: 2, bling: 1 }) },
      { id: 'cotton', label: 'Old cotton tee', axes: vec({ casual: 2, mood: 1 }) },
      { id: 'aero', label: 'Aero race cut', axes: vec({ speed: 2, style: 1 }) },
    ],
  },
  {
    id: 'shoes',
    title: 'Pick your shoes',
    subtitle: "What's on your feet on race day?",
    options: [
      { id: 'trainer', label: 'Daily trainer', axes: vec({ discipline: 1, endurance: 1 }) },
      { id: 'carbon', label: 'Carbon race plate', axes: vec({ speed: 2, bling: 1 }) },
      { id: 'trail', label: 'Trail grip', axes: vec({ endurance: 2, casual: 1 }) },
      { id: 'sale', label: 'Whatever was on sale', axes: vec({ casual: 2, mood: 1 }) },
    ],
  },
  {
    id: 'time',
    title: 'When do you run?',
    subtitle: 'Your real schedule, not your ideal one.',
    options: [
      { id: 'dawn', label: 'Before sunrise', axes: vec({ discipline: 2 }) },
      { id: 'noon', label: 'Midday break', axes: vec({ discipline: 1, casual: 1 }) },
      { id: 'evening', label: 'Golden hour', axes: vec({ mood: 2, social: 1 }) },
      { id: 'night', label: 'After dark', axes: vec({ style: 1, casual: 1, mood: 1 }) },
    ],
  },
  {
    id: 'goal',
    title: "What's the goal?",
    subtitle: 'Be honest, no one is grading this.',
    options: [
      { id: 'pr', label: 'Chase a new PR', axes: vec({ speed: 2, discipline: 1 }) },
      { id: 'weight', label: 'Get stronger, lose weight', axes: vec({ endurance: 1, discipline: 1 }) },
      { id: 'headspace', label: 'Clear my head', axes: vec({ mood: 2 }) },
      { id: 'people', label: 'Meet people, join a pack', axes: vec({ social: 2 }) },
      { id: 'medals', label: 'Collect medals', axes: vec({ bling: 2, social: 1 }) },
    ],
  },
];

export const RUNNER_TYPES = [
  {
    id: 'solo',
    name: 'The Solo Runner',
    tagline: 'Composed outside, focused inside.',
    axes: vec({ discipline: 3, style: 2, social: -1 }),
    description:
      'You run for the quiet, not the crowd. Every route is yours alone, and that\u2019s exactly the point.',
    praise:
      'Onlookers call it a hobby. You know it\u2019s a discipline. Keep trusting the pavement under your own two feet \u2014 you\u2019ve already built the hardest habit there is: showing up with no one watching.',
  },
  {
    id: 'club',
    name: 'The Club Runner',
    tagline: 'Structure, camaraderie, a whole crew.',
    axes: vec({ social: 3, discipline: 1, bling: 1 }),
    description:
      'Running feels like belonging to you. Advice, banter, someone waiting at the meeting point \u2014 that\u2019s your fuel.',
    praise:
      'You turned a solitary sport into a community. That\u2019s a rare skill, and your pace group is lucky to have you setting the tone.',
  },
  {
    id: 'dawn',
    name: 'The Early Bird',
    tagline: 'Dawn patrol, every single day.',
    axes: vec({ discipline: 3, mood: 1 }),
    description:
      'Pre-dawn air, quiet streets, a head start on everyone still asleep. You\u2019ve made peace with the alarm clock.',
    praise:
      'Anyone can want a healthier life. Getting up before the sun to go get it, in the dead of winter, on repeat \u2014 that\u2019s a different level. Respect.',
  },
  {
    id: 'weightloss',
    name: 'The Transformer',
    tagline: 'Playing the long game with the kitchen too.',
    axes: vec({ endurance: 2, discipline: 2 }),
    description:
      'You know running alone isn\u2019t magic \u2014 it\u2019s consistency plus discipline plus patience. So that\u2019s exactly what you bring.',
    praise:
      'Real change is boring and repetitive and you show up anyway. Every kilometer you log is proof it\u2019s working. Keep stacking them.',
  },
  {
    id: 'mood',
    name: 'The Mood Booster',
    tagline: 'Therapy you can lace up.',
    axes: vec({ mood: 3, casual: 1 }),
    description:
      'You know exactly what a bad day needs: a route, some air, and forty-five minutes to yourself.',
    praise:
      'You\u2019ve figured out something a lot of people never do \u2014 that your legs can carry your mood somewhere better. That\u2019s a genuine superpower.',
  },
  {
    id: 'long',
    name: 'The Long Hauler',
    tagline: 'The longer, the merrier.',
    axes: vec({ endurance: 3, discipline: 1 }),
    description:
      'A half marathon is a Tuesday. You measure good runs in hours, not kilometers, and you wouldn\u2019t have it any other way.',
    praise:
      'Most people can\u2019t sit still for the time you spend running. You\u2019ve built the patience and the legs for the long road, literally.',
  },
  {
    id: 'trendy',
    name: 'The Trendy Runner',
    tagline: 'Color-coded and camera ready.',
    axes: vec({ style: 3, bling: 1 }),
    description:
      'Running is a fashion show and you showed up dressed for it. Detail, detail, detail.',
    praise:
      'Looking good and running well aren\u2019t opposites \u2014 you\u2019ve just proven you can do both. Confidence is part of the training plan too.',
  },
  {
    id: 'bling',
    name: 'The Bling Collector',
    tagline: 'Another race, another medal.',
    axes: vec({ bling: 3, social: 1 }),
    description:
      'Your wall is starting to run out of hooks. Parkruns, virtual races, local 10Ks \u2014 you show up for all of it.',
    praise:
      'Every medal on that wall is a day you didn\u2019t skip. That\u2019s not vanity, that\u2019s a visible record of showing up. Keep the wall growing.',
  },
  {
    id: 'anywhere',
    name: 'The Anywhere Runner',
    tagline: "Never travels without running gear.",
    axes: vec({ casual: 2, endurance: 1, style: 1 }),
    description:
      'New city, new time zone, doesn\u2019t matter \u2014 you\u2019re already searching "best running routes near me."',
    praise:
      'You\u2019ve made running impossible to skip, no matter where life takes you. That\u2019s the kind of habit that actually survives real life.',
  },
  {
    id: 'reluctant',
    name: 'The Convert',
    tagline: 'Started reluctant. Stayed for the results.',
    axes: vec({ casual: 3, mood: -1, discipline: -1 }),
    description:
      'You didn\u2019t fall in love with running on day one. You fell in love with what it did for you, and that stuck.',
    praise:
      'Starting something you didn\u2019t even like and sticking with it anyway is its own kind of discipline. However you got here, you\u2019re here.',
  },
  {
    id: 'atlit',
    name: 'Si Paling Atlit',
    tagline: 'The one chasing the podium.',
    axes: vec({ speed: 3, discipline: 2 }),
    description:
      'Splits, intervals, race calendars \u2014 you treat running like the competitive sport it actually is.',
    praise:
      'Not everyone wants to race the clock. You do, and that hunger is exactly what turns training into performance.',
  },
  {
    id: 'happy',
    name: 'Si Happy Happy',
    tagline: 'Running with zero pressure attached.',
    axes: vec({ mood: 2, casual: 2 }),
    description:
      'No watch obsession, no pace anxiety \u2014 just good music, good air, and a route that feels good today.',
    praise:
      'You\u2019ve unlocked the version of running most people are still chasing: doing it purely because it feels good. Protect that.',
  },
  {
    id: 'pencitraan',
    name: 'Si Pencitraan',
    tagline: 'If it\u2019s not on the grid, did it happen?',
    axes: vec({ style: 2, bling: 2, social: 1 }),
    description:
      'The route matters, but so does the light. You run the pretty streets and you post the good ones.',
    praise:
      'Sharing your runs gets other people off the couch more than they\u2019ll admit. Keep making it look good \u2014 it\u2019s working as motivation, not just as a photo.',
  },
  {
    id: 'silent',
    name: 'Si Paling Silent',
    tagline: 'No posts. No pace talk. Just mileage.',
    axes: vec({ discipline: 3, social: -2, style: -1 }),
    description:
      'You\u2019ve logged more kilometers than half your friend list combined, and none of them know it.',
    praise:
      'Quiet consistency is the hardest kind to keep up, because no one is clapping for it. You don\u2019t need the applause. That\u2019s real discipline.',
  },
];

export function matchRunnerType(picks) {
  const total = Object.fromEntries(AXES.map((a) => [a, 0]));
  picks.forEach((axesObj) => {
    AXES.forEach((a) => {
      total[a] += axesObj[a] || 0;
    });
  });

  let best = RUNNER_TYPES[0];
  let bestScore = -Infinity;
  for (const type of RUNNER_TYPES) {
    let score = 0;
    AXES.forEach((a) => {
      score += total[a] * type.axes[a];
    });
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}
