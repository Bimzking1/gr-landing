// Minimal, dependency-free FIT binary decoder (file_id, session, record messages).
//
// Ported from an earlier prototype and fixed in two ways that matter for
// real Garmin/Coros/Wahoo exports:
//
// 1. The original UI mutated the DOM with outerHTML/innerHTML to swap in
//    "no data" placeholders for missing chart panels. Once a panel was
//    replaced that way, its <canvas> was gone from the DOM for good — so
//    loading a *second* file that DID have, say, speed data would throw
//    a null-reference error reading a canvas that no longer existed. That
//    error was caught by the outer try/catch and misreported as "this file
//    could not be parsed," even though decoding had actually succeeded.
//    This version only returns plain data; the React component renders
//    conditionally from state every time, so there is nothing to destroy.
//
// 2. Record messages with no timestamp field of their own (relying purely
//    on a compressed-timestamp header further downstream) were silently
//    dropped even when a running lastTimestamp was available. This version
//    falls back to the last known timestamp instead of discarding the point,
//    so files that mix normal and compressed-timestamp records keep every
//    sample instead of losing chunks of the trace.

export const FIT_EPOCH_OFFSET = 631065600; // seconds between 1970-01-01 and the FIT epoch (1989-12-31)

const BASE_TYPES = {
  0x00: { size: 1, invalid: 0xff, get: 'getUint8' },
  0x01: { size: 1, invalid: 0x7f, get: 'getInt8' },
  0x02: { size: 1, invalid: 0xff, get: 'getUint8' },
  0x83: { size: 2, invalid: 0x7fff, get: 'getInt16' },
  0x84: { size: 2, invalid: 0xffff, get: 'getUint16' },
  0x85: { size: 4, invalid: 0x7fffffff, get: 'getInt32' },
  0x86: { size: 4, invalid: 0xffffffff, get: 'getUint32' },
  0x07: { size: 1, invalid: 0x00, string: true },
  0x88: { size: 4, invalid: 0xffffffff, get: 'getFloat32' },
  0x89: { size: 8, invalid: null, get: 'getFloat64' },
  0x0a: { size: 1, invalid: 0x00, get: 'getUint8' },
  0x8b: { size: 2, invalid: 0x0000, get: 'getUint16' },
  0x8c: { size: 4, invalid: 0x00000000, get: 'getUint32' },
  0x0d: { size: 1, invalid: 0xff, get: 'getUint8' },
  0x8e: { size: 8, invalid: null, get: 'getBigInt64' },
  0x8f: { size: 8, invalid: null, get: 'getBigUint64' },
  0x90: { size: 8, invalid: null, get: 'getBigUint64' },
};

const SESSION_FIELDS = {
  2: 'start_time', 5: 'sport', 7: 'total_elapsed_time', 9: 'total_distance',
  11: 'total_calories', 14: 'avg_speed', 15: 'max_speed', 16: 'avg_heart_rate',
  17: 'max_heart_rate', 22: 'total_ascent', 23: 'total_descent',
};
const RECORD_FIELDS = {
  253: 'timestamp', 0: 'position_lat', 1: 'position_long', 2: 'altitude',
  3: 'heart_rate', 5: 'distance', 6: 'speed', 78: 'enhanced_altitude', 73: 'enhanced_speed',
};
const FILE_ID_FIELDS = { 0: 'type', 4: 'time_created' };
const GLOBAL_MSG = { FILE_ID: 0, SESSION: 18, RECORD: 20 };

export const SPORT_NAMES = {
  0: 'Generic', 1: 'Running', 2: 'Cycling', 4: 'Fitness Equipment', 5: 'Swimming',
  6: 'Basketball', 7: 'Soccer', 8: 'Tennis', 9: 'American Football', 10: 'Training',
  11: 'Walking', 12: 'Cross Country Skiing', 13: 'Alpine Skiing', 14: 'Snowboarding',
  15: 'Rowing', 16: 'Mountaineering', 17: 'Hiking', 18: 'Multisport', 19: 'Paddling',
  37: 'Yoga', 254: 'All',
};

