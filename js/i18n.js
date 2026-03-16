import { getSettings, saveSettings } from './settings.js';

const TEKST = {
  no: {
    tab_log:'Logg', tab_stats:'Statistikk', tab_profile:'Profil', tab_settings:'Settings',
    date:'Dato', opponentTeam:'Motstanderlag', own_team:'Eget team / tropp',
    turnering:'Turnering / serie', goals:'Mål', assist:'Assist',
    hjemmekamp:'Hjemmekamp', bortekamp:'Bortekamp', save_match:'Lagre kamp', saving:'Lagrer...',
    home_label:'Hjemmelag', away_label:'Bortelag',
    match_type_label:'Hjemme eller away?', result_label:'Resultat',
    ph_opponent:'F.eks. Brann IL', ph_tournament:'F.eks. Kretscup, seriespill...',
    select_team:'— Velg team —', nytt_lag:'＋ Nytt team...',
    select_tournament:'— Velg turnering —',
    res_win:'🏆 Seier', res_uavgjort:'🤝 Uavgjort', res_tap:'💪 Tap',
    alle_lag:'Alle team', match_history:'Kamphistorikk', no_matches:'Ingen matches denne the_season',
    snitt:'snitt/kamp', h_short:'H', b_short:'B',
    profile_title:'Min profil', profile_sub:'Innstillinger og team', avatar_upload:'Trykk for å laste opp bilde',
    spillerinfo:'Spillerinfo', name:'Navn', club:'Klubb', posisjon:'Posisjon',
    ph_navn:'Fullt name', ph_klubb:'F.eks. Stabæk', ph_posisjon:'F.eks. Midtbane',
    mine_lag:'Mine team / tropper', ph_add_team:'Legg til team...', add_item:'Legg til',
    save_profile:'Lagre profil', standard_badge:'standard', today:'I dag',
    settings_sub:'Tilpass Athlytics Sport',
    lang_title:'🌍 Språk', lang_desc:'Velg språk for appen.',
    sport_title:'🏅 Sport', sport_desc:'Velg hvilken sport du primært tracker. Flere sporter kommer snart.',
    sf_title:'📅 Sesongformat', sf_desc:'Norsk format bruker kalenderår (2025). Internasjonalt format bruker sesong (2025–2026).',
    as_title:'⭐ Aktiv sesong', as_desc:'Forhåndsvalgt sesong i Logg og Statistikk.',
    no_seasons:'Ingen seasons enda – legg til nedenfor',
    ph_new_season:'Legg til sesong (f.eks. 2027)',
    format_aar:'📅 År (2025)', format_season:'🗓️ Sesong (2025–2026)',
    sport_fotball:'⚽ Fotball', sport_ori:'🧭 Orientering', sport_ski:'⛷️ Ski', snart:'snart',
    modal_rediger:'Rediger kamp', save_changes:'Lagre endringer', delete_btn:'🗑 Slett', this_match:'denne kampen',
    toast_team_added:'✓ Lag lagt til', toast_tournament_added:'✓ Turnering lagt til',
    toast_tournament_exists:'Turneringen finnes allerede',
    tournament_reset:'Nullstill turnering', tournament_new:'Ny turnering...',
    toast_profile_saved:'✓ Profil saved', toast_lag_finnes:'Laget finnes allerede',
    toast_fyll_inn:'Fyll inn date, opponent og velg team', toast_match_saved:'⚽ Kamp saved!',
    toast_nettverksfeil:'Nettverksfeil – prøv igjen', toast_sport_updated:'Sport oppdatert',
    toast_active_season:'⭐ Aktiv sesong: ', toast_ugyldig_aar:'Skriv inn et gyldig årstall',
    toast_season_exists:'Sesongen finnes allerede', toast_season_added:'✓ Sesong lagt til',
    toast_match_updated:'✓ Kamp oppdatert', toast_feil_lagring:'Feil ved lagring',
    toast_match_deleted:'🗑 Kamp slettet', toast_delete_error:'Feil ved sletting',
    toast_nettverksfeil_kort:'Nettverksfeil',
    loading_stats:'Henter statistikk...', load_error:'Klarte ikke laste data',
    no_matches_season:'Ingen kamper denne sesongen', no_matches_yet:'Ingen kamper enda', no_matches_card:'Ingen kamper',
    stat_wins:'Seier', stat_draws:'Uavgjort', stat_losses:'Tap', stat_goals:'Mål', stat_assists:'Assist',
    win_short:'S', draw_short:'U', loss_short:'T',
    match_dist:'Kampfordeling', avg_per_match:'Gjennomsnitt per kamp',
    goals_per_match:'Mål per kamp', assist_per_match:'Assist per kamp', ga_per_match:'G+A per kamp',
    home_vs_away:'Hjemme vs Borte', stat_home:'🏠 Hjemme', stat_away:'✈️ Borte',
    per_tournament:'Per turnering', matches_short:'kamper', all_teams_subtitle:'alle team',
    opponent_search_ph:'Søk motstander...', no_match_vs:'Ingen kamper mot', opponent_search_title:'Motstandersøk',
    page_prev:'← Forrige', page_next:'Neste →', page_of:'av',
    form_title:'Form', loading_charts:'Laster grafer...',
    chart_win_pct:'Kumulativ seiersprosent', chart_goals_assists:'Mål \u0026 assist per kamp', chart_goals_tourn:'Mål per turnering',
    pro_feature:'Pro-funksjon', pro_upgrade_text:'Oppgrader til Pro for å se avanserte grafer og analyse', pro_unlock_btn:'Lås opp Pro ⭐',
    profile_prompt_title:'Velkommen! Sett opp profilen din', profile_prompt_desc:'Legg til navn og klubb så blir statistikk og eksport personlig. Tar 30 sekunder.', profile_prompt_skip:'Hopp over',
    export_fetching:'Henter data...', export_no_matches:'Ingen kamper å eksportere',
    export_csv_done:'\u{1F4CA} CSV lastet ned', export_pdf_done:'\u{1F4C4} PDF åpnet \u2013 trykk Skriv ut',
    export_popup_blocked:'Tillat popup for PDF', export_season:'Sesong',
    export_matches:'Kamper', export_tournament:'Turnering', export_ast:'Ast', export_res:'Res',
    export_h_score:'Hjemme', export_a_score:'Borte',
    export_footer:'Generert av Athlytics Sport',
  },
  en: {
    tab_log:'Log', tab_stats:'Stats', tab_profile:'Profile', tab_settings:'Settings',
    date:'Date', opponentTeam:'Opponent', own_team:'My team / squad',
    turnering:'Tournament / league', goals:'Goals', assist:'Assists',
    hjemmekamp:'Home', bortekamp:'Away', save_match:'Save match', saving:'Saving...',
    home_label:'Home', away_label:'Away',
    match_type_label:'Home or away?', result_label:'Result',
    ph_opponent:'E.g. Arsenal FC', ph_tournament:'E.g. Cup, league...',
    select_team:'— Select team —', nytt_lag:'＋ New team...',
    select_tournament:'— Select tournament —',
    res_win:'🏆 Win', res_uavgjort:'🤝 Draw', res_tap:'💪 Loss',
    alle_lag:'All teams', match_history:'Match history', no_matches:'No matches this season',
    snitt:'avg/match', h_short:'H', b_short:'A',
    profile_title:'My profile', profile_sub:'Settings and teams', avatar_upload:'Tap to upload photo',
    spillerinfo:'Player info', name:'Name', club:'Club', posisjon:'Position',
    ph_navn:'Full name', ph_klubb:'E.g. Arsenal', ph_posisjon:'E.g. Midfielder',
    mine_lag:'My teams / squads', ph_add_team:'Add team...', add_item:'Add',
    save_profile:'Save profile', standard_badge:'default', today:'Today',
    settings_sub:'Customize Athlytics Sport',
    lang_title:'🌍 Language', lang_desc:'Choose language for the app.',
    sport_title:'🏅 Sport', sport_desc:'Choose your primary sport. More sports coming soon.',
    sf_title:'📅 Season format', sf_desc:'Norwegian format uses calendar year (2025). International uses season (2025–2026).',
    as_title:'⭐ Active season', as_desc:'Pre-selected season in Log and Stats.',
    no_seasons:'No seasons yet – add one below',
    ph_new_season:'Add season (e.g. 2027)',
    format_aar:'📅 Year (2025)', format_season:'🗓️ Season (2025–2026)',
    sport_fotball:'⚽ Football', sport_ori:'🧭 Orienteering', sport_ski:'⛷️ Skiing', snart:'soon',
    modal_rediger:'Edit match', save_changes:'Save changes', delete_btn:'🗑 Delete', this_match:'this match',
    toast_team_added:'✓ Team added', toast_tournament_added:'✓ Tournament added',
    toast_tournament_exists:'Tournament already exists',
    tournament_reset:'Reset tournament', tournament_new:'New tournament...',
    toast_profile_saved:'✓ Profile saved', toast_lag_finnes:'Team already exists',
    toast_fyll_inn:'Fill in date, opponent and select team', toast_match_saved:'⚽ Match saved!',
    toast_nettverksfeil:'Network error – try again', toast_sport_updated:'Sport updated',
    toast_active_season:'⭐ Active season: ', toast_ugyldig_aar:'Enter a valid year',
    toast_season_exists:'Season already exists', toast_season_added:'✓ Season added',
    toast_match_updated:'✓ Match updated', toast_feil_lagring:'Error saving',
    toast_match_deleted:'🗑 Match deleted', toast_delete_error:'Error deleting',
    toast_nettverksfeil_kort:'Network error',
    loading_stats:'Loading stats...', load_error:'Failed to load data',
    no_matches_season:'No matches this season', no_matches_yet:'No matches yet', no_matches_card:'No matches',
    stat_wins:'Wins', stat_draws:'Draws', stat_losses:'Losses', stat_goals:'Goals', stat_assists:'Assists',
    win_short:'W', draw_short:'D', loss_short:'L',
    match_dist:'Match distribution', avg_per_match:'Average per match',
    goals_per_match:'Goals per match', assist_per_match:'Assists per match', ga_per_match:'G+A per match',
    home_vs_away:'Home vs Away', stat_home:'🏠 Home', stat_away:'✈️ Away',
    per_tournament:'By tournament', matches_short:'matches', all_teams_subtitle:'all teams',
    opponent_search_ph:'Search opponent...', no_match_vs:'No matches vs', opponent_search_title:'Opponent search',
    page_prev:'← Previous', page_next:'Next →', page_of:'of',
    form_title:'Form', loading_charts:'Loading charts...',
    chart_win_pct:'Cumulative win %', chart_goals_assists:'Goals \u0026 assists per match', chart_goals_tourn:'Goals by tournament',
    pro_feature:'Pro feature', pro_upgrade_text:'Upgrade to Pro for advanced charts and analysis', pro_unlock_btn:'Unlock Pro ⭐',
    profile_prompt_title:'Welcome! Set up your profile', profile_prompt_desc:'Add your name and club so your stats and exports are personalised. Takes 30 seconds.', profile_prompt_skip:'Skip for now',
    export_fetching:'Fetching data...', export_no_matches:'No matches to export',
    export_csv_done:'\u{1F4CA} CSV downloaded', export_pdf_done:'\u{1F4C4} PDF opened \u2013 press Print',
    export_popup_blocked:'Allow popup for PDF', export_season:'Season',
    export_matches:'Matches', export_tournament:'Tournament', export_ast:'Ast', export_res:'Res',
    export_h_score:'Home', export_a_score:'Away',
    export_footer:'Generated by Athlytics Sport',
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
  document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
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
  var wrap = btn ? btn.closest('.lang-picker-wrap') : null;
  var dd = wrap ? wrap.querySelector('.lang-picker-dropdown') : document.querySelector('.lang-picker-dropdown');
  var isOpen = dd && dd.classList.contains('open');
  document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  if (!isOpen && dd) dd.classList.add('open');
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

  document.dispatchEvent(new CustomEvent('athlytics:updateAllText'));

  var profileTitle = document.getElementById('profil-title');
  if (profileTitle) {
    var titleParts = t('profile_title').split(' ');
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
