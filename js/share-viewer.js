import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { esc, getResult } from './utils.js';
import { t, initViewerLang } from './i18n.js';

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
var _activeLang        = 'all';
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
  var start = page * PAGE_SIZE;
  var slice = matches.slice(start, start + PAGE_SIZE);
  var total = matches.length;
  var pageCount = Math.ceil(total / PAGE_SIZE);

  if (slice.length === 0) return '<div class="loading">' + t('no_matches_yet') + '</div>';

  var rows = slice.map(function(k) {
    var r = getResult(k);
    return '<div class="match-row">' +
      '<div class="match-row-date">' + esc(k.date || '') + '</div>' +
      '<div class="match-row-opponent">' + esc(k.opponent || '') + '</div>' +
      '<div class="match-row-score">' + k.home_score + '–' + k.away_score + '</div>' +
      '<div class="result-auto ' + r + '">' +
        (r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short')) +
      '</div>' +
    '</div>';
  }).join('');

  var pagination = pageCount > 1
    ? '<div class="pagination">' +
        (page > 0 ? '<button data-action="shareSetPage" data-page="' + (page - 1) + '">' + t('page_prev') + '</button>' : '') +
        '<span>' + (page + 1) + ' ' + t('page_of') + ' ' + pageCount + '</span>' +
        (page < pageCount - 1 ? '<button data-action="shareSetPage" data-page="' + (page + 1) + '">' + t('page_next') + '</button>' : '') +
      '</div>'
    : '';

  return rows + pagination;
}

// ── Profile card ─────────────────────────────────────────────────────────────

function renderProfileCard(profile) {
  var avatarHtml = profile.avatar_url
    ? '<img src="' + esc(profile.avatar_url) + '" class="share-avatar" alt="avatar">'
    : '<div class="share-avatar share-avatar-placeholder"></div>';

  var favoriteTeam = (profile.favorite_team || '').trim();

  return '<div class="share-profile-card">' +
    avatarHtml +
    '<div class="share-profile-info">' +
      '<div class="share-profile-name">' + esc(profile.name || '') + '</div>' +
      '<div class="share-profile-club">' + esc(profile.club || '') + '</div>' +
      (favoriteTeam ? '<div class="share-profile-team">' + esc(favoriteTeam) + '</div>' : '') +
    '</div>' +
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

  var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeLang); });
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
      return '<button class="season-pill' + (_activeLang === p.key ? ' active' : '') +
        '" data-action="shareSetTeam" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
    }).join('');

  // Tournament pills (only if >1)
  var tournamentPillsHtml = '';
  if (tournamentValues.length > 1) {
    var tournamentPills = [{ key: 'all', label: t('tournament_filter_all') }]
      .concat(tournamentValues.map(function(v) {
        return { key: v, label: v === '' ? t('no_tournament') : v };
      }))
      .map(function(p) {
        return '<button class="season-pill' + (_activeTournament === p.key ? ' active' : '') +
          '" data-action="shareSetTournament" data-tournament="' + esc(p.key) + '">' + esc(p.label) + '</button>';
      }).join('');
    tournamentPillsHtml = '<div class="stats-filters-row">' + tournamentPills + '</div>';
  }

  // View toggle
  var toggle = '<div class="stats-view-toggle">' +
    '<button id="share-view-btn-overview" class="view-toggle-btn' + (_activeView === 'overview' ? ' active' : '') +
      '" data-action="shareSetView" data-view="overview">' + t('stats_overview') + '</button>' +
    '<button id="share-view-btn-analyse" class="view-toggle-btn' + (_activeView === 'analyse' ? ' active' : '') +
      '" data-action="shareSetView" data-view="analyse">' + t('stats_analyse') + '</button>' +
  '</div>';

  var statsContent = '';
  if (_activeView === 'overview' && n === 0) {
    statsContent = '<div class="loading">' + t('no_matches_season') + '</div>';
  } else if (_activeView === 'overview') {
    var pct = function(v) { return Math.round((v / n) * 100); };
    statsContent =
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-num lime">' + s.w + '</div><div class="stat-lbl">' + t('stat_wins') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num gold">' + s.d + '</div><div class="stat-lbl">' + t('stat_draws') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num danger">' + s.l + '</div><div class="stat-lbl">' + t('stat_losses') + '</div></div>' +
      '</div>' +
      '<div class="stat-row-card">' +
        '<div class="stat-row-title">' + t('match_dist') + ' – ' + n + ' ' + t('matches_short') + '</div>' +
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
      '<div class="match-list-header">' + t('match_history') + '</div>' +
      renderMatchList(filtered, _matchPage);
  } else {
    // Analyse view — Chart.js charts
    statsContent = _renderAnalyse(filtered);
  }

  root.innerHTML =
    renderProfileCard(_profileCache) +
    '<div class="share-viewer-content">' +
      toggle +
      '<div class="stats-filters" id="share-filters">' +
        '<div class="stats-filters-row" id="share-season-selector">' + seasonPills + '</div>' +
        (teamValues.length > 0 ? '<div class="stats-filters-row">' + teamPills + '</div>' : '') +
        tournamentPillsHtml +
      '</div>' +
      '<div id="share-stats-content">' + statsContent + '</div>' +
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

  return '<div id="share-chart-winpct-wrap" class="chart-wrap"><canvas id="share-chart-winpct"></canvas></div>' +
         '<div id="share-chart-ga-wrap" class="chart-wrap"><canvas id="share-chart-ga"></canvas></div>';
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

  initViewerLang(profileData.lang);

  _profileCache = profileData;
  _matches = matchData || [];
  _settings = {
    activeSeason:  profileData.active_season || String(new Date().getFullYear()),
    seasonFormat:  profileData.season_format || 'aar',
    sport:         profileData.sport || 'fotball'
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
    _activeLang = 'all'; _activeTournament = 'all'; _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetTeam') {
    _activeLang = el.dataset.team;
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
      var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeLang); });
      var filtered = _activeTournament === 'all' ? teamMatches : teamMatches.filter(function(k) { return (k.tournament||'') === _activeTournament; });
      setTimeout(function() { _initCharts(filtered); }, 50);
    }
  } else if (action === 'shareSetPage') {
    _matchPage = parseInt(el.dataset.page, 10) || 0;
    renderStats();
  }
});

init();
