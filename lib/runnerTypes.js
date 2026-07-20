// GARUNA runner-profiling engine v2.
// 21 archetypes, 6-step point-accumulation scoring from CSV data.
// Tie-break: alphabetical by title on exact ties.

export const QUIZ_STEPS = [
  {
    id: 'jersey', title: 'Choose your jersey',
    subtitle: 'Attention! your choices will affect your card results',
    options: [
      { id: 'club-jersey', label: 'Club Jersey' },
      { id: 'race-singlet', label: 'Race Singlet' },
      { id: 'oversized-tee', label: 'Oversized Tee' },
      { id: 'compression-shirt', label: 'Compression Shirt' },
      { id: 'finisher-event-shirt', label: 'Finisher Event Shirt' },
      { id: 'random-free-event-tee', label: 'Random Free Event Tee' },
    ],
  },
  {
    id: 'shoes', title: 'Pick your shoes',
    subtitle: 'What\'s on your feet on race day?',
    options: [
      { id: 'daily-trainer', label: 'Daily Trainer' },
      { id: 'carbon-race-shoes', label: 'Carbon Race Shoes' },
      { id: 'trail-shoes', label: 'Trail Shoes' },
      { id: 'fashion-sneakers', label: 'Fashion Sneakers' },
      { id: 'cheapest-shoes', label: 'Cheapest Shoes' },
      { id: 'old-reliable-pair', label: 'Old Reliable Pair' },
    ],
  },
  {
    id: 'gear', title: 'Add your gear',
    subtitle: 'What tech do you bring on a run?',
    options: [
      { id: 'garmin-watch', label: 'Garmin Watch' },
      { id: 'coros-watch', label: 'COROS Watch' },
      { id: 'apple-watch', label: 'Apple Watch' },
      { id: 'strava-on-phone', label: 'Strava on Phone' },
      { id: 'no-tracking', label: 'No Tracking' },
    ],
  },
  {
    id: 'time', title: 'Select your favorite running time',
    subtitle: 'Your real schedule, not your ideal one.',
    options: [
      { id: 'before-sunrise', label: 'Before Sunrise' },
      { id: 'morning', label: 'Morning' },
      { id: 'afternoon', label: 'Afternoon' },
      { id: 'evening', label: 'Evening' },
      { id: 'midnight', label: 'Midnight' },
      { id: 'whenever-i-can', label: 'Whenever I Can' },
    ],
  },
  {
    id: 'companion', title: 'Pick your running companion',
    subtitle: 'Who\'s running with you?',
    options: [
      { id: 'alone', label: 'Alone' },
      { id: 'running-club', label: 'Running Club' },
      { id: 'one-friend', label: 'One Friend' },
      { id: 'large-group', label: 'Large Group' },
      { id: 'my-dog', label: 'My Dog' },
      { id: 'whoever-invites-me', label: 'Whoever Invites Me' },
    ],
  },
  {
    id: 'goal', title: 'Choose your goal',
    subtitle: 'Be honest, no one is grading this.',
    options: [
      { id: 'lose-weight', label: 'Lose Weight' },
      { id: 'be-healthier', label: 'Be Healthier' },
      { id: 'finish-my-first-5k', label: 'Finish My First 5K' },
      { id: 'complete-a-marathon', label: 'Complete a Marathon' },
      { id: 'collect-medals', label: 'Collect Medals' },
      { id: 'just-have-fun', label: 'Just Have Fun' },
    ],
  },
];

