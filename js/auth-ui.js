import { isAuthenticated } from './auth.js';
import { fetchProfileFromSupabase, loadProfileData, getProfile, isProfileComplete } from './profile.js';
import { switchTab } from './navigation.js';
import { t } from './i18n.js';
import { PROFIL_KEY, SETTINGS_KEY, CACHE_KEY } from './config.js';

var _demoBannerDismissed = false;

// Removes stale profile/settings caches on fresh login.
// Do NOT replace with auth.js:clearSession() — that would also remove the session token just created.
function _clearCaches() {
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(CACHE_KEY);
}

export function openAuthOverlay(view) {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  showAuthView(view || 'login');
}

function closeAuthOverlay() {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showAuthView(view) {
  var loginView  = document.getElementById('auth-login-view');
  var signupView = document.getElementById('auth-signup-view');
  if (!loginView || !signupView) return;
  if (view === 'signup') {
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
  } else {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

export function toggleAuthView() {
  var loginView = document.getElementById('auth-login-view');
  var isLoginVisible = loginView && !loginView.classList.contains('hidden');
  showAuthView(isLoginVisible ? 'signup' : 'login');
}

function showAuthError(viewId, msg) {
  var el = document.getElementById(viewId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthErrors() {
  ['auth-login-error', 'auth-signup-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

// Exported so main.js ACTIONS map can call them directly.
// These are implementation details — only main.js should call them.
export async function handleAuthLogin() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-login-email')    || {}).value || '';
  var password = (document.getElementById('auth-login-password') || {}).value || '';
  var { login: authLogin } = await import('./auth.js');
  var result = await authLogin(email, password);
  if (result.error) { showAuthError('auth-login-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  var p = await fetchProfileFromSupabase();
  loadProfileData(p);
  switchTab(isProfileComplete() ? 'log' : 'profile');
  updateDemoBanner();
}

export async function handleAuthSignup() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-signup-email')    || {}).value || '';
  var password = (document.getElementById('auth-signup-password') || {}).value || '';
  var confirm  = (document.getElementById('auth-signup-confirm')  || {}).value || '';
  if (password !== confirm) {
    showAuthError('auth-signup-error', t('auth_error_pw_mismatch'));
    return;
  }
  var { signup: authSignup } = await import('./auth.js');
  var result = await authSignup(email, password);
  if (result.error) { showAuthError('auth-signup-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  loadProfileData(getProfile());
  switchTab('profile');
  updateDemoBanner();
}

export function updateDemoBanner() {
  var banner = document.getElementById('demo-banner');
  if (!banner) return;
  if (isAuthenticated() || _demoBannerDismissed) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

export function dismissDemoBanner() {
  _demoBannerDismissed = true;
  updateDemoBanner();
}
