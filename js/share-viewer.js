import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { esc, getResult } from './utils.js';
import { t, initViewerLang } from './i18n.js';

// ── Viewer lang (local mirror for flag rendering) ─────────────────────────────

var _viewerLang = 'no';

// ── RPC calls (anon key, no auth header) ─────────────────────────────────────

async function fetchSharedProfile(code) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_shared_profile', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_code: code })
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchSharedMatches(code) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_shared_matches', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_code: code })
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Error screen ─────────────────────────────────────────────────────────────

function showError(msg) {
  var root = document.getElementById('share-root');
  if (root) root.innerHTML =
    '<div class="share-error-screen">' +
      '<div class="share-error-icon">🔒</div>' +
      '<div class="share-error-msg">' + esc(msg) + '</div>' +
      '<a href="/" class="share-error-link">Athlytics Sport</a>' +
    '</div>';
}

// ── Filter state ─────────────────────────────────────────────────────────────

var _matches   = [];
var _settings  = {};  // shape: { activeSeason, seasonFormat, sport }
var _activeSeason     = '';
var _activeTeam        = 'all';
var _activeTournament = 'all';
var _matchPage        = 0;
var _activeView       = 'overview';

// ── Helpers (mirrors stats-overview.js) ──────────────────────────────────────

function matchesSeason(k, season) {
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var year = parseInt((k.date || '').slice(0, 4), 10);
  if (/[–\-]/.test(season)) return year === base || year === base + 1;
  return (k.date || '').startsWith(season);
}

function matchesTeamFilter(k, lag) {
  if (lag === 'all') return true;
  var stored = (k.own_team || '').toLowerCase();
  var filter = lag.toLowerCase();
  return stored === filter || stored.endsWith(' ' + filter);
}

function getAllSeasons(matches) {
  var years = {};
  matches.forEach(function(k) {
    var y = (k.date || '').slice(0, 4);
    if (y) years[y] = true;
  });
  return Object.keys(years).sort(function(a, b) { return b - a; });
}

function calcWDL(arr) {
  var w = 0, d = 0, l = 0, g = 0, a = 0;
  arr.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.goals || 0; a += k.assists || 0;
  });
  return { w: w, d: d, l: l, g: g, a: a, n: arr.length };
}

var PAGE_SIZE = 20;

function renderMatchList(matches, page) {
  var matchPage = page || 0;
  var total = matches.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (matchPage >= totalPages) matchPage = totalPages - 1;
  var start = matchPage * PAGE_SIZE;
  var slice = matches.slice(start, start + PAGE_SIZE);

  if (slice.length === 0) return '<div class="loading">' + t('no_matches_yet') + '</div>';

  var rows = slice.map(function(k) {
    var r = getResult(k);
    var resIkon = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    var homeTeam = k.match_type === 'home' ? (k.own_team || '') : (k.opponent || '');
    var awayTeam = k.match_type === 'home' ? (k.opponent || '') : (k.own_team || '');
    var tournament = k.tournament ? ' \xb7 ' + esc(k.tournament) : '';
    var goalText = (k.goals || 0) > 0
      ? ' \xb7 ' + k.goals + '\u26BD' + ((k.assists || 0) > 0 ? ' ' + k.assists + '\uD83C\uDFAF' : '')
      : '';
    var date = esc(k.date || '');
    return '<div class="match-item">' +
      '<div class="match-result ' + r + '">' + resIkon + '</div>' +
      '<div class="match-info">' +
        '<div class="match-title-row">' +
          '<div class="match-opponent">' + esc(homeTeam) + '</div>' +
          (awayTeam ? '<div class="match-team-name">\xb7 ' + esc(awayTeam) + '</div>' : '') +
        '</div>' +
        '<div class="match-meta">' + date + tournament + goalText + '</div>' +
      '</div>' +
      '<div class="match-score">' + k.home_score + '\u2013' + k.away_score + '</div>' +
    '</div>';
  }).join('');

  var pagination = totalPages > 1
    ? '<div class="pagination">' +
        '<button class="page-btn" data-action="shareSetPage" data-page="' + (matchPage - 1) + '" ' + (matchPage === 0 ? 'disabled' : '') + '>' + t('page_prev') + '</button>' +
        '<span class="page-info">' + (start + 1) + '\u2013' + Math.min(start + PAGE_SIZE, total) + ' ' + t('page_of') + ' ' + total + '</span>' +
        '<button class="page-btn" data-action="shareSetPage" data-page="' + (matchPage + 1) + '" ' + (matchPage >= totalPages - 1 ? 'disabled' : '') + '>' + t('page_next') + '</button>' +
      '</div>'
    : '';

  return rows + pagination;
}

