import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

function headers(extra) {
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  }, extra);
}

// ── Matches ──────────────────────────────────────────────────────────────────

export async function fetchMatches() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?select=*&order=date.desc', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchMatches failed: ' + res.status);
  return res.json();
}

export async function insertMatch(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function updateMatch(id, body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteMatch(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.default&select=*', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchProfile failed: ' + res.status);
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertProfile(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) console.warn('upsertProfile failed: ' + res.status);
  return res;
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.default&select=sport,season_format,active_season,lang', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchSettings failed: ' + res.status);
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertSettings(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) console.warn('upsertSettings failed: ' + res.status);
  return res;
}
