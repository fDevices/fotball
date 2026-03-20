import { getSettings, saveSettings } from './settings.js';

const TEKST = {
  no: {
    tab_log:'Logg', tab_stats:'Statistikk', tab_profile:'Profil', tab_settings:'Innstillinger',
    date:'Dato', opponentTeam:'Motstanderlag', own_team:'Eget team / tropp',
    turnering:'Turnering / serie', goals:'Mål', assist:'Assist',
    hjemmekamp:'Hjemmekamp', bortekamp:'Bortekamp', save_match:'Lagre kamp', saving:'Lagrer...',
    home_label:'Hjemmelag', away_label:'Bortelag',
    match_type_label:'Hjemme eller away?', result_label:'Resultat',
    ph_opponent:'F.eks. Brann IL', ph_tournament:'F.eks. Kretscup, seriespill...',
    select_team:'— Velg team —', nytt_lag:'＋ Nytt team...',
    select_tournament:'— Velg turnering —',
    res_win:'🏆 Seier', res_uavgjort:'🤝 Uavgjort', res_tap:'💪 Tap',
    alle_lag:'Alle team', match_history:'Kamphistorikk', no_matches:'Ingen kamper denne sesongen',
    snitt:'snitt/kamp', h_short:'H', b_short:'B',
    profile_title:'Min profil', profile_sub:'Innstillinger og team', avatar_upload:'Trykk for å laste opp bilde',
    spillerinfo:'Spillerinfo', name:'Navn', club:'Klubb', posisjon:'Posisjon',
    ph_navn:'Fullt navn', ph_klubb:'F.eks. Stabæk', ph_posisjon:'F.eks. Midtbane',
    mine_lag:'Mine team / tropper', ph_add_team:'Legg til team...', ph_add_tournament:'Legg til turnering...', add_item:'Legg til',
    save_profile:'Lagre profil', standard_badge:'standard', today:'I dag',
    settings_sub:'Tilpass Athlytics Sport',
    lang_title:'🌍 Språk', lang_desc:'Velg språk for appen.',
    sport_title:'🏅 Sport', sport_desc:'Velg hvilken sport du primært tracker. Flere sporter kommer snart.',
    sf_title:'📅 Sesongformat', sf_desc:'Norsk format bruker kalenderår (2025). Internasjonalt format bruker sesong (2025–2026).',
    df_title:'📅 Datoformat', df_desc:'Velg hvordan datoer vises i appen.',
    df_eu:'🇪🇺 Europeisk (DD.MM.ÅÅÅÅ)', df_us:'🇺🇸 Amerikansk (MM/DD/ÅÅÅÅ)',
    toast_date_format:'📅 Datoformat oppdatert',
    as_title:'⭐ Aktiv sesong', as_desc:'Forhåndsvalgt sesong i Logg og Statistikk.',
    no_seasons:'Ingen sesonger enda – legg til nedenfor',
    ph_new_season:'Legg til sesong (f.eks. 2027)',
    format_aar:'📅 År (2025)', format_season:'🗓️ Sesong (2025–2026)',
    sport_fotball:'⚽ Fotball', sport_ori:'🧭 Orientering', sport_ski:'⛷️ Ski', snart:'snart',
    sport_icon:'⚽', stat1_label:'Mål', stat2_label:'Assist',
    modal_rediger:'Rediger kamp', save_changes:'Lagre endringer', delete_btn:'🗑 Slett', this_match:'denne kampen',
    toast_team_added:'✓ Lag lagt til', toast_tournament_added:'✓ Turnering lagt til',
    toast_tournament_exists:'Turneringen finnes allerede',
    tournament_reset:'Nullstill turnering', tournament_new:'Ny turnering...',
    toast_profile_saved:'✓ Profil lagret', toast_lag_finnes:'Laget finnes allerede',
    toast_fyll_inn:'Fyll inn dato, motstander og velg team', toast_match_saved:'⚽ Kamp lagret!',
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
    tournament_filter_all:'Alle', no_tournament:'Ingen turnering',
    avatar_change:'Trykk for å bytte bilde',
    log_greeting:'Hei',
    log_ready:'Klar til å logge kamp 🟢',
    no_teams_yet:'Ingen lag lagt til ennå',
    no_tournaments_yet:'Ingen turneringer enda',
    none:'ingen',
    ph_new_team:'Navn på nytt team...',
    ph_new_tournament:'Navn på turnering...',
    stats_overview:'Oversikt',
    stats_analyse:'Analyse',
    tournaments_title:'🏆 Mine turneringer / serier',
    saved:'✓ Lagret',
    cat_effort:'Innsats', cat_focus:'Fokus', cat_technique:'Teknikk', cat_team_play:'Lagspill', cat_impact:'Påvirkning',
    rating_1:'Veldig dårlig', rating_2:'Under mitt nivå', rating_3:'Greit', rating_4:'Bra', rating_5:'Veldig bra',
    assess_heading:'Hvordan vurderer du deg selv i dag?', assess_btn:'⭐ Vurder deg selv',
    assess_save:'Lagre vurdering', assess_skip:'Hopp over',
    assess_good:'Hva gikk bra?', assess_improve:'Hva vil jeg forbedre?',
    assess_saved:'✓ Vurdering lagret',
    demo_banner_text:'Du ser demodata — opprett en gratis konto for å logge dine egne kamper',
    demo_banner_signup:'Registrer deg gratis',
    auth_login_title:'Logg inn',
    auth_login_btn:'Logg inn',
    auth_signup_title:'Opprett konto',
    auth_signup_btn:'Opprett konto',
    auth_to_signup:'Ingen konto? Registrer deg',
    auth_to_login:'Har du en konto? Logg inn',
    auth_logout:'Logg ut',
    auth_error_pw_mismatch:'Passordene stemmer ikke overens',
    toast_avatar_invalid_type: 'Filen må være et bilde',
    toast_avatar_too_large:    'Bildet er for stort (maks 10 MB)',
    toast_avatar_upload_failed: 'Opplasting feilet – prøv igjen',
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
    mine_lag:'My teams / squads', ph_add_team:'Add team...', ph_add_tournament:'Add tournament...', add_item:'Add',
    save_profile:'Save profile', standard_badge:'default', today:'Today',
    settings_sub:'Customize Athlytics Sport',
    lang_title:'🌍 Language', lang_desc:'Choose language for the app.',
    sport_title:'🏅 Sport', sport_desc:'Choose your primary sport. More sports coming soon.',
    sf_title:'📅 Season format', sf_desc:'Norwegian format uses calendar year (2025). International uses season (2025–2026).',
    df_title:'📅 Date format', df_desc:'Choose how dates are displayed in the app.',
    df_eu:'🇪🇺 European (DD.MM.YYYY)', df_us:'🇺🇸 US (MM/DD/YYYY)',
    toast_date_format:'📅 Date format updated',
    as_title:'⭐ Active season', as_desc:'Pre-selected season in Log and Stats.',
    no_seasons:'No seasons yet – add one below',
    ph_new_season:'Add season (e.g. 2027)',
    format_aar:'📅 Year (2025)', format_season:'🗓️ Season (2025–2026)',
    sport_fotball:'⚽ Football', sport_ori:'🧭 Orienteering', sport_ski:'⛷️ Skiing', snart:'soon',
    sport_icon:'⚽', stat1_label:'Goals', stat2_label:'Assists',
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
    tournament_filter_all:'All', no_tournament:'No tournament',
    avatar_change:'Tap to change photo',
    log_greeting:'Hi',
    log_ready:'Ready to log match 🟢',
    no_teams_yet:'No teams added yet',
    no_tournaments_yet:'No tournaments yet',
    none:'none',
    ph_new_team:'Name of new team...',
    ph_new_tournament:'Name of tournament...',
    stats_overview:'Overview',
    stats_analyse:'Analysis',
    tournaments_title:'🏆 My tournaments / leagues',
    saved:'✓ Saved',
    cat_effort:'Effort', cat_focus:'Focus', cat_technique:'Technique', cat_team_play:'Teamwork', cat_impact:'Impact',
    rating_1:'Very poor', rating_2:'Below my level', rating_3:'Okay', rating_4:'Good', rating_5:'Very good',
    assess_heading:'How do you rate yourself today?', assess_btn:'⭐ Rate yourself',
    assess_save:'Save assessment', assess_skip:'Skip',
    assess_good:'What went well?', assess_improve:'What do I want to improve?',
    assess_saved:'✓ Assessment saved',
    demo_banner_text:"You're viewing demo data — create a free account to track your own",
    demo_banner_signup:'Sign up free',
    auth_login_title:'Log in',
    auth_login_btn:'Log in',
    auth_signup_title:'Create account',
    auth_signup_btn:'Create account',
    auth_to_signup:"Don't have an account? Sign up",
    auth_to_login:'Already have an account? Log in',
    auth_logout:'Log out',
    auth_error_pw_mismatch:'Passwords do not match',
    toast_avatar_invalid_type: 'File must be an image',
    toast_avatar_too_large:    'Image is too large (max 10 MB)',
    toast_avatar_upload_failed: 'Upload failed – please try again',
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
    'profile-new-tournament': 'ph_add_tournament', 'profile-team-input': 'ph_add_team', 'settings-ny-sesong': 'ph_new_season',
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

  document.dispatchEvent(new CustomEvent('athlytics:updateAllText'));

  var profileTitle = document.getElementById('profil-title');
  if (profileTitle) {
    var titleParts = t('profile_title').split(' ');
    // innerHTML is intentional: wraps second word in <span> for split-colour heading style
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
