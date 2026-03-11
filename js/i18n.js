import { getSettings, saveSettings } from './settings.js';

const TEKST = {
  no: {
    tab_log:'Logg', tab_stats:'Statistikk', tab_profile:'Profil', tab_settings:'Settings',
    date:'Dato', opponentTeam:'Motstanderlag', own_team:'Eget team / tropp',
    turnering:'Turnering / serie', goals:'Mål', assist:'Assist',
    hjemmekamp:'🏠 Hjemmekamp', bortekamp:'✈️ Bortekamp', save_match:'Lagre kamp',
    home_label:'Hjemmelag', away_label:'Bortelag',
    match_type_label:'Hjemme eller away?', result_label:'Resultat',
    ph_opponent:'F.eks. Brann IL', ph_tournament:'F.eks. Kretscup, seriespill...',
    select_team:'— Velg team —', nytt_lag:'＋ Nytt team...',
    select_tournament:'— Velg turnering —',
    res_win:'🏆 Seier', res_uavgjort:'🤝 Uavgjort', res_tap:'💪 Tap',
    alle_lag:'Alle team', match_history:'Kamphistorikk', no_matches:'Ingen matches denne the_season',
    snitt:'snitt/kamp', h_short:'H', b_short:'B',
    profile_sub:'Innstillinger og team', avatar_upload:'Trykk for å laste opp bilde',
    spillerinfo:'Spillerinfo', name:'Navn', club:'Klubb', posisjon:'Posisjon',
    ph_navn:'Fullt name', ph_klubb:'F.eks. Stabæk', ph_posisjon:'F.eks. Midtbane',
    mine_lag:'Mine team / tropper', ph_add_team:'Legg til team...', add_item:'Legg til',
    save_profile:'Lagre profil', standard_badge:'standard',
    settings_sub:'Tilpass Athlytics Sport',
    lang_title:'🌍 Språk', lang_desc:'Velg språk for appen.',
    sport_title:'🏅 Sport', sport_desc:'Velg hvilken sport du primært tracker. Flere sporter kommer snart.',
    sf_title:'📅 Sesongformat', sf_desc:'Norsk format bruker kalenderår (2025). Internasjonalt format bruker sesong (2025–2026).',
    as_title:'⭐ Aktiv sesong', as_desc:'Forhåndsvalgt sesong i Logg og Statistikk.',
    no_seasons:'Ingen seasons enda – legg til nedenfor',
    ph_new_season:'Legg til sesong (f.eks. 2027)',
    format_aar:'📅 År (2025)', format_season:'🗓️ Sesong (2025–2026)',
    sport_fotball:'⚽ Fotball', sport_ori:'🧭 Orientering', sport_ski:'⛷️ Ski', snart:'snart',
    modal_rediger:'Rediger kamp', save_changes:'Lagre endringer', delete_btn:'🗑 Slett',
    toast_profile_saved:'✓ Profil saved', toast_lag_finnes:'Laget finnes allerede',
    toast_fyll_inn:'Fyll inn date, opponent og velg team', toast_match_saved:'⚽ Kamp saved!',
    toast_nettverksfeil:'Nettverksfeil – prøv igjen', toast_sport_updated:'Sport oppdatert',
    toast_active_season:'⭐ Aktiv sesong: ', toast_ugyldig_aar:'Skriv inn et gyldig årstall',
    toast_season_exists:'Sesongen finnes allerede', toast_season_added:'✓ Sesong lagt til',
    toast_match_updated:'✓ Kamp oppdatert', toast_feil_lagring:'Feil ved lagring',
    toast_match_deleted:'🗑 Kamp slettet', toast_delete_error:'Feil ved sletting',
    toast_nettverksfeil_kort:'Nettverksfeil',
  },
  en: {
    tab_log:'Log', tab_stats:'Stats', tab_profile:'Profile', tab_settings:'Settings',
    date:'Date', opponentTeam:'Opponent', own_team:'My team / squad',
    turnering:'Tournament / league', goals:'Goals', assist:'Assists',
    hjemmekamp:'🏠 Home', bortekamp:'✈️ Away', save_match:'Save match',
    home_label:'Home', away_label:'Away',
    match_type_label:'Home or away?', result_label:'Result',
    ph_opponent:'E.g. Arsenal FC', ph_tournament:'E.g. Cup, league...',
    select_team:'— Select team —', nytt_lag:'＋ New team...',
    select_tournament:'— Select tournament —',
    res_win:'🏆 Win', res_uavgjort:'🤝 Draw', res_tap:'💪 Loss',
    alle_lag:'All teams', match_history:'Match history', no_matches:'No matches this season',
    snitt:'avg/match', h_short:'H', b_short:'A',
    profile_sub:'Settings and teams', avatar_upload:'Tap to upload photo',
    spillerinfo:'Player info', name:'Name', club:'Club', posisjon:'Position',
    ph_navn:'Full name', ph_klubb:'E.g. Arsenal', ph_posisjon:'E.g. Midfielder',
    mine_lag:'My teams / squads', ph_add_team:'Add team...', add_item:'Add',
    save_profile:'Save profile', standard_badge:'default',
    settings_sub:'Customize Athlytics Sport',
    lang_title:'🌍 Language', lang_desc:'Choose language for the app.',
    sport_title:'🏅 Sport', sport_desc:'Choose your primary sport. More sports coming soon.',
    sf_title:'📅 Season format', sf_desc:'Norwegian format uses calendar year (2025). International uses season (2025–2026).',
    as_title:'⭐ Active season', as_desc:'Pre-selected season in Log and Stats.',
    no_seasons:'No seasons yet – add one below',
    ph_new_season:'Add season (e.g. 2027)',
    format_aar:'📅 Year (2025)', format_season:'🗓️ Season (2025–2026)',
    sport_fotball:'⚽ Football', sport_ori:'🧭 Orienteering', sport_ski:'⛷️ Skiing', snart:'soon',
    modal_rediger:'Edit match', save_changes:'Save changes', delete_btn:'🗑 Delete',
    toast_profile_saved:'✓ Profile saved', toast_lag_finnes:'Team already exists',
    toast_fyll_inn:'Fill in date, opponent and select team', toast_match_saved:'⚽ Match saved!',
    toast_nettverksfeil:'Network error – try again', toast_sport_updated:'Sport updated',
    toast_active_season:'⭐ Active season: ', toast_ugyldig_aar:'Enter a valid year',
    toast_season_exists:'Season already exists', toast_season_added:'✓ Season added',
    toast_match_updated:'✓ Match updated', toast_feil_lagring:'Error saving',
    toast_match_deleted:'🗑 Match deleted', toast_delete_error:'Error deleting',
    toast_nettverksfeil_kort:'Network error',
  }
};

