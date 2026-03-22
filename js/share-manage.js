import { fetchShareTokens, insertShareToken, deleteShareToken as deleteShareTokenApi } from './supabase.js';
import { getSettings } from './settings.js';
import { getUserId } from './auth.js';
import { t } from './i18n.js';
import { esc, getFocusableElements, trapFocus } from './utils.js';

var _tokens = [];
var _focusSrc = null;
var _trapHandler = null;

// ── Code generation ──────────────────────────────────────────────────────────

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(function(b) { return chars[b % chars.length]; })
    .join('');
}

// ── Expiry calculation ───────────────────────────────────────────────────────

export function calcExpiresAt(option) {
  var now = Date.now();
  if (option === '30')       return new Date(now + 30 * 864e5).toISOString();
  if (option === '90')       return new Date(now + 90 * 864e5).toISOString();
  if (option === 'permanent') return null;
  if (option === 'season') {
    var activeSeason = getSettings().activeSeason || '';
    if (/^\d{4}$/.test(activeSeason.trim())) {
      // Year format e.g. "2025"
      return new Date(activeSeason.trim() + '-12-31T23:59:59+01:00').toISOString();
    }
    // Sesong format e.g. "2024–2025" or "2024/25"
    var parts = activeSeason.split(/[–\-\/]/);
    var lastPart = parts[parts.length - 1].trim();
    var endYear = parseInt(lastPart.slice(-4), 10);
    if (!isNaN(endYear) && endYear > 2000) {
      return new Date(endYear + '-06-30T23:59:59+02:00').toISOString();
    }
    // Fallback: 90 days, fire toast from caller
    return null; // signal to caller: use fallback
  }
  return new Date(now + 90 * 864e5).toISOString();
}

// ── Panel open/close ─────────────────────────────────────────────────────────

export function openSharePanel() {
  var panel = document.getElementById('share-panel');
  var backdrop = document.getElementById('share-panel-backdrop');
  if (!panel || !backdrop) return;
  _focusSrc = document.activeElement;
  _loadAndRender();
  panel.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  _trapHandler = function(e) { trapFocus(panel, e); };
  panel.addEventListener('keydown', _trapHandler);
  setTimeout(function() {
    var first = getFocusableElements(panel)[0];
    if (first) first.focus();
  }, 50);
}

export function closeSharePanel() {
  var panel = document.getElementById('share-panel');
  var backdrop = document.getElementById('share-panel-backdrop');
  if (panel) {
    panel.classList.remove('open');
    if (_trapHandler) panel.removeEventListener('keydown', _trapHandler);
    _trapHandler = null;
  }
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (_focusSrc) { _focusSrc.focus(); _focusSrc = null; }
}

// ── Render ───────────────────────────────────────────────────────────────────

function _daysLeft(expiresAt) {
  if (!expiresAt) return null;
  var ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / 864e5);
}

function _isExpired(token) {
  if (!token.expires_at) return false;
  return new Date(token.expires_at).getTime() <= Date.now();
}

function _tokenHTML(token) {
  var expired = _isExpired(token);
  var url = 'https://athlyticsport.app/share?code=' + esc(token.code);
  var expiryText = !token.expires_at
    ? t('share_badge_permanent')
    : expired
      ? '<span class="share-badge-expired">' + t('share_badge_expired') + '</span>'
      : _daysLeft(token.expires_at) + ' ' + t('share_days_left');

  return '<div class="share-token-row' + (expired ? ' share-token-expired' : '') + '">' +
    '<div class="share-token-info">' +
      '<span class="share-token-label">' + esc(token.label) + '</span>' +
      '<span class="share-token-expiry">' + expiryText + '</span>' +
    '</div>' +
    (!expired
      ? '<div class="share-token-url">' + esc(url) + '</div>' +
        '<div class="share-token-actions">' +
          '<button class="share-btn-copy" data-action="copyShareLink" data-url="' + esc(url) + '">' + t('share_copy_btn') + '</button>' +
          '<button class="share-btn-delete" data-action="deleteShareToken" data-id="' + esc(token.id) + '">' + t('share_revoke_btn') + '</button>' +
        '</div>'
      : '<div class="share-token-actions">' +
          '<button class="share-btn-delete" data-action="deleteShareToken" data-id="' + esc(token.id) + '">' + t('share_revoke_btn') + '</button>' +
        '</div>') +
  '</div>';
}

function _renderPanel() {
  var container = document.getElementById('share-panel-list');
  if (!container) return;

  var active  = _tokens.filter(function(t) { return !_isExpired(t); });
  var expired = _tokens.filter(function(t) { return  _isExpired(t); });

  var html = '';

  if (_tokens.length === 0) {
    html = '<p class="share-no-links">' + t('share_no_links') + '</p>';
  } else {
    if (active.length > 0) {
      html += '<div class="share-section-label">' + t('share_active_links') + '</div>';
      html += active.map(_tokenHTML).join('');
    }
    if (expired.length > 0) {
      html += '<div class="share-section-label share-section-expired">' + t('share_expired_links') + '</div>';
      html += expired.map(_tokenHTML).join('');
    }
  }

  container.innerHTML = html;
}

async function _loadAndRender() {
  var container = document.getElementById('share-panel-list');
  if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    _tokens = await fetchShareTokens();
    _renderPanel();
  } catch(e) {
    if (container) container.innerHTML = '<p class="share-no-links">' + t('load_error') + '</p>';
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

export async function createShareToken() {
  var labelEl  = document.getElementById('share-new-label');
  var expiryEl = document.getElementById('share-new-expiry');
  if (!labelEl || !expiryEl) return;

  var label  = labelEl.value.trim();
  var option = expiryEl.value;
  if (!label) { labelEl.focus(); return; }

  var expiresAt = calcExpiresAt(option);
  var usedFallback = (option === 'season' && expiresAt === null);
  if (usedFallback) {
    expiresAt = new Date(Date.now() + 90 * 864e5).toISOString();
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_expiry_fallback'), type: 'warn' } }));
  }

  var code = generateCode();
  var userId = getUserId(); // from auth.js — returns DEMO_USER_ID if not authenticated
  if (!userId) return;

  var body = { user_id: userId, code: code, label: label, expires_at: expiresAt };

  async function tryInsert(attempt) {
    var res = await insertShareToken(body);
    if (res.status === 409 || res.status === 422) {
      var data = await res.json().catch(function() { return {}; });
      var isCollision = (data.code === '23505') || res.status === 409;
      if (isCollision && attempt < 2) {
        body.code = generateCode();
        return tryInsert(attempt + 1);
      }
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
      return;
    }
    if (!res.ok) {
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
      return;
    }
    labelEl.value = '';
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_created'), type: 'success' } }));
    _loadAndRender();
  }

  await tryInsert(1);
}

export async function removeShareToken(id) {
  try {
    var res = await deleteShareTokenApi(id);
    if (!res.ok) throw new Error('delete failed');
    _tokens = _tokens.filter(function(t) { return t.id !== id; });
    _renderPanel();
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_deleted'), type: 'success' } }));
  } catch(e) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
  }
}

export function copyShareLink(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() {
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_copied'), type: 'success' } }));
    });
  } else {
    // Fallback for older browsers
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_copied'), type: 'success' } }));
  }
}