// Scoring table: step-id -> choice-id -> [{archetype, points}]
// v7: Final rebalanced scoring — all tiers within target ranges.
//   Common ~39%, Uncommon ~30%, Rare ~17%, Epic ~9%, Legendary ~5%
//   All 21 archetypes reachable. Validated with 38,880 brute-force combos.
const S = {
  jersey: {
    'club-jersey': [['Club Runner',3],['Silent Assassin',1.3]],
    'race-singlet': [['Ambitious Late Bloomer',2],['Long Runner',2],['PB Hunter',1.3]],
    'oversized-tee': [['Mood Booster Runner',1.5],['Playlist Merchant',1.3],['Reward Runner',1.3],['Weight Loss Runner',1]],
    'compression-shirt': [['Early Bird',2.5],['Pace Demon',1.5],['Health Runner',1]],
    'finisher-event-shirt': [['Gear Acquisition Syndrome',1.3],['Medal Hunter',3],['Trendy Runner',1]],
    'random-free-event-tee': [['Coffee Run Enjoyer',1.3],['Reluctant Runner',2],['Start\'n\'Stop Runner',1.5]],
  },
  shoes: {
    'daily-trainer': [['Health Runner',2],['Silent Assassin',1.3],['Weight Loss Runner',1]],
    'carbon-race-shoes': [['Ambitious Late Bloomer',1],['Gear Acquisition Syndrome',1.3],['PB Hunter',1.3],['Pace Demon',1.3],['Trendy Runner',1]],
    'trail-shoes': [['Anywhere Runner',3],['Long Runner',1]],
    'fashion-sneakers': [['Strava CEO',1.3],['Trendy Runner',3]],
    'cheapest-shoes': [['Coffee Run Enjoyer',1.3],['Reluctant Runner',2],['Reward Runner',1.3],['Start\'n\'Stop Runner',1.5]],
    'old-reliable-pair': [['Playlist Merchant',1.3],['Solo Runner',2],['Start\'n\'Stop Runner',2]],
  },
  gear: {
    'garmin-watch': [['Gear Acquisition Syndrome',1.3],['Long Runner',2],['Pace Demon',1.3]],
    'coros-watch': [['Ambitious Late Bloomer',2],['PB Hunter',1.3]],
    'apple-watch': [['Health Runner',2],['Strava CEO',1.3],['Weight Loss Runner',1]],
    'strava-on-phone': [['Mood Booster Runner',2],['Playlist Merchant',1.3],['Reward Runner',1.3],['Strava CEO',1.3]],
    'no-tracking': [['Coffee Run Enjoyer',1.3],['Reluctant Runner',3],['Silent Assassin',1.3],['Start\'n\'Stop Runner',1.5]],
  },
  time: {
    'before-sunrise': [['Early Bird',4],['PB Hunter',1.3],['Pace Demon',1.5]],
    'morning': [['Gear Acquisition Syndrome',1.3],['Health Runner',2],['Reward Runner',1.3],['Weight Loss Runner',1],['Club Runner',1]],
    'afternoon': [['Coffee Run Enjoyer',1.3],['Strava CEO',1.3],['Trendy Runner',2]],
    'evening': [['Mood Booster Runner',2],['Playlist Merchant',1.5],['Solo Runner',1],['Club Runner',1]],
    'midnight': [['Silent Assassin',1.3],['Solo Runner',3]],
    'whenever-i-can': [['Anywhere Runner',4],['Start\'n\'Stop Runner',2],['Reluctant Runner',1]],
  },
  companion: {
    'alone': [['PB Hunter',1.3],['Pace Demon',1.3],['Silent Assassin',1.3],['Solo Runner',4]],
    'running-club': [['Club Runner',4],['Playlist Merchant',1.3]],
    'one-friend': [['Mood Booster Runner',2],['Playlist Merchant',1.3],['Reward Runner',1.3],['Early Bird',1]],
    'large-group': [['Club Runner',2],['Gear Acquisition Syndrome',1.3],['Strava CEO',1.3],['Trendy Runner',1]],
    'my-dog': [['Coffee Run Enjoyer',1.3],['Mood Booster Runner',2],['Weight Loss Runner',1]],
    'whoever-invites-me': [['Anywhere Runner',2],['Start\'n\'Stop Runner',2],['Reluctant Runner',1]],
  },
  goal: {
    'lose-weight': [['Weight Loss Runner',4],['Health Runner',1]],
    'be-healthier': [['Health Runner',3.5],['Solo Runner',1]],
    'finish-my-first-5k': [['Ambitious Late Bloomer',2],['PB Hunter',1.3],['Start\'n\'Stop Runner',1],['Reluctant Runner',1]],
    'complete-a-marathon': [['Long Runner',3],['Pace Demon',1.5],['Silent Assassin',1.3]],
    'collect-medals': [['Gear Acquisition Syndrome',1.3],['Medal Hunter',4],['Trendy Runner',1]],
    'just-have-fun': [['Coffee Run Enjoyer',1.3],['Mood Booster Runner',2.5],['Playlist Merchant',1.3],['Reward Runner',1.3],['Start\'n\'Stop Runner',1],['Reluctant Runner',1]],
  },
};

// Default Spotify playlist (placeholder — user will replace per archetype later)
const DEFAULT_SPOTIFY = '37i9dQZF1DX76Wlfdnj7AP';

