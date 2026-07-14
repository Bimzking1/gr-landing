'use client';

export function parseTcx(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  const ns = 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2';
  const activities = doc.getElementsByTagNameNS(ns, 'Activity');
  if (!activities.length) throw new Error('No Activity found in TCX file.');

  const activityEl = activities[0];
  const sport = activityEl.getAttribute('Sport') || 'Other';

  const laps = activityEl.getElementsByTagNameNS(ns, 'Lap');
  let totalTimeSec = 0;
  let totalDistanceM = 0;
  const trackpoints = [];

  const seenAlt = {};

  for (let li = 0; li < laps.length; li++) {
    const lap = laps[li];

    const timeEl = lap.getElementsByTagNameNS(ns, 'TotalTimeSeconds')[0];
    const distEl = lap.getElementsByTagNameNS(ns, 'DistanceMeters')[0];

    totalTimeSec += timeEl ? parseFloat(timeEl.textContent) : 0;
    totalDistanceM += distEl ? parseFloat(distEl.textContent) : 0;

    const track = lap.getElementsByTagNameNS(ns, 'Track')[0];
    if (!track) continue;

    const points = track.getElementsByTagNameNS(ns, 'Trackpoint');
    for (let pi = 0; pi < points.length; pi++) {
      const pt = points[pi];

      const timeTag = pt.getElementsByTagNameNS(ns, 'Time')[0];
      const time = timeTag ? new Date(timeTag.textContent).getTime() / 1000 : null;

      const posEl = pt.getElementsByTagNameNS(ns, 'Position')[0];
      let lat = null, lon = null;
      if (posEl) {
        const latEl = posEl.getElementsByTagNameNS(ns, 'LatitudeDegrees')[0];
        const lonEl = posEl.getElementsByTagNameNS(ns, 'LongitudeDegrees')[0];
        lat = latEl ? parseFloat(latEl.textContent) : null;
        lon = lonEl ? parseFloat(lonEl.textContent) : null;
      }

      const hrEl = pt.getElementsByTagNameNS(ns, 'HeartRateBpm')[0];
      let hr = null;
      if (hrEl) {
        const valEl = hrEl.getElementsByTagNameNS(ns, 'Value')[0];
        hr = valEl ? parseInt(valEl.textContent, 10) : null;
      }

      const altEl = pt.getElementsByTagNameNS(ns, 'AltitudeMeters')[0];
      let ele = altEl ? parseFloat(altEl.textContent) : null;

      trackpoints.push({ time, lat, lon, hr, ele });
    }
  }

  if (trackpoints.length === 0) throw new Error('No trackpoints found in TCX file.');

  const startTimestamp = trackpoints[0].time;
  const startDate = startTimestamp ? new Date(startTimestamp * 1000) : null;

  const t0 = trackpoints[0].time;
  const series = trackpoints.map((tp, i) => ({
    t: t0 !== null ? tp.time - t0 : 0,
    speedKmh: null,
    hr: tp.hr,
    ele: tp.ele,
    lat: tp.lat,
    lon: tp.lon,
    distanceKm: null,
  }));

  let elevationGain = null;
  {
    let gain = 0;
    let prev = null;
    for (const p of series) {
      if (p.ele === null) continue;
      if (prev !== null && p.ele > prev) gain += p.ele - prev;
      prev = p.ele;
    }
    if (series.some(p => p.ele !== null)) elevationGain = Math.round(gain);
  }

  const durationSec = totalTimeSec || (series.length ? series[series.length - 1].t : null);
  const distanceKm = totalDistanceM ? totalDistanceM / 1000 : null;
  const avgSpeedKmh = distanceKm && durationSec ? distanceKm / (durationSec / 3600) : null;

  const hrValues = series.map(p => p.hr).filter(v => v !== null);
  const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null;
  const maxHr = hrValues.length ? Math.max(...hrValues) : null;

  const gpsPoints = series.filter(p => p.lat !== null && p.lon !== null);

  return {
    sport,
    startDate,
    durationSec,
    distanceKm,
    avgSpeedKmh,
    maxSpeedKmh: null,
    avgHr,
    maxHr,
    elevationGain,
    calories: null,
    series,
    gpsPoints,
  };
}
