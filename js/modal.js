import { getAllMatches, setAllMatches } from './state.js';
import { updateMatch, deleteMatch as deleteMatchFromDB } from './supabase.js';
import { selectModalTeam, selectModalTournament, renderModalTeamDropdown, renderModalTournamentDropdown } from './teams.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { loadMatchIntoAssessment, renderModalAssessmentSection, getAssessmentPayload, resetAssessmentState } from './assessment.js';
import { clampStats, getFocusableElements, trapFocus } from './utils.js';

const MODAL_DEFAULTS = {
  mHome: 0, mAway: 0, mGoals: 0, mAssists: 0, mMatchType: 'home'
};

const MODAL_DOM_DEFAULTS = {
  'modal-dato': '', 'modal-motstander': '',
  'modal-assess-reflection-good': '', 'modal-assess-reflection-improve': ''
};

var modalMatchId = null;
var mState = Object.assign({}, MODAL_DEFAULTS);

var _modalFocusSrc = null;
var _deleteFocusSrc = null;
var _modalTrapHandler = null;
var _deleteTrapHandler = null;

export function openEditModal(id) {
  var k = getAllMatches().find(function(m) { return String(m.id) === String(id); });
  if (!k) return;
  modalMatchId = id;
  mState.mHome      = k.home_score  || 0;
  mState.mAway      = k.away_score  || 0;
  mState.mGoals     = k.goals       || 0;
  mState.mAssists   = k.assists     || 0;
  mState.mMatchType = k.match_type  || 'home';

  document.getElementById('modal-dato').value = k.date;
  document.getElementById('modal-motstander').value = k.opponent || '';
  selectModalTeam(k.own_team || '');
  selectModalTournament(k.tournament || '');
  renderModalTeamDropdown();
  renderModalTournamentDropdown();
  document.getElementById('modal-home').textContent   = mState.mHome;
  document.getElementById('modal-away').textContent   = mState.mAway;
  document.getElementById('modal-goals').textContent  = mState.mGoals;
  document.getElementById('modal-assist').textContent = mState.mAssists;
  document.getElementById('modal-title').textContent  = k.opponent || t('modal_rediger');
  setModalMatchType(mState.mMatchType);

  loadMatchIntoAssessment(k);
  renderModalAssessmentSection();
  // Pre-fill reflection textareas from saved match data
  var taGood    = document.getElementById('modal-assess-reflection-good');
  var taImprove = document.getElementById('modal-assess-reflection-improve');
  if (taGood)    taGood.value    = k.reflection_good    || '';
  if (taImprove) taImprove.value = k.reflection_improve || '';
  document.getElementById('modal-backdrop').classList.add('open');
  var mEl = document.getElementById('modal-sheet');
  mEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  _modalFocusSrc = document.activeElement;
  setTimeout(function() { getFocusableElements(mEl)[0]?.focus(); }, 50);
  _modalTrapHandler = function(e) { trapFocus(mEl, e); };
  mEl.addEventListener('keydown', _modalTrapHandler);
}

export function closeModal() {
  resetAssessmentState();
  document.getElementById('modal-backdrop').classList.remove('open');
  var mEl = document.getElementById('modal-sheet');
  mEl.classList.remove('open');
  if (_modalTrapHandler) { mEl.removeEventListener('keydown', _modalTrapHandler); _modalTrapHandler = null; }
  if (_modalFocusSrc) { _modalFocusSrc.focus(); _modalFocusSrc = null; }
  document.body.style.overflow = '';
  modalMatchId = null;
  Object.assign(mState, MODAL_DEFAULTS);
  Object.entries(MODAL_DOM_DEFAULTS).forEach(function(entry) {
    var el = document.getElementById(entry[0]); if (el) el.value = entry[1];
  });
  ['modal-team-dropdown', 'modal-tournament-dropdown'].forEach(function(id) {
    var dd = document.getElementById(id); if (dd) dd.classList.remove('open');
  });
}

export function setModalMatchType(type) {
  mState.mMatchType = type;
  var btnHome = document.getElementById('modal-btn-home');
  var btnAway = document.getElementById('modal-btn-away');
  if (btnHome) btnHome.classList.toggle('active', type === 'home');
  if (btnAway) btnAway.classList.toggle('active', type === 'away');
}

