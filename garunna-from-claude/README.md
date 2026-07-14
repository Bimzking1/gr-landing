# GARUNA — landing page

Next.js 14 (App Router) + Tailwind CSS landing page for GARUNA: a
runner-profiling mini-game, a pace/mileage projection game, and a
client-side `.fit` file reader with charts and a route map.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What's in here

- `app/page.js` — assembles the four sections: Hero, Profiling game,
  Projection game, Fit reader.
- `components/ProfilingGame.jsx` — 4-step gear quiz → matches an
  8-axis scoring vector against 15 runner archetypes
  (`lib/runnerTypes.js`, includes the Indonesian archetypes from the brief)
  and reveals a description + a motivating line. Ends with a
  nickname/email capture before the reveal (the actual lead-gen "bait").
- `components/ProjectionGame.jsx` — experience level + shoes + goal +
  pacer toggle → projected pace, daily mileage, and longest-run tier.
  Formula lives in `lib/projection.js`; it's intentionally simple and
  transparent, not a training-science model.
- `components/FitReader.jsx` + `lib/fitDecoder.js` — a from-scratch FIT
  binary decoder (file_id / session / record messages, compressed
  timestamps, standard base types). No parser dependency.
- `components/TutorialCarousel.jsx` — the "how do I get my .fit file"
  walkthrough, using your 4 Strava screenshots from `public/tutorial/`.
- `components/RouteMap.jsx` — Leaflet route map, loaded client-only via
  `next/dynamic` since Leaflet touches `window`.
- `lib/localFeed.js` — **demo-only** localStorage "community feed" so
  the page can show other uploads on the same device. This is a stand-in
  for a real backend — swap in an API route + database and nothing else
  in `FitReader` needs to change.

## Fixed from the earlier prototype

Your original `fit-visualizer.html` had two real bugs, both fixed in
`lib/fitDecoder.js`:

1. It rendered charts/map by mutating the DOM (`innerHTML`/`outerHTML`)
   to swap in "no data" placeholders. Once a `<canvas>` got replaced
   that way, loading a *second* file that actually had that data type
   threw a null-reference error trying to draw into a canvas that no
   longer existed — and because that error was caught by the same
   try/catch as the FIT parser, it got misreported as "this file
   couldn't be parsed," even though decoding worked fine. This version
   renders declaratively from React state every time, so nothing is
   ever destroyed.
2. Record messages with no timestamp field of their own (common when a
   file mixes normal and compressed-timestamp records) were silently
   dropped. This version falls back to the last known timestamp instead
   of discarding the sample.

## Design tokens (from your brief)

| Token | Hex |
|---|---|
| Background | `#0A0A0A` |
| Panel | `#111111` / `#1E1E1E` |
| Text | `#F5F5F0` |
| Text dim | `#888888` / `#555555` / `#2A2A2A` |
| Accent | `#C8FF00` / `#DAF748` |

Fonts: Anton (display headlines), Space Grotesk (body), JetBrains Mono
(labels, badges, data — matches the GPS-watch terminal feel of the fit
reader).

## Notes / next steps

- The community feed is local-only right now (see above) — you'll want
  a real API + DB before launch.
- The lead-capture fields in the profiling game don't submit anywhere
  yet — wire them to your email tool of choice (Mailchimp, Resend, etc.).
- Animations: shiny-text sweep (`.shiny-text` in `globals.css`) and an
  ambient dot-grid background with a pointer-follow glow
  (`components/DotGrid.jsx`), per your reactbits.dev references.