export const RUNNER_ARCHETYPES = [
  {
    id:'health-runner', title:'The Health Runner', emoji:'❤️',
    tagline:'Doctor Approved', rarity:'Common',
    quotes:['"Future me will thank today\'s me."','"Health first, medals later."','"Every run is a deposit in my future self."'],
    descriptions:['You don\'t chase medals. You chase a healthier life.','Consistency over intensity — treats every kilometer like preventive medicine.','No PRs to brag about, just blood pressure numbers to be proud of.'],
    signatureMoves:'Tracks heart rate; Loves recovery; Never skips stretching; Reads nutrition labels',
    starterPack:'Apple Watch; Daily Trainer; Healthy Meal; Stretching',
    spotifyId: '47Bob70NWZhCrfKtuOQCEZ',
  },
  {
    id:'mood-booster', title:'Mood Booster Runner', emoji:'😌',
    tagline:'Healing Era', rarity:'Common',
    quotes:['"Bad mood? Time to disappear for 5K."','"Cheaper than therapy, faster than a nap."','"Running until the noise in my head quiets down."'],
    descriptions:['Running is your reset button. Every kilometer deletes today\'s stress.','Music in the ears, worries on the pavement — every session is an emotional reset.','Not training for a race, training for a better mood by dinner time.'],
    signatureMoves:'Runs after bad days; Playlist > Pace; Sunset enjoyer; Endorphin addict',
    starterPack:'Spotify Playlist; Evening Run; Comfortable Shoes; Phone Holder',
    spotifyId: '32qe84TJEQ3o30zV9zLqCk',
  },
  {
    id:'solo-runner', title:'The Solo Runner', emoji:'🐺',
    tagline:'Main Character', rarity:'Common',
    quotes:['"Me, myself, and my playlist."','"Company is optional. Quiet is mandatory."','"The road doesn\'t ask questions."'],
    descriptions:['Running is your personal therapy session. No drama, no waiting, no small talk — just you and the road.','Runs alone by choice, not circumstance, and wouldn\'t have it any other way.','Finds more peace in an empty route than in any conversation.'],
    signatureMoves:'Runs alone; Rarely talks; Loves quiet routes; Disappears after finishing',
    starterPack:'Noise Cancelling Earbuds; Old Reliable Shoes; Night Run; Empty Route',
    spotifyId: '4Voq1DxBQ2TrhkbarP5476',
  },
  {
    id:'weight-loss', title:'Weight Loss Runner', emoji:'⚖️',
    tagline:'Calorie Hunter', rarity:'Common',
    quotes:['"Burger malam? Gapapa, tadi udah 8K."','"Every step is a calorie negotiation."','"Started for the scale, stayed for the high."'],
    descriptions:['Running started as a weight-loss journey, but somehow became a lifestyle.','Tracks calories as closely as pace, and celebrates every pound like a podium finish.','What began as damage control turned into a genuine love for moving.'],
    signatureMoves:'Always checks calories; Loves seeing progress; Happy every PR; Celebrates consistency',
    starterPack:'Oversized Tee; Daily Trainer; Banana; Health App',
    spotifyId: '4jDdCgeL50eBCrkEElGbqb',
  },
  {
    id:'club-runner', title:'The Club Runner', emoji:'🫂',
    tagline:'Anak Komunitas', rarity:'Uncommon',
    quotes:['"Lari sendirian? Gak seru bro."','"Squad pace beats personal pace."','"Running is better with witnesses."'],
    descriptions:['The social butterfly of the running world — every run somehow turns into coffee, breakfast, or planning the next race.','Knows the whole group\'s PBs, birthdays, and coffee orders.','Shows up for the run, stays for the community.'],
    signatureMoves:'Knows everyone\'s name; Always joins Sunday long runs; Has multiple community jerseys; Never skips group photos',
    starterPack:'Community Jersey; Daily Trainer; Garmin; Running Club',
    spotifyId: '6ehRV5yoliwyVz8MQXkmag',
  },
  {
    id:'early-bird', title:'The Early Bird', emoji:'🌅',
    tagline:'Jam 5 Udah Pace', rarity:'Uncommon',
    quotes:['"Alarm jam 4:30? Easy."','"Done before the city wakes up."','"Sunrise is basically my finish line."'],
    descriptions:['While everyone else is sleeping, you\'ve already finished 10K and uploaded it to Strava.','Trades sleep-ins for solitude and empty streets, every single day.','Has never once hit snooze on a run day.'],
    signatureMoves:'Loves sunrise; Runs before work; Highly disciplined; Probably drinks black coffee',
    starterPack:'Compression Tee; Daily Trainer; Garmin; Sunrise',
    spotifyId: '4hO0hEJN9wJygpZb694Ddq',
  },
  {
    id:'start-n-stop', title:'The Start\'n\'Stop Runner', emoji:'🌧️',
    tagline:'Seasonal Athlete', rarity:'Uncommon',
    quotes:['"Besok mulai lagi."','"New Year, new shoes, same story."','"Motivation is a seasonal subscription."'],
    descriptions:['When motivation hits, you\'re unstoppable. When it disappears, Netflix.','Owns three unused training plans and one very dusty pair of shoes.','Restarts more often than anyone — and somehow that\'s still a kind of consistency.'],
    signatureMoves:'New Year Resolution; Stops during rainy season; Comes back stronger; Repeats annually',
    starterPack:'Dusty Shoes; "Starting Monday"; Big Dreams',
    spotifyId: '5oC2f13CjXOI1RCyzkkufN',
  },
  {
    id:'reluctant-runner', title:'The Reluctant Runner', emoji:'😭',
    tagline:'Dipaksa Keadaan', rarity:'Uncommon',
    quotes:['"Aku juga gak tau kenapa aku di sini."','"Every kilometer is a personal grievance."','"Finishes complaining the whole way, finishes anyway."'],
    descriptions:['You don\'t love running. But somehow... you keep coming back.','Complains at kilometer one and is secretly proud at the finish line.','The reward meal is doing more of the motivating than the medal is.'],
    signatureMoves:'Complains every kilometer; Still finishes; Secretly improving; Low-key proud',
    starterPack:'Random Event Shirt; Cheapest Shoes; "Capek bro."; Reward Meal',
    spotifyId: '04rcnIziYHHJzJxBRPtDKS',
  },
  {
    id:'anywhere-runner', title:'The Anywhere Runner', emoji:'🌍',
    tagline:'Touch Grass', rarity:'Rare',
    quotes:['"Vacation = New Running Route."','"New city, new PB attempt."','"My suitcase always has room for running shoes."'],
    descriptions:['Every city has a route. Every trip includes running shoes.','Turns every business trip and vacation into a scouting mission for scenic routes.','Has more stamps in a running app than in a passport.'],
    signatureMoves:'Runs while traveling; Loves exploring; New route every week; Google Maps athlete',
    starterPack:'Backpack; Trail Shoes; Maps; Scenic Route',
    spotifyId: '7xFPLj3RMCuLvWhv4nD0A0',
  },
  {
    id:'trendy-runner', title:'The Trendy Runner', emoji:'✨',
    tagline:'Fit Check Dulu', rarity:'Rare',
    quotes:['"Pace nanti aja, outfit dulu."','"Fit check before finish line check."','"If it\'s not aesthetic, did the run even happen?"'],
    descriptions:['Running is also fashion. Matching socks matter.','Plans the outfit before planning the route.','The pace is negotiable; the color coordination is not.'],
    signatureMoves:'Color coordinated; Limited edition shoes; Loves aesthetic cafes; Story every run',
    starterPack:'Carbon Shoes; Running Cap; Selfie; Expensive Sunglasses',
    spotifyId: '1g58rOWiNvodcLznxsq8dH',
  },
  {
    id:'medal-hunter', title:'The Medal Hunter', emoji:'🏅',
    tagline:'Bling Collector', rarity:'Rare',
    quotes:['"No medal? Didn\'t happen."','"Sign-up button is my cardio."','"My wall has run out of hooks."'],
    descriptions:['Your wall is slowly turning into a medal museum.','Registers for races the way other people collect stamps.','A T-shirt is nice, but the medal is the whole point.'],
    signatureMoves:'Signs up every weekend; Loves race expos; Medal > T-shirt; Event addict',
    starterPack:'Medal Rack; Race Calendar; Early Bird Ticket; Race Shoes',
    spotifyId: '78fxI28j3hsvqJUlDPVxBJ',
  },
  {
    id:'long-runner', title:'The Long Runner', emoji:'🏔️',
    tagline:'Distance Addict', rarity:'Epic',
    quotes:['"5K is just warming up."','"Ask me about my next ultra."','"Distance is the whole hobby."'],
    descriptions:['You don\'t count kilometers. You count adventures.','Treats a half marathon as a light Sunday activity.','Always eyeing the next distance up, no matter how far the current one already is.'],
    signatureMoves:'Loves LSD; HM? Easy.; Marathon? Why not.; Ultra? Tempting...',
    starterPack:'Running Vest; Energy Gel; Garmin; Premium Trainer',
    spotifyId: '64iAO8Xa8Tu1ZzdilW1on0',
  },
  {
    id:'ambitious-late-bloomer', title:'The Ambitious Late Bloomer', emoji:'🚀',
    tagline:'Gas Sekalian', rarity:'Epic',
    quotes:['"Baru mulai... target marathon."','"Started last month, registered for everything."','"Why ease in when you can dive in?"'],
    descriptions:['You discovered running recently... and immediately signed up for three races.','Zero experience, maximum ambition, and a training plan that\'s a little too optimistic.','Went from couch to marathon-curious in record time.'],
    signatureMoves:'Watches race vlogs; Buys too much gear; Wants every PB; Dreams big',
    starterPack:'Carbon Shoes; Garmin; Training Plan; Race Calendar',
    spotifyId: '1DLdOdEf9BWYZ7Ja2FDqKa',
  },
  {
    id:'strava-ceo', title:'The Strava CEO', emoji:'📸',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"If it\'s not uploaded, it didn\'t happen."','"Kudos or it didn\'t count."','"The caption takes longer than the cool-down."'],
    descriptions:['Posts every run within moments of finishing.','Writes a small essay in the caption for a 3K jog.','Checks kudos more often than pace.'],
    signatureMoves:'Uploads before stretching; Writes essays in captions; Kudos addict',
    starterPack:'Phone Mount; Strava Premium Subscription; Selfie Stick; Draft Captions Folder',
    spotifyId: '4dN1QbBEuphiVRPvbGpTsm',
  },
  {
    id:'pace-demon', title:'The Pace Demon', emoji:'💀',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Easy run 4:20/km."','"There\'s no such thing as a rest day pace."','"Zone 2 is a rumor I\'ve heard about."'],
    descriptions:['Claims it\'s Zone 2. Nobody believes them.','Every \'easy jog\' quietly turns into a time trial.','Has never once let a stranger pass without a mental battle.'],
    signatureMoves:'Calls sub-4:30 pace \'easy\'; Denies the training data; Out-sprints strangers by accident',
    starterPack:'Multiple GPS Watches; Compression Socks; Competitive Streak; Denial',
    spotifyId: '4kiIeD3cy4OFGWFqQZdSyb',
  },
  {
    id:'playlist-merchant', title:'Playlist Merchant', emoji:'🎧',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Every kilometer deserves its own track."','"17 playlists and counting."','"My library has a genre for every mood and mile."'],
    descriptions:['Has 17 running playlists. Changes music every kilometer.','Spends more time curating the soundtrack than actually running.','Believes the right song can add thirty seconds to your pace.'],
    signatureMoves:'Builds a new playlist for every run type; Skips songs mid-stride; Renames playlists constantly',
    starterPack:'17 Curated Playlists; Noise-Cancelling Earbuds; Backup Earbuds; Playlist-Naming Skills',
    spotifyId: '2xJD0gqaOk15bnjcL1UpV1',
  },
  {
    id:'coffee-run-enjoyer', title:'Coffee Run Enjoyer', emoji:'☕',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"The run is just the appetizer."','"5K there, 3 hours at the café."','"Running is the excuse, coffee is the destination."'],
    descriptions:['Runs 5K, then spends three hours at the café afterward.','The warm-down is longer than the workout, and that\'s the point.','Would happily run further if it meant a better café at the end.'],
    signatureMoves:'Picks routes by café location; Orders before stretching; Treats the run as a warm-up for brunch',
    starterPack:'Reusable Cup; Café Loyalty Card; Post-Run Pastry; Zero Sense of Urgency',
    spotifyId: '5MTo1Kqx6DwL3lYwEeysjJ',
  },
  {
    id:'gear-acquisition', title:'Gear Acquisition Syndrome', emoji:'🛒',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Nine shoes, fourteen kilometers a week."','"The gear closet is more impressive than the training log."','"I collect equipment. Technically, I also run."'],
    descriptions:['Owns 9 shoes, 4 watches, 12 jerseys. Weekly mileage: 14 km.','Buys the gear for the runner they\'re planning to become.','Shopping-cart PRs outnumber actual running PRs.'],
    signatureMoves:'Unboxes gear on camera; Compares specs endlessly; Buys before trying; Runs occasionally',
    starterPack:'9 Pairs of Shoes; 4 GPS Watches; 12 Jerseys; Unopened Boxes',
    spotifyId: '2tP9tVxTWVFVLGbj3KIADm',
  },
  {
    id:'silent-assassin', title:'Silent Assassin', emoji:'🗿',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Never posts. Never talks."','"You\'ll only hear about the podium after it happens."','"No watch, no caption, no warning."'],
    descriptions:['Never posts, never talks, randomly wins age group — nobody knows where they came from.','Shows up quietly, runs fast, disappears before anyone can ask their name.','The results sheet is the only place they exist.'],
    signatureMoves:'Shows up unannounced; Wins without celebrating; Leaves before the photos; Never explains the time',
    starterPack:'Blank Race Bib; No Visible Watch; An Air of Mystery; A Podium Spot',
    spotifyId: '6QWkD3b806HRcdHm70Rer6',
  },
  {
    id:'pb-hunter', title:'PB Hunter', emoji:'🎯',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Easy run." (Average HR: 187.)','"Every run is secretly a time trial."','"There\'s no such thing as a casual pace."'],
    descriptions:['Every run somehow becomes a race.','Checks the split at every single kilometer marker, no exceptions.','Can\'t hear the word \'recovery\' without hearing \'opportunity\'.'],
    signatureMoves:'Turns easy runs into races; Checks splits every 100m; Sprints the last km; Refuses recovery days',
    starterPack:'Racing Flats; Heart-Rate Chest Strap; Stopwatch Mentality; Zero Chill',
    spotifyId: '1iK038h4FX9aTzgPvwEitN',
  },
  {
    id:'reward-runner', title:'Reward Runner', emoji:'🌮',
    tagline:'Bonus Rare', rarity:'Legendary',
    quotes:['"Burn 500, eat 1,500 — balance achieved."','"I run so the reward meal tastes earned."','"Perfect math: distance equals dessert."'],
    descriptions:['Burns 500 calories, eats 1,500 immediately afterward. Perfect balance.','Plans the post-run meal before planning the route.','Running is just the entry fee for the food that follows.'],
    signatureMoves:'Runs to earn food; Plans meals around mileage; Never feels guilty; Perfectly balances burn and reward',
    starterPack:'Snack Bag; Food-Delivery App; A Well-Earned Appetite; Zero Regrets',
    spotifyId: '4mmPo2wy9ZAsK2eyIOO5Ha',
  },
];

