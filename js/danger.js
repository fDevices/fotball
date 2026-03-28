import { deleteAllMatches, deleteAllShareTokens, deleteProfile } from './supabase.js';
import { getSession, clearSession, isAuthenticated, getUserId } from './auth.js';
import { invalidateMatchCache } from './state.js';
import { t } from './i18n.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// ── Text refresh ──────────────────────────────────────────────────────────────

function _refreshText() {
  var title = document.getElementById('st-danger-title');
  if (title) title.textContent = t('danger_section_title');

  var warnMatches = document.getElementById('danger-warn-matches');
  if (warnMatches) warnMatches.textContent = t('danger_delete_matches_warn');

  var btnMatches = document.getElementById('danger-btn-matches');
  if (btnMatches) btnMatches.textContent = t('danger_delete_matches_btn');

  var inputMatches = document.getElementById('danger-input-matches');
  if (inputMatches) inputMatches.placeholder = t('danger_phrase_matches_placeholder');

  var cancelMatches = document.getElementById('danger-cancel-matches');
  if (cancelMatches) cancelMatches.textContent = t('danger_cancel');

  var confirmMatches = document.getElementById('danger-confirm-matches');
  if (confirmMatches) confirmMatches.textContent = t('danger_confirm');

  var warnAccount = document.getElementById('danger-warn-account');
  if (warnAccount) warnAccount.textContent = t('danger_delete_account_warn');

  var btnAccount = document.getElementById('danger-btn-account');
  if (btnAccount) btnAccount.textContent = t('danger_delete_account_btn');

  var inputAccount = document.getElementById('danger-input-account');
  if (inputAccount) inputAccount.placeholder = t('danger_phrase_account_placeholder');

  var cancelAccount = document.getElementById('danger-cancel-account');
  if (cancelAccount) cancelAccount.textContent = t('danger_cancel');

  var confirmAccount = document.getElementById('danger-confirm-account');
  if (confirmAccount) confirmAccount.textContent = t('danger_confirm');
}

// ── State reset ───────────────────────────────────────────────────────────────

function _resetPanel(type) {
  var panel = document.getElementById('danger-panel-' + type);
  var input = document.getElementById('danger-input-' + type);
  var confirm = document.getElementById('danger-confirm-' + type);
  if (panel) panel.hidden = true;
  if (input) input.value = '';
  if (confirm) confirm.disabled = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initDangerZone() {
  var section = document.getElementById('st-danger-zone');
  if (!section) return;
  section.hidden = !isAuthenticated();
  _refreshText();
  _resetPanel('matches');
  _resetPanel('account');
}

export function toggleDangerPanel(type) {
  var panel = document.getElementById('danger-panel-' + type);
  if (!panel) return;
  var isOpen = !panel.hidden;
  // Close both panels
  _resetPanel('matches');
  _resetPanel('account');
  // If it was closed, open it
  if (!isOpen) {
    panel.hidden = false;
    var input = document.getElementById('danger-input-' + type);
    if (input) input.focus();
  }
}

export function onDangerInput(type) {
  var input = document.getElementById('danger-input-' + type);
  var confirm = document.getElementById('danger-confirm-' + type);
  if (!input || !confirm) return;
  var phrase = t('danger_phrase_' + type);
  confirm.disabled = input.value.trim().toLowerCase() !== phrase.toLowerCase();
}

export async function confirmDeleteMatches() {
  var btn = document.getElementById('danger-confirm-matches');
  if (btn) btn.disabled = true;
  try {
    await deleteAllMatches();
    invalidateMatchCache();
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('danger_toast_matches_deleted'), type: 'success' }
    }));
    _resetPanel('matches');
    document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'));
  } catch(err) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('toast_share_error'), type: 'error' }
    }));
    if (btn) btn.disabled = false;
  }
}

export async function confirmDeleteAccount() {
  var btn = document.getElementById('danger-confirm-account');
  if (btn) btn.disabled = true;
  try {
    await deleteAllMatches();
    await deleteAllShareTokens();
    await deleteProfile(getUserId());
    var session = getSession();
    var res = await fetch(SUPABASE_URL + '/functions/v1/delete-account', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + session.accessToken,
        'apikey': SUPABASE_KEY
      }
    });
    if (!res.ok) throw new Error('delete-account edge function failed: ' + res.status);
    clearSession();
    window.location.reload();
  } catch(err) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('toast_share_error'), type: 'error' }
    }));
    if (btn) btn.disabled = false;
  }
}