function readField(view, offset, field, littleEndian) {
  const type = BASE_TYPES[field.baseType];
  if (!type) return null;

  if (type.string) {
    let str = '';
    for (let i = 0; i < field.size; i++) {
      const c = view.getUint8(offset + i);
      if (c === 0) break;
      str += String.fromCharCode(c);
    }
    return str || null;
  }

  if (offset + type.size > view.byteLength) return null;
  let raw;
  try {
    raw = view[type.get](offset, littleEndian);
  } catch {
    return null;
  }
  if (typeof raw === 'bigint') raw = Number(raw);
  if (type.invalid !== null && raw === type.invalid) return null;
  return raw;
}

export function parseFit(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 14) throw new Error('File is too small to be a valid FIT file.');

  const headerSize = view.getUint8(0);
  if (headerSize !== 12 && headerSize !== 14) {
    throw new Error('Unrecognized file header — this does not look like a .fit file.');
  }
  const magic = String.fromCharCode(
    view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11),
  );
  if (magic !== '.FIT') {
    throw new Error('Missing ".FIT" signature — this file is not a FIT activity file.');
  }

  const dataSize = view.getUint32(4, true);
  let offset = headerSize;
  const dataEnd = Math.min(headerSize + dataSize, buffer.byteLength);

  const localDefs = {};
  const session = {};
  const records = [];
  let fileType = null;
  let lastTimestamp = null;

  while (offset < dataEnd) {
    const headerByte = view.getUint8(offset);
    offset += 1;
    const isCompressedTimestamp = (headerByte & 0x80) !== 0;

    let localType;
    let isDefinition;
    let hasDevFields;
    let timeOffset = null;

    if (isCompressedTimestamp) {
      localType = (headerByte >> 5) & 0x03;
      timeOffset = headerByte & 0x1f;
      isDefinition = false;
      hasDevFields = false;
    } else {
      isDefinition = (headerByte & 0x40) !== 0;
      hasDevFields = (headerByte & 0x20) !== 0;
      localType = headerByte & 0x0f;
    }

    if (isDefinition) {
      offset += 1; // reserved
      const arch = view.getUint8(offset); offset += 1;
      const littleEndian = arch === 0;
      const globalNum = view.getUint16(offset, littleEndian); offset += 2;
      const numFields = view.getUint8(offset); offset += 1;
      const fields = [];
      for (let i = 0; i < numFields; i++) {
        fields.push({
          defNum: view.getUint8(offset),
          size: view.getUint8(offset + 1),
          baseType: view.getUint8(offset + 2),
        });
        offset += 3;
      }
      let devFields = [];
      if (hasDevFields) {
        const numDev = view.getUint8(offset); offset += 1;
        for (let i = 0; i < numDev; i++) {
          devFields.push({ size: view.getUint8(offset + 1) });
          offset += 3;
        }
      }
      localDefs[localType] = { globalNum, littleEndian, fields, devFields };
    } else {
      const def = localDefs[localType];
      if (!def) break;

      const wanted =
        def.globalNum === GLOBAL_MSG.FILE_ID ? FILE_ID_FIELDS :
        def.globalNum === GLOBAL_MSG.SESSION ? SESSION_FIELDS :
        def.globalNum === GLOBAL_MSG.RECORD ? RECORD_FIELDS : null;

      const decoded = {};
      for (const f of def.fields) {
        const value = readField(view, offset, f, def.littleEndian);
        offset += f.size;
        if (wanted && wanted[f.defNum] !== undefined && value !== null) {
          decoded[wanted[f.defNum]] = value;
        }
      }
      for (const df of def.devFields) offset += df.size;

      if (def.globalNum === GLOBAL_MSG.FILE_ID) {
        if (decoded.type !== undefined) fileType = decoded.type;
      } else if (def.globalNum === GLOBAL_MSG.SESSION) {
        Object.assign(session, decoded);
      } else if (def.globalNum === GLOBAL_MSG.RECORD) {
        if (isCompressedTimestamp && lastTimestamp !== null) {
          let ts = (lastTimestamp & 0xffffffe0) | timeOffset;
          if (timeOffset < (lastTimestamp & 0x1f)) ts += 0x20;
          decoded.timestamp = ts;
        } else if (decoded.timestamp === undefined && lastTimestamp !== null) {
          // Fix: don't drop samples that lack their own timestamp field —
          // fall back to the last known one instead of discarding the point.
          decoded.timestamp = lastTimestamp;
        }
        if (decoded.timestamp !== undefined) lastTimestamp = decoded.timestamp;
        if (decoded.timestamp !== undefined) records.push(decoded);
      }
    }
  }

  if (Object.keys(session).length === 0 && records.length === 0) {
    throw new Error('No recognizable activity data was found inside this file.');
  }

  return { isActivity: fileType === 4 || fileType === null, session, records };
}

