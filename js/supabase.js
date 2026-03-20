import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { getSession } from './auth.js';

function headers(extra) {
  var session = getSession();
  var bearer = session ? session.accessToken : SUPABASE_KEY;
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + bearer
  }, extra);
}

// ── Matches ──────────────────────────────────────────────────────────────────

export async function fetchKamper() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?select=*&order=date.desc', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchKamper failed: ' + res.status);
  return res.json();
}

export async function insertKamp(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function updateKamp(id, body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteKamp(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfil(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=*', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchProfil failed: ' + res.status);
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertProfil(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('upsertProfil failed: ' + res.status);
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=sport,season_format,active_season,lang', {
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
  if (!res.ok) throw new Error('upsertSettings failed: ' + res.status);
}
