import { insertKamp } from './supabase.js';
import { allMatches, setAllMatches, invalidateMatchCache } from './state.js';
import { getSelectedTeam, getSelectedTournament, selectTournament, renderTeamDropdown } from './teams.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';

var goals = 0, assist = 0, home = 0, away = 0, matchType = 'home';

export function getMatchType() { return matchType; }

export function setMatchType(type) {
  matchType = type;
  document.getElementById('btn-home-toggle').classList.toggle('active', type === 'home');
  document.getElementById('btn-away-toggle').classList.toggle('active', type === 'away');
  document.getElementById('label-home').classList.toggle('highlight', type === 'home');
  document.getElementById('label-away').classList.toggle('highlight', type === 'away');
  updateResult();
}

export function updateResult() {
  var el = document.getElementById('result-display');
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
    goals = Math.min(ownScore, Math.max(0, goals + delta));
    assist = Math.min(assist, ownScore - goals);
    document.getElementById('goals-display').textContent = goals;
    document.getElementById('assist-display').textContent = assist;
  }
  if (type === 'assist') {
    assist = Math.min(ownScore - goals, Math.max(0, assist + delta));
    document.getElementById('assist-display').textContent = assist;
  }
  if (type === 'home') {
    home = Math.max(0, home + delta);
    if (matchType === 'home') {
      goals = Math.min(goals, home);
      assist = Math.min(assist, home - goals);
      document.getElementById('goals-display').textContent = goals;
      document.getElementById('assist-display').textContent = assist;
    }
    document.getElementById('home-display').textContent = home;
    updateResult();
  }
  if (type === 'away') {
    away = Math.max(0, away + delta);
    if (matchType === 'away') {
      goals = Math.min(goals, away);
      assist = Math.min(assist, away - goals);
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
        allMatches.unshift(newMatches[0]);
        setAllMatches(allMatches);
      } else {
        invalidateMatchCache();
      }
      showToast(t('toast_match_saved'), 'success');
      resetForm();
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
  renderTeamDropdown();
}