export function buildActivityModel(decoded) {
  const { session, records } = decoded;
  const startTimestamp = records.length ? records[0].timestamp : session.start_time;
  const startDate = startTimestamp !== undefined
    ? new Date((startTimestamp + FIT_EPOCH_OFFSET) * 1000)
    : null;

  const t0 = records.length ? records[0].timestamp : null;
  const series = records.map((r) => {
    const altitudeRaw = r.enhanced_altitude !== undefined ? r.enhanced_altitude : r.altitude;
    const speedRaw = r.enhanced_speed !== undefined ? r.enhanced_speed : r.speed;
    return {
      t: t0 !== null ? r.timestamp - t0 : 0,
      speedKmh: speedRaw !== undefined ? (speedRaw / 1000) * 3.6 : null,
      hr: r.heart_rate !== undefined ? r.heart_rate : null,
      ele: altitudeRaw !== undefined ? altitudeRaw / 5 - 500 : null,
      lat: r.position_lat !== undefined ? r.position_lat * (180 / 2147483648) : null,
      lon: r.position_long !== undefined ? r.position_long * (180 / 2147483648) : null,
      distanceKm: r.distance !== undefined ? r.distance / 100000 : null,
    };
  });

  let elevationGain = session.total_ascent;
  if (elevationGain === undefined) {
    let gain = 0;
    let prev = null;
    for (const p of series) {
      if (p.ele === null) continue;
      if (prev !== null && p.ele > prev) gain += p.ele - prev;
      prev = p.ele;
    }
    elevationGain = series.some((p) => p.ele !== null) ? Math.round(gain) : null;
  }

  const durationSec = session.total_elapsed_time !== undefined
    ? session.total_elapsed_time
    : (series.length ? series[series.length - 1].t : null);

  const distanceKm = session.total_distance !== undefined
    ? session.total_distance / 100000
    : (series.length ? series[series.length - 1].distanceKm : null);

  const avgSpeedKmh = session.avg_speed !== undefined
    ? (session.avg_speed / 1000) * 3.6
    : (distanceKm && durationSec ? distanceKm / (durationSec / 3600) : null);

  const hrValues = series.map((p) => p.hr).filter((v) => v !== null);
  const avgHr = session.avg_heart_rate !== undefined
    ? session.avg_heart_rate
    : (hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null);
  const maxHr = session.max_heart_rate !== undefined
    ? session.max_heart_rate
    : (hrValues.length ? Math.max(...hrValues) : null);

  const gpsPoints = series.filter((p) => p.lat !== null && p.lon !== null);

  return {
    sport: SPORT_NAMES[session.sport] || (session.sport !== undefined ? `Activity (type ${session.sport})` : 'Activity'),
    startDate,
    durationSec,
    distanceKm,
    avgSpeedKmh,
    maxSpeedKmh: session.max_speed !== undefined ? (session.max_speed / 1000) * 3.6 : null,
    avgHr,
    maxHr,
    elevationGain,
    calories: session.total_calories !== undefined ? session.total_calories : null,
    series,
    gpsPoints,
  };
}

export function formatDuration(sec) {
  if (sec === null || sec === undefined || Number.isNaN(sec)) return '—';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPace(speedKmh) {
  if (!speedKmh || speedKmh <= 0) return '—';
  const secPerKm = 3600 / speedKmh;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

export function formatDateTime(date) {
  if (!date) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function num(v, digits = 0) {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(digits);
}
