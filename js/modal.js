import { allMatches, setAllMatches } from './state.js';
import { updateKamp, deleteKamp } from './supabase.js';
import { selectModalTeam, selectModalTournament, renderModalTeamDropdown, renderModalTournamentDropdown } from './teams.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { renderStats } from './stats.js';

var modalMatchId = null;
var mHome = 0, mAway = 0, mGoals = 0, mAssists = 0, mMatchType = 'hjemme';

export function openEditModal(id) {
  var k = allMatches.find(function(m) { return String(m.id) === String(id); });
  if (!k) return;
  modalMatchId = id;
  mHome = k.hjemme || 0;
  mAway = k.borte || 0;
  mGoals = k.mal || 0;
  mAssists = k.assist || 0;
  mMatchType = k.kamptype || 'hjemme';

  document.getElementById('modal-dato').value = k.dato;
  document.getElementById('modal-motstander').value = k.motstanderlag || '';
  selectModalTeam(k.eget_lag || '');
  selectModalTournament(k.turnering || '');
  renderModalTeamDropdown();
  renderModalTournamentDropdown();
  document.getElementById('modal-home').textContent = mHome;
  document.getElementById('modal-away').textContent = mAway;
  document.getElementById('modal-goals').textContent = mGoals;
  document.getElementById('modal-assist').textContent = mAssists;
  document.getElementById('modal-title').textContent = k.motstanderlag || 'Rediger kamp';
  setModalMatchType(mMatchType);

  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('modal-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('modal-sheet').classList.remove('open');
  document.body.style.overflow = '';
  modalMatchId = null;
  ['modal-team-dropdown', 'modal-tournament-dropdown'].forEach(function(id) {
    var dd = document.getElementById(id);
    if (dd) dd.classList.remove('open');
  });
}

export function setModalMatchType(type) {
  mMatchType = type;
  document.getElementById('modal-btn-home').classList.toggle('active', type === 'hjemme');
  document.getElementById('modal-btn-away').classList.toggle('active', type === 'away');
}

export function modalAdjust(type, delta) {
  var ownScore = mMatchType === 'hjemme' ? mHome : mAway;
  if (type === 'goals') {
    mGoals = Math.min(ownScore, Math.max(0, mGoals + delta));
    mAssists = Math.min(mAssists, ownScore - mGoals);
    document.getElementById('modal-goals').textContent = mGoals;
    document.getElementById('modal-assist').textContent = mAssists;
  } else if (type === 'assist') {
    mAssists = Math.min(ownScore - mGoals, Math.max(0, mAssists + delta));
    document.getElementById('modal-assist').textContent = mAssists;
  } else if (type === 'home') {
    mHome = Math.max(0, mHome + delta);
    if (mMatchType === 'hjemme') {
      mGoals = Math.min(mGoals, mHome);
      mAssists = Math.min(mAssists, mHome - mGoals);
      document.getElementById('modal-goals').textContent = mGoals;
      document.getElementById('modal-assist').textContent = mAssists;
    }
    document.getElementById('modal-home').textContent = mHome;
  } else if (type === 'away') {
    mAway = Math.max(0, mAway + delta);
    if (mMatchType === 'away') {
      mGoals = Math.min(mGoals, mAway);
      mAssists = Math.min(mAssists, mAway - mGoals);
      document.getElementById('modal-goals').textContent = mGoals;
      document.getElementById('modal-assist').textContent = mAssists;
    }
    document.getElementById('modal-away').textContent = mAway;
  }
}

export async function saveEditedMatch() {
  if (!modalMatchId) return;
  var body = {
    dato: document.getElementById('modal-dato').value,
    motstanderlag: document.getElementById('modal-motstander').value.trim(),
    eget_lag: document.getElementById('modal-own-team').value.trim(),
    turnering: document.getElementById('modal-tournament').value.trim(),
    hjemme: mHome, borte: mAway, mal: mGoals, assist: mAssists, kamptype: mMatchType
  };
  var btn = document.querySelector('.modal-save-btn');
  btn.textContent = 'Lagrer...'; btn.disabled = true;
  try {
    var res = await updateKamp(modalMatchId, body);
    if (res.ok) {
      var idx = allMatches.findIndex(function(k) { return k.id === modalMatchId; });
      if (idx !== -1) allMatches[idx] = Object.assign({}, allMatches[idx], body);
      setAllMatches(allMatches);
      closeModal();
      renderStats();
      showToast(t('toast_match_updated'), 'success');
    } else {
      showToast(t('toast_feil_lagring'), 'error');
    }
  } catch(e) { showToast(t('toast_nettverksfeil_kort'), 'error'); }
  btn.textContent = t('save_changes'); btn.disabled = false;
}

export function deleteMatch() {
  if (!modalMatchId) return;
  var k = allMatches.find(function(m) { return String(m.id) === String(modalMatchId); });
  var oppName = k ? (k.motstanderlag || 'denne kampen') : 'denne kampen';
  document.getElementById('delete-confirm-name').textContent = oppName;
  document.getElementById('delete-confirm-backdrop').classList.add('open');
  document.getElementById('delete-confirm-dialog').classList.add('open');
}

export async function confirmDeleteMatch() {
  document.getElementById('delete-confirm-backdrop').classList.remove('open');
  document.getElementById('delete-confirm-dialog').classList.remove('open');
  if (!modalMatchId) return;
  try {
    var res = await deleteKamp(modalMatchId);
    if (res.ok) {
      var updated = allMatches.filter(function(k) { return k.id !== modalMatchId; });
      setAllMatches(updated);
      closeModal();
      renderStats();
      showToast(t('toast_match_deleted'), 'success');
    } else {
      showToast(t('toast_delete_error'), 'error');
    }
  } catch(e) { showToast(t('toast_nettverksfeil_kort'), 'error'); }
}

export function cancelDeleteMatch() {
  document.getElementById('delete-confirm-backdrop').classList.remove('open');
  document.getElementById('delete-confirm-dialog').classList.remove('open');
}