// Build a title->archetype lookup
const byTitle = {};
RUNNER_ARCHETYPES.forEach(a => { byTitle[a.title.replace(/^The /, '')] = a; byTitle[a.title] = a; });

// Fair stats per rarity tier — better rarity = faster pace, longer duration/distance
export const RARITY_STATS = {
  Common:    { pace: '07:30', duration: '20:00', distance: '3 KM' },
  Uncommon:  { pace: '06:45', duration: '25:00', distance: '5 KM' },
  Rare:      { pace: '06:00', duration: '30:00', distance: '7 KM' },
  Epic:      { pace: '05:30', duration: '40:00', distance: '10 KM' },
  Legendary: { pace: '04:45', duration: '60:00', distance: '15 KM' },
};

// Map rarity tier to card image
export const RARITY_CARDS = {
  Common: '/newer-design/common-card.png',
  Uncommon: '/newer-design/uncommon-card.png',
  Rare: '/newer-design/rare-card.png',
  Epic: '/newer-design/epic-card.png',
  Legendary: '/newer-design/legendary-card.png',
};

/**
 * Score 6 choices and return the winning archetype.
 * @param {string[]} choiceIds — array of 6 choice IDs, one per step
 */
export function matchRunnerType(choiceIds) {
  const scores = {};
  RUNNER_ARCHETYPES.forEach(a => { scores[a.title] = 0; });

  QUIZ_STEPS.forEach((step, i) => {
    const choiceId = choiceIds[i];
    const entries = S[step.id]?.[choiceId];
    if (!entries) return;
    entries.forEach(([archTitle, pts]) => {
      if (scores[archTitle] !== undefined) scores[archTitle] += pts;
    });
  });

  // Find max score
  let maxScore = -Infinity;
  for (const title in scores) {
    if (scores[title] > maxScore) maxScore = scores[title];
  }

  // Collect all archetypes with max score, tie-break alphabetically
  const winners = Object.keys(scores).filter(t => scores[t] === maxScore);
  winners.sort();
  const winnerTitle = winners[0];

  return RUNNER_ARCHETYPES.find(a => a.title === winnerTitle) || RUNNER_ARCHETYPES[0];
}
