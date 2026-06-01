#!/usr/bin/env node
'use strict';

/**
 * Verifies and updates all drive segment distances/durations in itinerary.json.
 * Pipeline: mapsDir URL → Nominatim geocode → OSRM route → update JSON.
 * Run: node verify-distances.js
 * Takes ~2-3 min due to Nominatim rate limit (1 req/sec).
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const ITINERARY_PATH = path.join(__dirname, 'itinerary.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'IcelandItineraryVerifier/1.0 (leonardogivoli@gmail.com)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}`)); }
      });
    }).on('error', reject);
  });
}

// Hardcoded coords for places Nominatim can't find or gets wrong
const COORD_OVERRIDES = {
  'Reynisfjara Black Sand Beach': { lat: 63.4052, lon: -19.0648 },
  'Vik Camping Iceland':          { lat: 63.4186, lon: -19.0047 },
  'Hverfjall Crater Iceland':     { lat: 65.5966, lon: -16.8737 },
  'Hverir Namafjall Iceland':     { lat: 65.6402, lon: -16.8191 },
  'Hverir Namafjall':             { lat: 65.6402, lon: -16.8191 },
  'Forest Lagoon Akureyri':       { lat: 65.7186, lon: -18.1132 },
  'Hamrar Campsite Akureyri':     { lat: 65.6785, lon: -18.0823 },
  'Djupalonsandur Iceland':       { lat: 64.7477, lon: -23.9047 },
  'Ytri Tunga Beach Iceland':     { lat: 64.8641, lon: -23.1181 },
  'Diamond Beach Iceland':        { lat: 64.0399, lon: -16.1784 },
  'Jokulsarlon Glacier Lagoon':   { lat: 64.0484, lon: -16.1810 },
  'Studlagil Canyon Iceland':     { lat: 65.0975, lon: -15.2115 },
  'Kirkjufell Iceland':           { lat: 64.9416, lon: -23.3052 },
  'Hellissandur Iceland':         { lat: 64.9126, lon: -23.9049 },
};

const geocodeCache = {};

async function geocode(raw) {
  const query = raw.replace(/\+/g, ' ').trim();
  if (COORD_OVERRIDES[query]) return COORD_OVERRIDES[query];
  if (geocodeCache[query]) return geocodeCache[query];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const results = await httpGet(url);
  await sleep(1100); // Nominatim: max 1 req/sec

  if (!results || results.length === 0) throw new Error(`Geocode failed: "${query}"`);

  const coord = { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
  geocodeCache[query] = coord;
  return coord;
}

function isLatLon(s) {
  return /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(s);
}

async function resolve(token) {
  if (isLatLon(token)) {
    const [lat, lon] = token.split(',').map(Number);
    return { lat, lon };
  }
  return geocode(token);
}

function parseMapsDir(url) {
  const m = url.match(/\/maps\/dir\/(.+)/);
  if (!m) return null;
  const parts = m[1].split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return { originRaw: parts[0], destRaw: parts[parts.length - 1] };
}

async function osrmRoute(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const res = await httpGet(url);
  if (!res.routes || res.routes.length === 0) throw new Error('OSRM: no route found');
  return {
    km: Math.round(res.routes[0].distance / 1000),
    minutes: Math.round(res.routes[0].duration / 60)
  };
}

function fmtDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(ITINERARY_PATH, 'utf8'));
  let grandTotalKm = 0;

  for (const day of data.days) {
    let dayKm = 0;
    let dayMin = 0;

    for (const stop of day.stops) {
      if (stop.type !== 'drive') continue;
      if (!stop.mapsDir || !stop.mapsDir.includes('/maps/dir/')) continue;

      const parsed = parseMapsDir(stop.mapsDir);
      if (!parsed) {
        console.warn(`  ⚠ skip (bad URL): ${stop.title}`);
        continue;
      }

      process.stdout.write(`Day ${day.id}: ${stop.title.substring(0, 50).padEnd(50)} `);

      try {
        const origin = await resolve(parsed.originRaw);
        const dest = await resolve(parsed.destRaw);
        const route = await osrmRoute(origin, dest);

        const oldKm = (stop.distance || '?').padStart(7);
        const oldDur = (stop.duration || '?').padStart(10);
        const newKm = `${route.km} km`;
        const newDur = fmtDuration(route.minutes);

        process.stdout.write(`${oldKm} → ${newKm.padEnd(7)}  ${oldDur} → ${newDur}\n`);

        stop.distance = newKm;
        stop.duration = newDur;
        dayKm += route.km;
        dayMin += route.minutes;
      } catch (err) {
        process.stdout.write(`✗ ${err.message}\n`);
      }
    }

    if (dayKm > 0 && day.summary) {
      const oldSummary = day.summary.drive;
      day.summary.drive = `~${dayKm} km · ${fmtDuration(dayMin)}`;
      console.log(`  → Day ${day.id} summary: "${oldSummary}" → "${day.summary.drive}"`);
    }
    grandTotalKm += dayKm;
  }

  data.meta.totalKmDrive = grandTotalKm;
  console.log(`\nTotal drive km: ${grandTotalKm}`);
  fs.writeFileSync(ITINERARY_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log('itinerary.json written.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
