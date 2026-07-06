'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { parseFit, buildActivityModel, formatDuration, formatPace, formatDateTime, num } from '@/lib/fitDecoder';
import { saveActivityToFeed, getFeed } from '@/lib/localFeed';
import TutorialCarousel from './TutorialCarousel';

const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { ticks: { color: '#888888', maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#1E1E1E' } },
    y: { ticks: { color: '#888888', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#1E1E1E' } },
  },
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: { family: 'JetBrains Mono' }, bodyFont: { family: 'JetBrains Mono' } },
  },
};

export default function FitReader() {
  const fileInputRef = useRef(null);
  const [activity, setActivity] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    setFeed(getFeed());
  }, []);

  function handleFile(file) {
    setError('');
    setActivity(null);

    if (!file.name.toLowerCase().endsWith('.fit')) {
      setError('Please choose a file with a .fit extension.');
      return;
    }

    setStatus(`Reading ${file.name} …`);
    const reader = new FileReader();
    reader.onerror = () => {
      setError('The file could not be read from disk. Please try again.');
      setStatus('');
    };
    reader.onload = () => {
      try {
        const decoded = parseFit(reader.result);
        const model = buildActivityModel(decoded);
        setActivity(model);
        setFileName(file.name);
        setStatus('');

        const entry = {
          sport: model.sport,
          distanceKm: model.distanceKm,
          avgPace: formatPace(model.avgSpeedKmh),
          durationSec: model.durationSec,
          date: model.startDate ? model.startDate.toISOString() : null,
        };
        saveActivityToFeed(entry);
        setFeed(getFeed());
      } catch (err) {
        setError(err.message || 'This file could not be parsed as a FIT activity file.');
        setStatus('');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const tiles = activity && [
    { label: 'Duration', value: formatDuration(activity.durationSec) },
    { label: 'Distance', value: num(activity.distanceKm, 2), unit: 'km' },
    { label: 'Avg Pace', value: formatPace(activity.avgSpeedKmh) },
    { label: 'Avg Heart Rate', value: activity.avgHr !== null ? num(activity.avgHr, 0) : '—', unit: activity.avgHr !== null ? 'bpm' : '' },
    { label: 'Max Heart Rate', value: activity.maxHr !== null ? num(activity.maxHr, 0) : '—', unit: activity.maxHr !== null ? 'bpm' : '' },
    { label: 'Elevation Gain', value: activity.elevationGain !== null ? num(activity.elevationGain, 0) : '—', unit: 'm' },
    { label: 'Calories', value: activity.calories !== null ? num(activity.calories, 0) : '—', unit: activity.calories !== null ? 'kcal' : '' },
    { label: 'Sport', value: activity.sport },
  ];

  const labels = activity ? activity.series.map((p) => formatDuration(p.t)) : [];
  const hasSpeed = activity && activity.series.some((p) => p.speedKmh !== null);
  const hasHr = activity && activity.series.some((p) => p.hr !== null);
  const hasEle = activity && activity.series.some((p) => p.ele !== null);

  return (
    <section id="fit-reader" className="relative py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-lime">Your data, decoded</span>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">
          UPLOAD YOUR
          <br />
          .FIT FILE.
        </h2>
        <p className="mt-4 text-grey-400">
          Pull your original activity file straight from Strava and see the full breakdown —
          pace, heart rate, elevation, and your route on the map. Parsed entirely in your browser.
        </p>
        <div className="mt-3">
          <TutorialCarousel />
        </div>
      </div>

      <div className="mt-10 max-w-3xl mx-auto">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
            dragOver ? 'border-lime bg-lime/5' : error ? 'border-red-500/60' : 'border-grey-600 bg-ink-soft'
          }`}
        >
          <p className="font-display text-xl">Drop a .fit file to visualize your run</p>
          <p className="mt-2 text-sm text-grey-400">Works with files exported from Garmin, Coros, Strava, and Wahoo.</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="mt-5 rounded-full bg-lime text-ink font-semibold px-6 py-2.5 text-sm hover:bg-lime-soft transition-colors"
          >
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fit"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-grey-500">
            .fit files only · parsed entirely in your browser · nothing is uploaded anywhere
          </p>
          {status && <p className="mt-3 font-mono text-xs text-lime">{status}</p>}
          {error && (
            <p className="mt-3 font-mono text-xs text-red-400 max-w-sm mx-auto">{error}</p>
          )}
        </div>

        {activity && (
          <div className="mt-10 animate-floatUp">
            <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-grey-600 bg-ink-soft px-5 py-4">
              <div>
                <p className="font-display text-lg">{activity.sport}</p>
                <p className="font-mono text-xs text-grey-400">{formatDateTime(activity.startDate)} · {fileName}</p>
              </div>
              <button
                onClick={() => { setActivity(null); setFileName(''); }}
                className="rounded-full border border-grey-600 px-4 py-2 text-xs hover:border-lime hover:text-lime transition-colors"
              >
                ↺ Load another file
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden border border-grey-600 bg-grey-600">
              {tiles.map((t) => (
                <div key={t.label} className="bg-ink-soft px-4 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-grey-400">{t.label}</p>
                  <p className="mt-1.5 font-mono font-bold text-lg">
                    {t.value}
                    {t.unit ? <span className="text-xs font-normal text-grey-400 ml-1">{t.unit}</span> : null}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              <ChartPanel title="Speed over time" swatch="#C8FF00" show={hasSpeed}>
                <Line
                  data={{ labels, datasets: [{ data: activity.series.map((p) => p.speedKmh), borderColor: '#C8FF00', backgroundColor: 'rgba(200,255,0,0.08)', fill: true, pointRadius: 0, borderWidth: 2, tension: 0.25 }] }}
                  options={chartOptions}
                />
              </ChartPanel>

              <ChartPanel title="Heart rate over time" swatch="#DAF748" show={hasHr}>
                <Line
                  data={{ labels, datasets: [{ data: activity.series.map((p) => p.hr), borderColor: '#DAF748', backgroundColor: 'rgba(218,247,72,0.08)', fill: true, pointRadius: 0, borderWidth: 2, tension: 0.25 }] }}
                  options={chartOptions}
                />
              </ChartPanel>

              <ChartPanel title="Elevation over time" swatch="#888888" show={hasEle}>
                <Line
                  data={{ labels, datasets: [{ data: activity.series.map((p) => p.ele), borderColor: '#B08968', backgroundColor: 'rgba(176,137,104,0.1)', fill: true, pointRadius: 0, borderWidth: 2, tension: 0.25 }] }}
                  options={chartOptions}
                />
              </ChartPanel>

              <div className="rounded-xl border border-grey-600 bg-ink-soft p-5">
                <p className="font-display text-sm mb-3">Route</p>
                {activity.gpsPoints.length > 1 ? (
                  <RouteMap points={activity.gpsPoints} />
                ) : (
                  <p className="font-mono text-xs text-grey-500 text-center py-10">No GPS coordinates in this file</p>
                )}
              </div>
            </div>
          </div>
        )}

        {feed.length > 0 && (
          <div className="mt-14">
            <p className="font-mono text-[11px] uppercase tracking-widest text-grey-400 mb-3">
              Community feed (stored on this device — demo only)
            </p>
            <div className="rounded-xl border border-grey-600 overflow-hidden">
              {feed.slice(0, 6).map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 border-b border-grey-600 last:border-0 bg-ink-soft text-sm">
                  <span className="text-grey-400">{f.sport}</span>
                  <span>{num(f.distanceKm, 1)} km</span>
                  <span className="font-mono text-lime-soft">{f.avgPace}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-grey-500">
              This feed lives in your browser for the prototype. Ship a real API + database
              to make it visible across users.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChartPanel({ title, swatch, show, children }) {
  return (
    <div className="rounded-xl border border-grey-600 bg-ink-soft p-5">
      <p className="font-display text-sm mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: swatch }} />
        {title}
      </p>
      {show ? (
        <div className="relative h-52">{children}</div>
      ) : (
        <p className="font-mono text-xs text-grey-500 text-center py-10">No data of this type in this file</p>
      )}
    </div>
  );
}
