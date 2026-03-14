import { allMatches, setAllMatches } from './state.js';
import { updateKamp, deleteKamp } from './supabase.js';
import { selectModalTeam, selectModalTournament, renderModalTeamDropdown, renderModalTournamentDropdown } from './teams.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { renderStats } from './stats.js';

var modalMatchId = null;
var mHome = 0, mAway = 0, mGoals = 0, mAssists = 0, mMatchType = 'home';

export function openEditModal(id) {
  var k = allMatches.find(function(m) { return String(m.id) === String(id); });
  if (!k) return;
  modalMatchId = id;
  mHome     = k.home_score || 0;
  mAway     = k.away_score || 0;
  mGoals    = k.goals      || 0;
  mAssists  = k.assists    || 0;
  mMatchType = k.match_type || 'home';

  document.getElementById('modal-dato').value = k.date;
  document.getElementById('modal-motstander').value = k.opponent || '';
  selectModalTeam(k.own_team || '');
  selectModalTournament(k.tournament || '');
  renderModalTeamDropdown();
  renderModalTournamentDropdown();
  document.getElementById('modal-home').textContent   = mHome;
  document.getElementById('modal-away').textContent   = mAway;
  document.getElementById('modal-goals').textContent  = mGoals;
  document.getElementById('modal-assist').textContent = mAssists;
  document.getElementById('modal-title').textContent  = k.opponent || 'Rediger kamp';
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
  document.getElementById('modal-btn-home').classList.toggle('active', type === 'home');
  document.getElementById('modal-btn-away').classList.toggle('active', type === 'away');
}

export function modalAdjust(type, delta) {
  var ownScore = mMatchType === 'home' ? mHome : mAway;
  if (type === 'goals') {
    mGoals   = Math.min(ownScore, Math.max(0, mGoals + delta));
    mAssists = Math.min(mAssists, ownScore - mGoals);
    document.getElementById('modal-goals').textContent  = mGoals;
    document.getElementById('modal-assist').textContent = mAssists;
  } else if (type === 'assist') {
    mAssists = Math.min(ownScore - mGoals, Math.max(0, mAssists + delta));
    document.getElementById('modal-assist').textContent = mAssists;
  } else if (type === 'home') {
    mHome = Math.max(0, mHome + delta);
    if (mMatchType === 'home') {
      mGoals   = Math.min(mGoals, mHome);
      mAssists = Math.min(mAssists, mHome - mGoals);
      document.getElementById('modal-goals').textContent  = mGoals;
      document.getElementById('modal-assist').textContent = mAssists;
    }
    document.getElementById('modal-home').textContent = mHome;
  } else if (type === 'away') {
    mAway = Math.max(0, mAway + delta);
    if (mMatchType === 'away') {
      mGoals   = Math.min(mGoals, mAway);
      mAssists = Math.min(mAssists, mAway - mGoals);
      document.getElementById('modal-goals').textContent  = mGoals;
      document.getElementById('modal-assist').textContent = mAssists;
    }
    document.getElementById('modal-away').textContent = mAway;
  }
}

export async function saveEditedMatch() {
  if (!modalMatchId) return;
  var body = {
    date:       document.getElementById('modal-dato').value,
    opponent:   document.getElementById('modal-motstander').value.trim(),
    own_team:   document.getElementById('modal-own-team').value.trim(),
    tournament: document.getElementById('modal-tournament').value.trim(),
    home_score: mHome,
    away_score: mAway,
    goals:      mGoals,
    assists:    mAssists,
    match_type: mMatchType
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

export function deleteMatch_action() {
  if (!modalMatchId) return;
  var k = allMatches.find(function(m) { return String(m.id) === String(modalMatchId); });
  var oppName = k ? (k.opponent || 'denne kampen') : 'denne kampen';
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