export function t(key) {
  var lang = getSettings().lang || 'no';
  return (TEKST[lang] || TEKST.no)[key] || TEKST.no[key] || key;
}

export function setLang(lang) {
  var s = getSettings();
  s.lang = lang;
  saveSettings(s);
  var d = document.getElementById('lang-picker-dropdown');
  if (d) d.classList.remove('open');
  updateFlags();
  updateAllText();
  showToastLang(lang);
}

function showToastLang(lang) {
  // avoid circular import – dispatch custom event, main.js shows toast
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

export function toggleLangPicker(btn) {
  document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  var dd = btn ? btn.parentElement.querySelector('.lang-picker-dropdown') : document.querySelector('.lang-picker-dropdown');
  if (dd) dd.classList.toggle('open');
  setTimeout(function() {
    document.addEventListener('click', function closePicker(e) {
      if (!e.target.closest('.lang-flag-btn') && !e.target.closest('.lang-picker-dropdown')) {
        document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
        document.removeEventListener('click', closePicker);
      }
    });
  }, 50);
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
    'profile-new-tournament': 'ph_add_team', 'settings-ny-sesong': 'ph_new_season'
  };
  Object.keys(ph).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.placeholder = t(ph[id]);
  });
  var btnSave = document.getElementById('submit-btn');
  if (btnSave) btnSave.textContent = t('save_match');
  var btnProfile = document.getElementById('btn-save-profil');
  if (btnProfile) btnProfile.textContent = t('save_profile');
  var btnHome = document.getElementById('btn-home-toggle');
  var btnAway = document.getElementById('btn-away-toggle');
  if (btnHome) btnHome.innerHTML = t('hjemmekamp');
  if (btnAway) btnAway.innerHTML = t('bortekamp');
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

  document.dispatchEvent(new CustomEvent('athlytics:updateAllText'));

  var profileSub = document.getElementById('profil-sub');
  if (profileSub) profileSub.textContent = getSettings().lang === 'en' ? 'Settings and teams' : 'Innstillinger og team';
  var settingsSub = document.getElementById('settings-sub');
  if (settingsSub) settingsSub.textContent = getSettings().lang === 'en' ? 'Customize Athlytics Sport' : 'Tilpass Athlytics Sport';
  if (document.getElementById('screen-settings') &&
      document.getElementById('screen-settings').classList.contains('active')) {
    document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
  }
}