export function modalAdjust(type, delta) {
  var ownScore = mState.mMatchType === 'home' ? mState.mHome : mState.mAway;
  if (type === 'goals') {
    var cg = clampStats(mState.mGoals + delta, mState.mAssists, ownScore);
    mState.mGoals = cg.goals; mState.mAssists = cg.assists;
    document.getElementById('modal-goals').textContent  = mState.mGoals;
    document.getElementById('modal-assist').textContent = mState.mAssists;
  } else if (type === 'assist') {
    var ca = clampStats(mState.mGoals, mState.mAssists + delta, ownScore);
    mState.mAssists = ca.assists;
    document.getElementById('modal-assist').textContent = mState.mAssists;
  } else if (type === 'home') {
    mState.mHome = Math.max(0, mState.mHome + delta);
    if (mState.mMatchType === 'home') {
      var ch = clampStats(mState.mGoals, mState.mAssists, mState.mHome);
      mState.mGoals = ch.goals; mState.mAssists = ch.assists;
      document.getElementById('modal-goals').textContent  = mState.mGoals;
      document.getElementById('modal-assist').textContent = mState.mAssists;
    }
    document.getElementById('modal-home').textContent = mState.mHome;
  } else if (type === 'away') {
    mState.mAway = Math.max(0, mState.mAway + delta);
    if (mState.mMatchType === 'away') {
      var caw = clampStats(mState.mGoals, mState.mAssists, mState.mAway);
      mState.mGoals = caw.goals; mState.mAssists = caw.assists;
      document.getElementById('modal-goals').textContent  = mState.mGoals;
      document.getElementById('modal-assist').textContent = mState.mAssists;
    }
    document.getElementById('modal-away').textContent = mState.mAway;
  }
}

export async function saveEditedMatch() {
  if (!modalMatchId) return;
  var body = Object.assign({
    date:       document.getElementById('modal-dato').value,
    opponent:   document.getElementById('modal-motstander').value.trim(),
    own_team:   document.getElementById('modal-own-team').value.trim(),
    tournament: document.getElementById('modal-tournament').value.trim(),
    home_score: mState.mHome,
    away_score: mState.mAway,
    goals:      mState.mGoals,
    assists:    mState.mAssists,
    match_type: mState.mMatchType
  }, getAssessmentPayload());
  if (!body.date || !body.opponent || !body.own_team) {
    showToast(t('toast_fyll_inn'), 'error'); return;
  }
  var btn = document.querySelector('.modal-save-btn');
  btn.textContent = t('saving'); btn.disabled = true;
  try {
    var res = await updateMatch(modalMatchId, body);
    if (res.ok) {
      setAllMatches(getAllMatches().map(function(m) {
        return String(m.id) === String(modalMatchId) ? Object.assign({}, m, body) : m;
      }));
      closeModal();
      document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'));
      showToast(t('toast_match_updated'), 'success');
    } else {
      showToast(t('toast_feil_lagring'), 'error');
    }
  } catch(e) { showToast(t('toast_nettverksfeil_kort'), 'error'); }
  btn.textContent = t('save_changes'); btn.disabled = false;
}

export function deleteMatch() {
  if (!modalMatchId) return;
  var k = getAllMatches().find(function(m) { return String(m.id) === String(modalMatchId); });
  var oppName = k ? (k.opponent || t('this_match')) : t('this_match');
  document.getElementById('delete-confirm-name').textContent = oppName;
  document.getElementById('delete-confirm-backdrop').classList.add('open');
  var dialog = document.getElementById('delete-confirm-dialog');
  dialog.classList.add('open');
  _deleteFocusSrc = document.activeElement;
  setTimeout(function() {
    var cancelBtn = dialog.querySelector('[data-action="cancelDeleteMatch"]');
    if (cancelBtn) cancelBtn.focus();
  }, 50);
  _deleteTrapHandler = function(e) { trapFocus(dialog, e); };
  dialog.addEventListener('keydown', _deleteTrapHandler);
}

export async function confirmDeleteMatch() {
  var dialog = document.getElementById('delete-confirm-dialog');
  document.getElementById('delete-confirm-backdrop').classList.remove('open');
  dialog.classList.remove('open');
  if (_deleteTrapHandler) { dialog.removeEventListener('keydown', _deleteTrapHandler); _deleteTrapHandler = null; }
  var restoreTo = _deleteFocusSrc || document.querySelector('[data-action="deleteMatch"]');
  _deleteFocusSrc = null;
  if (restoreTo) restoreTo.focus();
  if (!modalMatchId) return;
  try {
    var res = await deleteMatchFromDB(modalMatchId);
    if (res.ok) {
      var updated = getAllMatches().filter(function(k) { return String(k.id) !== String(modalMatchId); });
      setAllMatches(updated);
      closeModal();
      document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'));
      showToast(t('toast_match_deleted'), 'success');
    } else {
      showToast(t('toast_delete_error'), 'error');
    }
  } catch(e) { showToast(t('toast_nettverksfeil_kort'), 'error'); }
}

export function cancelDeleteMatch() {
  var dialog = document.getElementById('delete-confirm-dialog');
  document.getElementById('delete-confirm-backdrop').classList.remove('open');
  dialog.classList.remove('open');
  if (_deleteTrapHandler) { dialog.removeEventListener('keydown', _deleteTrapHandler); _deleteTrapHandler = null; }
  var restoreTo = _deleteFocusSrc || document.querySelector('[data-action="deleteMatch"]');
  _deleteFocusSrc = null;
  if (restoreTo) restoreTo.focus();
}
