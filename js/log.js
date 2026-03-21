import { insertKamp } from './supabase.js';
import { getAllMatches, setAllMatches, invalidateMatchCache } from './state.js';
import { getSelectedTeam, getSelectedTournament, selectTournament, renderTeamDropdown } from './teams.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { clampStats } from './utils.js';
import { getDateLocale } from './settings.js';

var goals = 0, assist = 0, home = 0, away = 0, matchType = 'home';

export function getMatchType() { return matchType; }

export function setMatchType(type) {
  matchType = type;
  var btnHome = document.getElementById('btn-home-toggle');
  var btnAway = document.getElementById('btn-away-toggle');
  var lblHome = document.getElementById('label-home');
  var lblAway = document.getElementById('label-away');
  if (!btnHome || !btnAway || !lblHome || !lblAway) return;
  btnHome.classList.toggle('active', type === 'home');
  btnAway.classList.toggle('active', type === 'away');
  lblHome.classList.toggle('highlight', type === 'home');
  lblAway.classList.toggle('highlight', type === 'away');
  updateResult();
}

export function updateResult() {
  var el = document.getElementById('result-display');
  if (!el) return;
  var r = matchType === 'home'
    ? (home > away ? 'wins' : home < away ? 'loss' : 'draw')
    : (away > home ? 'wins' : away < home ? 'loss' : 'draw');
  var labels = { wins: t('res_win'), draw: t('res_uavgjort'), loss: t('res_tap') };
  el.textContent = labels[r];
  el.className = 'result-auto ' + r;
}

export function adjust(type, delta) {
  var ownScore = matchType === 'home' ? home : away;
  if (type === 'goals') {
    var cg = clampStats(goals + delta, assist, ownScore);
    goals = cg.goals; assist = cg.assists;
    document.getElementById('goals-display').textContent = goals;
    document.getElementById('assist-display').textContent = assist;
  }
  if (type === 'assist') {
    var ca = clampStats(goals, assist + delta, ownScore);
    assist = ca.assists;
    document.getElementById('assist-display').textContent = assist;
  }
  if (type === 'home') {
    home = Math.max(0, home + delta);
    if (matchType === 'home') {
      var ch = clampStats(goals, assist, home);
      goals = ch.goals; assist = ch.assists;
      document.getElementById('goals-display').textContent = goals;
      document.getElementById('assist-display').textContent = assist;
    }
    document.getElementById('home-display').textContent = home;
    updateResult();
  }
  if (type === 'away') {
    away = Math.max(0, away + delta);
    if (matchType === 'away') {
      var caw = clampStats(goals, assist, away);
      goals = caw.goals; assist = caw.assists;
      document.getElementById('goals-display').textContent = goals;
      document.getElementById('assist-display').textContent = assist;
    }
    document.getElementById('away-display').textContent = away;
    updateResult();
  }
}

export async function saveMatch() {
  var date = document.getElementById('date').value;
  var opponent = document.getElementById('opponent').value.trim();
  var team = getSelectedTeam();
  var tournament = getSelectedTournament();
  if (!date || !opponent || !team) {
    showToast(t('toast_fyll_inn'), 'error');
    return;
  }
  var btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = t('saving');
  try {
    var res = await insertKamp({
      date:       date,
      opponent:   opponent,
      own_team:   team,
      tournament: tournament,
      home_score: home,
      away_score: away,
      goals:      goals,
      assists:    assist,
      match_type: matchType
    });
    if (res.ok) {
      var newMatches = await res.json();
      if (newMatches && newMatches[0]) {
        setAllMatches([newMatches[0]].concat(getAllMatches()));
      } else {
        invalidateMatchCache();
      }
      showToast(t('toast_match_saved'), 'success');
      resetForm();
      // Assessment sheet only opens if Supabase returns the inserted row (Prefer: return=representation).
      // If the response body is empty, the sheet is silently skipped — match was still saved successfully.
      if (newMatches && newMatches[0] && newMatches[0].id) {
        document.dispatchEvent(new CustomEvent('athlytics:showAssessment', { detail: { matchId: newMatches[0].id } }));
      }
    } else {
      showToast(t('toast_feil_lagring'), 'error');
    }
  } catch(e) {
    showToast(t('toast_nettverksfeil'), 'error');
  }
  btn.disabled = false; btn.textContent = t('save_match');
}

export function resetForm() {
  document.getElementById('opponent').value = '';
  selectTournament('');
  goals = 0; assist = 0; home = 0; away = 0;
  ['goals','assist','home','away'].forEach(function(id) {
    document.getElementById(id + '-display').textContent = '0';
  });
  setMatchType('home');
  updateResult();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  // Intentional: keeps last selected team for convenience — user often logs multiple matches for the same team
  renderTeamDropdown();
}

export function updateDateLabel(val) {
  var el = document.getElementById('date-display-label');
  if (!el) return;
  var today = new Date().toISOString().split('T')[0];
  if (!val || val === today) {
    el.textContent = t('today');
  } else {
    var d = new Date(val + 'T00:00:00');
    el.textContent = d.toLocaleDateString(getDateLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

export function setupDateToggle() {
  var btn = document.getElementById('date-toggle-btn');
  var input = document.getElementById('date');
  if (!btn || !input) return;
  var blurTimer = null;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = input.classList.toggle('open');
    if (isOpen) input.focus();
  });
  input.addEventListener('change', function() {
    updateDateLabel(input.value);
  });
  input.addEventListener('blur', function() {
    blurTimer = setTimeout(function() {
      input.classList.remove('open');
    }, 200);
  });
  input.addEventListener('focus', function() {
    clearTimeout(blurTimer);
  });
}
