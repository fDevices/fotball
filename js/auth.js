import { SUPABASE_URL, SUPABASE_KEY, DEMO_USER_ID, SESSION_KEY, PROFIL_KEY, SETTINGS_KEY, CACHE_KEY } from './config.js';

var _refreshTimer = null;

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch(e) { return null; }
}

export function isAuthenticated() {
  var s = getSession();
  return !!(s && s.accessToken);
}

export function getUserId() {
  var s = getSession();
  return (s && s.userId) ? s.userId : DEMO_USER_ID;
}

function _storeSession(data) {
  var session = {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    userId:       data.user.id,
    email:        data.user.email,
    expiresAt:    Date.now() + (data.expires_in * 1000)
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  _cancelRefresh();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(CACHE_KEY);
}

function _cancelRefresh() {
  if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
}

function _scheduleRefresh() {
  _cancelRefresh();
  var s = getSession();
  if (!s || !s.expiresAt) return;
  var delay = Math.max(s.expiresAt - Date.now() - 5 * 60 * 1000, 30 * 1000);
  _refreshTimer = setTimeout(async function() {
    await _refreshSession();
    _scheduleRefresh(); // reschedule after each refresh
  }, delay);
}

async function _refreshSession() {
  var s = getSession();
  if (!s || !s.refreshToken) return;
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refreshToken })
    });
    if (res.status === 401 || res.status === 400) { clearSession(); return; }
    if (!res.ok) { console.warn('Token refresh failed with status:', res.status); return; }
    _storeSession(await res.json());
  } catch(e) { console.warn('Token refresh failed:', e); }
}

export async function restoreSession() {
  var s = getSession();
  if (!s) return;
  if (s.expiresAt - Date.now() < 10 * 60 * 1000) {
    await _refreshSession();
  }
  if (getSession()) _scheduleRefresh();
}

export async function signup(email, password) {
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) return { user: null, error: data.error_description || data.msg || data.message || 'Signup failed' };
    if (!data.access_token || !data.user) return { user: null, error: 'Check your email to confirm your account' };
    _storeSession(data);
    _scheduleRefresh();
    return { user: data.user, error: null };
  } catch(e) { return { user: null, error: e.message }; }
}

export async function login(email, password) {
  try {
    var res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) return { user: null, error: data.error_description || data.msg || data.message || 'Login failed' };
    _storeSession(data);
    _scheduleRefresh();
    return { user: data.user, error: null };
  } catch(e) { return { user: null, error: e.message }; }
}

export async function logout() {
  var s = getSession();
  if (s) {
    try {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + s.accessToken }
      });
    } catch(e) { /* ignore network errors on logout */ }
  }
  clearSession();
  window.location.reload();
}
