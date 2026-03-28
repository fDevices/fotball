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

export async function deleteAllMatches() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches', {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteAllMatches failed: ' + res.status);
  return res;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=*', {
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
  if (!res.ok) throw new Error('upsertProfile failed: ' + res.status);
}

export async function uploadAvatar(userId, blob) {
  var path = userId + '/avatar.jpg';
  var res = await fetch(SUPABASE_URL + '/storage/v1/object/avatars/' + path, {
    method: 'PUT',
    headers: headers({ 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }),
    body: blob
  });
  if (!res.ok) throw new Error('uploadAvatar failed: ' + res.status);
  return SUPABASE_URL + '/storage/v1/object/public/avatars/' + path;
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function upsertProfileSettings(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('upsertProfileSettings failed: ' + res.status);
}

export async function deleteProfile(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId, {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteProfile failed: ' + res.status);
  return res;
}

// ── Share tokens ─────────────────────────────────────────────────────────────

export async function fetchShareTokens() {
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/share_tokens?select=id,code,label,expires_at,created_at&order=created_at.desc',
    { headers: headers() }
  );
  if (!res.ok) throw new Error('fetchShareTokens failed: ' + res.status);
  return res.json();
}

export async function insertShareToken(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteShareToken(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}

export async function deleteAllShareTokens() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens', {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteAllShareTokens failed: ' + res.status);
  return res;
}
