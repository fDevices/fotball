import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

function headers(extra) {
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  }, extra);
}

// ── Kamper ──────────────────────────────────────────────────────────────────

export async function fetchKamper() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/kamper?select=*&order=dato.desc', {
    headers: headers()
  });
  return res.json();
}

export async function insertKamp(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/kamper', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function updateKamp(id, body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/kamper?id=eq.' + id, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteKamp(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/kamper?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}

// ── Profil ──────────────────────────────────────────────────────────────────

export async function fetchProfil() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiler?id=eq.default&select=*', {
    headers: headers()
  });
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertProfil(body) {
  await fetch(SUPABASE_URL + '/rest/v1/profiler', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiler?id=eq.default&select=sport,season_format,active_season,lang', {
    headers: headers()
  });
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertSettings(body) {
  await fetch(SUPABASE_URL + '/rest/v1/profiler', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
}
