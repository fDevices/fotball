import { t } from './i18n.js';
import { getSettings, saveSettings } from './settings.js';

export function setLang(lang) {
  var s = getSettings();
  s.lang = lang;
  saveSettings(s);
  document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  updateFlags();
  updateAllText();
  document.dispatchEvent(new CustomEvent('athlytics:toast', {
    detail: { msg: lang === 'no' ? '🇳🇴 Norsk' : '🇬🇧 English', type: 'success' }
  }));
}

export function updateFlags() {
  var s = getSettings();
  var flag = s.lang === 'en' ? '🇬🇧' : '🇳🇴';
  document.querySelectorAll('.lang-flag-btn').forEach(function(btn) {
    btn.textContent = flag;
  });
}

export function updateAllText() {
  var labels = {
    'label-date': 'date', 'label-opponent': 'opponentTeam',
    'label-egetlag': 'own_team', 'label-turnering': 'turnering',
    'label-goals': 'goals', 'label-assist': 'assist',
    'label-home': 'home_label', 'label-away': 'away_label',
    'label-matchType': 'match_type_label', 'label-result': 'result_label'
  };
  Object.keys(labels).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = t(labels[id]);
  });
  var ph = {
    'opponent': 'ph_opponent',
    'profil-name': 'ph_navn', 'profil-club': 'ph_klubb', 'profil-posisjon': 'ph_posisjon',
    'profile-new-tournament': 'ph_add_tournament', 'profile-team-input': 'ph_add_team', 'settings-new-season': 'ph_new_season',
    'team-new-input': 'ph_new_team', 'tournament-new-input': 'ph_new_tournament'
  };
  Object.keys(ph).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.placeholder = t(ph[id]);
  });
  var dateLabel = document.getElementById('date-display-label');
  if (dateLabel) dateLabel.textContent = t('today');
  var teamNewSave = document.getElementById('team-new-save-btn');
  if (teamNewSave) teamNewSave.textContent = t('add_item');
  var tournamentNewSave = document.getElementById('tournament-new-save-btn');
  if (tournamentNewSave) tournamentNewSave.textContent = t('add_item');
  var statsHeaderBadge = document.getElementById('stats-header-badge');
  if (statsHeaderBadge) statsHeaderBadge.textContent = '📊 ' + t('tab_stats');
  var statsOverview = document.getElementById('stats-view-btn-overview');
  if (statsOverview) statsOverview.textContent = t('stats_overview');
  var statsAnalyseText = document.getElementById('stats-analyse-text');
  if (statsAnalyseText) statsAnalyseText.textContent = t('stats_analyse');
  var spillerinfo = document.getElementById('profil-card-spillerinfo');
  if (spillerinfo) spillerinfo.textContent = t('spillerinfo');
  var labelName = document.getElementById('profil-label-name');
  if (labelName) labelName.textContent = t('name');
  var labelClub = document.getElementById('profil-label-club');
  if (labelClub) labelClub.textContent = t('club');
  var labelPosisjon = document.getElementById('profil-label-posisjon');
  if (labelPosisjon) labelPosisjon.textContent = t('posisjon');
  var tournamentsTitle = document.getElementById('profil-card-tournaments');
  if (tournamentsTitle) tournamentsTitle.textContent = t('tournaments_title');
  var teamsTitle = document.getElementById('profil-card-teams');
  if (teamsTitle) teamsTitle.textContent = t('mine_lag');
  var profilSaved = document.getElementById('profil-saved');
  if (profilSaved) profilSaved.textContent = t('saved');
  var btnSave = document.getElementById('submit-btn');
  if (btnSave) btnSave.textContent = t('save_match');
  var btnProfile = document.getElementById('btn-save-profil');
  if (btnProfile) btnProfile.textContent = t('save_profile');
  var btnHome = document.getElementById('btn-home-toggle');
  var btnAway = document.getElementById('btn-away-toggle');
  if (btnHome) { var spH = btnHome.querySelector('span'); if (spH) spH.textContent = t('hjemmekamp'); }
  if (btnAway) { var spA = btnAway.querySelector('span'); if (spA) spA.textContent = t('bortekamp'); }
  var teamTxt = document.getElementById('team-selected-text');
  if (teamTxt && teamTxt.classList.contains('placeholder')) {
    teamTxt.textContent = t('select_team');
  }
  var tournamentTxt = document.getElementById('tournament-selected-text');
  if (tournamentTxt && !tournamentTxt._selected) {
    tournamentTxt.textContent = t('select_tournament');
  }
  var tabKeys = { log: 'tab_log', stats: 'tab_stats', profil: 'tab_profile', settings: 'tab_settings' };
  ['log','stats','profil','settings'].forEach(function(tab) {
    var el = document.querySelector('#tab-' + tab + ' .tab-label');
    if (el) el.textContent = t(tabKeys[tab]);
  });

  // IMPORTANT: keep this dispatch — main.js listens to call renderLogSub(), updateResult(), updateLogBadge()
  document.dispatchEvent(new CustomEvent('athlytics:updateAllText'));

  var profileTitle = document.getElementById('profil-title');
  if (profileTitle) {
    var titleParts = t('profile_title').split(' ');
    // innerHTML intentional: wraps second word in <span> for split-colour heading style
    profileTitle.innerHTML = titleParts[0] + (titleParts.length > 1 ? '<span> ' + titleParts.slice(1).join(' ') + '</span>' : '');
  }
  var profileSub = document.getElementById('profil-sub');
  if (profileSub) profileSub.textContent = t('profile_sub');
  var promptTitle = document.getElementById('profile-prompt-title');
  if (promptTitle) promptTitle.textContent = t('profile_prompt_title');
  var promptDesc = document.getElementById('profile-prompt-desc');
  if (promptDesc) promptDesc.textContent = t('profile_prompt_desc');
  var promptSkip = document.getElementById('profile-prompt-skip');
  if (promptSkip) promptSkip.textContent = t('profile_prompt_skip');
  var settingsSub = document.getElementById('settings-sub');
  if (settingsSub) settingsSub.textContent = t('settings_sub');
  if (document.getElementById('screen-settings') &&
      document.getElementById('screen-settings').classList.contains('active')) {
    document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
  }
}