// ── Profile card ─────────────────────────────────────────────────────────────

function currentFlag() {
  return _viewerLang === 'en' ? '🇬🇧' : '🇳🇴';
}

function renderSidebarProfile(profile) {
  var avatarHtml = profile.avatar_url
    ? '<img src="' + esc(profile.avatar_url) + '" class="share-avatar" alt="avatar">'
    : '<div class="share-avatar share-avatar-placeholder"></div>';
  var favoriteTeam = (profile.favorite_team || '').trim();
  return '<div class="share-sidebar-profile">' +
    avatarHtml +
    '<div class="share-profile-info">' +
      '<div class="share-profile-name">' + esc(profile.name || '') + '</div>' +
      '<div class="share-profile-club">' + esc(profile.club || '') + '</div>' +
      (favoriteTeam ? '<div class="share-profile-team">' + esc(favoriteTeam) + '</div>' : '') +
    '</div>' +
    '<div class="lang-picker-wrap">' +
      '<button class="lang-flag-btn" data-action="shareToggleLang" title="Change language">' + currentFlag() + '</button>' +
      '<div class="lang-picker-dropdown">' +
        '<button data-action="shareSetLang" data-lang="no"><img src="/icons/flag-no.svg" alt="" class="flag-svg-icon"> Norsk</button>' +
        '<button data-action="shareSetLang" data-lang="en"><img src="/icons/flag-en.svg" alt="" class="flag-svg-icon"> English</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ── Form streak ───────────────────────────────────────────────────────────────

function renderFormStreak(matches) {
  var last10 = matches.slice(0, 10).reverse();
  if (last10.length === 0) {
    return '<div class="stat-row-card form-streak-wrap">' +
      '<div class="stat-row-title">' + t('form_title') + '</div>' +
      '<div class="form-streak-empty">' + t('no_matches_yet') + '</div>' +
    '</div>';
  }
  var boxes = last10.map(function(k) {
    var r = getResult(k);
    var lbl = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    return '<div class="form-streak-box ' + r + '" title="' + esc(k.opponent) + ' ' + k.home_score + '-' + k.away_score + '">' + lbl + '</div>';
  }).join('');
  return '<div class="stat-row-card form-streak-wrap">' +
    '<div class="stat-row-title">' + t('form_title') + ' (' + t('matches_short') + ': ' + last10.length + ')</div>' +
    '<div class="form-streak-boxes">' + boxes + '</div>' +
  '</div>';
}

// ── Home vs Away section ──────────────────────────────────────────────────────

function renderHomeAwaySection(matches) {
  var homeMatches = matches.filter(function(k) { return k.match_type === 'home'; });
  var awayMatches = matches.filter(function(k) { return k.match_type !== 'home'; });
  if (homeMatches.length === 0 && awayMatches.length === 0) return '';

  function cardHTML(label, matchArr, colorClass) {
    if (matchArr.length === 0) return '<div class="ha-card"><div class="ha-card-title ' + colorClass + '">' + label + '</div><div style="text-align:center;color:var(--muted);font-size:13px;padding:8px 0">' + t('no_matches_card') + '</div></div>';
    var s = calcWDL(matchArr);
    var pctW = Math.round((s.w / s.n) * 100);
    var pctD = Math.round((s.d / s.n) * 100);
    var pctL = 100 - pctW - pctD;
    return '<div class="ha-card">' +
      '<div class="ha-card-title ' + colorClass + '">' + label + ' (' + s.n + ')</div>' +
      '<div class="ha-nums">' +
        '<div class="ha-num"><div class="ha-num-val lime">' + s.w + '</div><div class="ha-num-lbl">' + t('win_short') + '</div></div>' +
        '<div class="ha-num"><div class="ha-num-val gold">' + s.d + '</div><div class="ha-num-lbl">' + t('draw_short') + '</div></div>' +
        '<div class="ha-num"><div class="ha-num-val danger">' + s.l + '</div><div class="ha-num-lbl">' + t('loss_short') + '</div></div>' +
      '</div>' +
      '<div class="ha-mini-bar">' +
        '<div class="ha-mini-seg" style="width:' + pctW + '%;background:var(--lime)"></div>' +
        '<div class="ha-mini-seg" style="width:' + pctD + '%;background:var(--gold)"></div>' +
        '<div class="ha-mini-seg" style="width:' + pctL + '%;background:var(--danger)"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' +
        '<div style="text-align:center"><div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--lime)">' + s.g + '</div><div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">' + t('stat_goals') + '</div></div>' +
        '<div style="text-align:center"><div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--gold)">' + s.a + '</div><div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">' + t('stat_assists') + '</div></div>' +
        '<div style="text-align:center"><div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--white)">' + (s.g + s.a) + '</div><div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">G+A</div></div>' +
      '</div>' +
    '</div>';
  }

  return '<div class="stat-row-card" style="margin-bottom:8px">' +
    '<div class="stat-row-title">' + t('home_vs_away') + '</div>' +
    '<div class="ha-grid">' +
      cardHTML(t('stat_home'), homeMatches, 'home') +
      cardHTML(t('stat_away'), awayMatches, 'away') +
    '</div>' +
  '</div>';
}

// ── Tournament breakdown section ──────────────────────────────────────────────

function renderTournamentSection(matches) {
  var tournamentMap = {};
  matches.forEach(function(k) {
    var tn = k.tournament || '\u2014';
    if (!tournamentMap[tn]) tournamentMap[tn] = [];
    tournamentMap[tn].push(k);
  });
  var tournaments = Object.keys(tournamentMap).sort(function(a, b) {
    return tournamentMap[b].length - tournamentMap[a].length;
  });
  if (tournaments.length <= 1) return '';

  var rows = tournaments.map(function(tn) {
    var s = calcWDL(tournamentMap[tn]);
    return '<div class="tournament-stat-row">' +
      '<div class="tournament-stat-name">' + esc(tn) + ' <span style="color:var(--muted);font-size:12px;font-weight:400">(' + s.n + ' ' + t('matches_short') + ')</span></div>' +
      '<div class="tournament-stat-badges">' +
        '<span class="t-badge win">' + s.w + t('win_short') + '</span>' +
        '<span class="t-badge draw">' + s.d + t('draw_short') + '</span>' +
        '<span class="t-badge loss">' + s.l + t('loss_short') + '</span>' +
        '<span class="tournament-wdl-sep"></span>' +
        '<span class="t-badge goals">\u26BD' + s.g + '</span>' +
        '<span class="t-badge assist">\u{1F3AF}' + s.a + '</span>' +
        '<span class="t-badge ga">\u2728' + (s.g + s.a) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="stat-row-card" style="margin-bottom:8px">' +
    '<div class="stat-row-title">' + t('per_tournament') + '</div>' +
    '<div class="tournament-stat-grid">' + rows + '</div>' +
  '</div>';
}

// ── Stats rendering (adapted from stats-overview.js) ─────────────────────────

function renderStats() {
  var seasons = getAllSeasons(_matches);
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  if (!seasons.includes(_activeSeason)) _activeSeason = seasons[0];

  var seasonMatches = _matches.filter(function(k) { return matchesSeason(k, _activeSeason); });

  // Team pills (from match data)
  var teamValues = [];
  seasonMatches.forEach(function(k) {
    var v = k.own_team || '';
    if (v && !teamValues.includes(v)) teamValues.push(v);
  });

  // Tournament pills (from match data)
  var tournamentValues = [];
  seasonMatches.forEach(function(k) {
    var v = k.tournament || '';
    if (!tournamentValues.includes(v)) tournamentValues.push(v);
  });
  tournamentValues.sort(function(a, b) { if (!a) return 1; if (!b) return -1; return a.localeCompare(b); });

  var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeTeam); });
  var filtered = _activeTournament === 'all'
    ? teamMatches
    : teamMatches.filter(function(k) { return (k.tournament || '') === _activeTournament; });

  var n = filtered.length;
  var s = calcWDL(filtered);

  var root = document.getElementById('share-root');
  if (!root) return;

  // Season pills
  var seasonPills = seasons.map(function(season) {
    return '<button class="season-pill' + (season === _activeSeason ? ' active' : '') +
      '" data-action="shareSetSeason" data-season="' + esc(season) + '">' + esc(season) + '</button>';
  }).join('');

  // Team pills
  var teamPills = [{ key: 'all', label: t('alle_lag') }]
    .concat(teamValues.map(function(v) { return { key: v, label: v }; }))
    .map(function(p) {
      return '<button class="season-pill' + (_activeTeam === p.key ? ' active' : '') +
        '" data-action="shareSetTeam" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
    }).join('');

  var sidebarFilters =
    '<div class="share-sidebar-divider"></div>' +
    '<div class="share-sidebar-section">' +
      '<div class="share-sidebar-section-label">' + t('stats_season_label') + '</div>' +
      '<div class="season-selector">' + seasonPills + '</div>' +
    '</div>' +
    (teamValues.length > 0
      ? '<div class="share-sidebar-section">' +
          '<div class="share-sidebar-section-label">' + t('alle_lag') + '</div>' +
          '<div class="season-selector" style="flex-wrap:wrap;overflow-x:visible">' + teamPills + '</div>' +
        '</div>'
      : '') +
    (tournamentValues.length > 1
      ? '<div class="share-sidebar-section">' +
          '<div class="share-sidebar-section-label">' + t('tournament_filter_all') + '</div>' +
          '<div class="season-selector" style="flex-wrap:wrap;overflow-x:visible">' +
            [{ key: 'all', label: t('tournament_filter_all') }]
              .concat(tournamentValues.map(function(v) { return { key: v, label: v === '' ? t('no_tournament') : v }; }))
              .map(function(p) {
                return '<button class="season-pill' + (_activeTournament === p.key ? ' active' : '') +
                  '" data-action="shareSetTournament" data-tournament="' + esc(p.key) + '">' + esc(p.label) + '</button>';
              }).join('') +
          '</div>' +
        '</div>'
      : '');

  var statsContent = '';
  if (_activeView === 'overview' && n === 0) {
    statsContent = '<div class="loading">' + t('no_matches_season') + '</div>';
  } else if (_activeView === 'overview') {
    var pct = function(v) { return Math.round((v / n) * 100); };
    statsContent =
      renderFormStreak(filtered) +
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-num lime">' + s.w + '</div><div class="stat-lbl">' + t('stat_wins') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num gold">' + s.d + '</div><div class="stat-lbl">' + t('stat_draws') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num danger">' + s.l + '</div><div class="stat-lbl">' + t('stat_losses') + '</div></div>' +
      '</div>' +
      '<div class="stat-row-card">' +
        '<div class="stat-row-title">' + t('match_dist') + ' \u2013 ' + n + ' ' + t('matches_short') + '</div>' +
        '<div class="wdl-bar">' +
          '<div class="wdl-seg w" style="width:' + pct(s.w) + '%"></div>' +
          '<div class="wdl-seg d" style="width:' + pct(s.d) + '%"></div>' +
          '<div class="wdl-seg l" style="width:' + pct(s.l) + '%"></div>' +
        '</div>' +
        '<div class="wdl-labels">' +
          '<span class="wdl-label" style="color:var(--lime)">' + pct(s.w) + '% ' + t('win_short') + '</span>' +
          '<span class="wdl-label" style="color:var(--gold)">' + pct(s.d) + '% ' + t('draw_short') + '</span>' +
          '<span class="wdl-label" style="color:var(--danger)">' + pct(s.l) + '% ' + t('loss_short') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-num lime">' + s.g + '</div><div class="stat-lbl">' + t('stat_goals') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num gold">' + s.a + '</div><div class="stat-lbl">' + t('stat_assists') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + (s.g + s.a) + '</div><div class="stat-lbl">G+A</div></div>' +
      '</div>' +
      '<div class="stat-row-card">' +
        '<div class="stat-row-title">' + t('avg_per_match') + '</div>' +
        '<div class="stat-row"><span class="stat-row-label">' + t('goals_per_match') + '</span><span class="stat-row-value">' + (s.g / n).toFixed(1) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + t('assist_per_match') + '</span><span class="stat-row-value">' + (s.a / n).toFixed(1) + '</span></div>' +
        '<div class="stat-row"><span class="stat-row-label">' + t('ga_per_match') + '</span><span class="stat-row-value">' + ((s.g + s.a) / n).toFixed(1) + '</span></div>' +
      '</div>' +
      renderHomeAwaySection(filtered) +
      renderTournamentSection(filtered) +
      '<div class="match-list-header">' + t('match_history') + '</div>' +
      renderMatchList(filtered, _matchPage);
  } else {
    // Analyse view — Chart.js charts
    statsContent = _renderAnalyse(filtered);
  }

  // View toggle
  var toggle =
    '<div class="form-section">' +
      '<div class="stats-view-toggle">' +
        '<button id="share-view-btn-overview" class="stats-view-btn' + (_activeView === 'overview' ? ' active' : '') +
          '" data-action="shareSetView" data-view="overview">' + t('stats_overview') + '</button>' +
        '<button id="share-view-btn-analyse" class="stats-view-btn' + (_activeView === 'analyse' ? ' active' : '') +
          '" data-action="shareSetView" data-view="analyse">' + t('stats_analyse') + '</button>' +
      '</div>' +
    '</div>';

  root.innerHTML =
    '<div class="share-desktop-layout">' +
      '<div class="share-sidebar">' +
        renderSidebarProfile(_profileCache) +
        sidebarFilters +
      '</div>' +
      '<div class="share-main">' +
        '<div class="stats-body">' +
          toggle +
          '<div id="share-stats-content">' + statsContent + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── Analyse view (adapted from stats-analyse.js) ──────────────────────────────

var _chartInstances = {};

function _destroyCharts() {
  Object.values(_chartInstances).forEach(function(c) { if (c) c.destroy(); });
  _chartInstances = {};
}

function _renderAnalyse(matches) {
  _destroyCharts();
  if (typeof Chart === 'undefined') return '<div class="loading">' + t('loading_charts') + '</div>';
  if (matches.length === 0) return '<div class="loading">' + t('no_matches_season') + '</div>';

  Chart.defaults.color = '#8a9a80';
  Chart.defaults.borderColor = 'rgba(168,224,99,0.08)';
  Chart.defaults.font.family = 'Barlow Condensed';

  return '<div class="chart-section">' +
           '<div class="chart-section-title">' + t('chart_win_pct') + '</div>' +
           '<div class="chart-section-desc">' + t('chart_win_pct_desc') + '</div>' +
           '<div id="share-chart-winpct-wrap" class="chart-wrap"><canvas id="share-chart-winpct"></canvas></div>' +
         '</div>' +
         '<div class="chart-section">' +
           '<div class="chart-section-title">' + t('chart_goals_assists') + '</div>' +
           '<div class="chart-section-desc">' + t('chart_ga_desc') + '</div>' +
           '<div id="share-chart-ga-wrap" class="chart-wrap"><canvas id="share-chart-ga"></canvas></div>' +
         '</div>';
}

function _initCharts(matches) {
  if (typeof Chart === 'undefined' || _activeView !== 'analyse') return;
  var sorted = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  // Cumulative win %
  var canvasWin = document.getElementById('share-chart-winpct');
  if (canvasWin && !_chartInstances.winpct) {
    var wins = 0;
    var labels = [], data = [];
    sorted.forEach(function(k, i) {
      if (getResult(k) === 'wins') wins++;
      labels.push(k.date || '');
      data.push(Math.round((wins / (i + 1)) * 100));
    });
    _chartInstances.winpct = new Chart(canvasWin, {
      type: 'line',
      data: { labels: labels, datasets: [{ label: t('chart_win_pct'), data: data, borderColor: '#a8e063', tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Goals + assists per match
  var canvasGA = document.getElementById('share-chart-ga');
  if (canvasGA && !_chartInstances.ga) {
    _chartInstances.ga = new Chart(canvasGA, {
      type: 'bar',
      data: {
        labels: sorted.map(function(k) { return k.date || ''; }),
        datasets: [
          { label: t('stat_goals'), data: sorted.map(function(k) { return k.goals || 0; }), backgroundColor: '#a8e063' },
          { label: t('stat_assists'), data: sorted.map(function(k) { return k.assists || 0; }), backgroundColor: '#f0c050' }
        ]
      },
      options: { responsive: true, scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } } }
    });
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

var _profileCache = null;

async function init() {
  var params = new URLSearchParams(window.location.search);
  var code   = params.get('code');

  if (!code) { showError(t('share_viewer_no_code')); return; }

  var root = document.getElementById('share-root');
  if (root) root.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  var profileData, matchData;
  try {
    var results = await Promise.all([fetchSharedProfile(code), fetchSharedMatches(code)]);
    profileData = results[0];
    matchData   = results[1];
  } catch(e) {
    showError(t('share_viewer_network_error'));
    return;
  }

  if (!profileData || matchData === null) {
    showError(t('share_viewer_invalid'));
    return;
  }

  _viewerLang = (profileData.lang === 'en') ? 'en' : 'no';
  initViewerLang(_viewerLang);

  _profileCache = profileData;
  _matches = matchData || [];
  _settings = {
    activeSeason:  profileData.active_season || String(new Date().getFullYear()),
    seasonFormat:  profileData.season_format || 'year',
    sport:         profileData.sport || 'football'
  };
  _activeSeason = _settings.activeSeason;

  renderStats();
}

// ── Event delegation (local to share viewer) ─────────────────────────────────

document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var action = el.dataset.action;

  if (action === 'shareSetSeason') {
    _activeSeason = el.dataset.season;
    _activeTeam = 'all'; _activeTournament = 'all'; _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetTeam') {
    _activeTeam = el.dataset.team;
    _activeTournament = 'all'; _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetTournament') {
    _activeTournament = el.dataset.tournament;
    _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetView') {
    _activeView = el.dataset.view;
    _matchPage = 0;
    _destroyCharts(); renderStats();
    // Init charts after DOM update
    if (_activeView === 'analyse') {
      var seasonMatches = _matches.filter(function(k) { return matchesSeason(k, _activeSeason); });
      var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeTeam); });
      var filtered = _activeTournament === 'all' ? teamMatches : teamMatches.filter(function(k) { return (k.tournament||'') === _activeTournament; });
      setTimeout(function() { _initCharts(filtered); }, 50);
    }
  } else if (action === 'shareSetPage') {
    _matchPage = parseInt(el.dataset.page, 10) || 0;
    renderStats();
  } else if (action === 'shareToggleLang') {
    var dropdown = el.closest('.lang-picker-wrap').querySelector('.lang-picker-dropdown');
    var isOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
    if (!isOpen) dropdown.classList.add('open');
  } else if (action === 'shareSetLang') {
    _viewerLang = el.dataset.lang === 'en' ? 'en' : 'no';
    initViewerLang(_viewerLang);
    _matchPage = 0;
    _destroyCharts(); renderStats();
  }
});

init();
