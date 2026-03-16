import { fetchKamper } from './supabase.js';
import { allMatches, setAllMatches } from './state.js';
import { getSettings } from './settings.js';
import { getProfile } from './profile.js';
import { t } from './i18n.js';
import { esc } from './utils.js';
import { isPremium } from './utils.js';

export var activeStatsView = 'overview';
export var activeLag = 'all';
export var activeSeason = getSettings().activeSeason || String(new Date().getFullYear());
export var matchPage = 0;
export var opponentSearch = '';

var PAGE_SIZE = 20;

export var CHART_COLORS = {
  lime:     '#a8e063',
  gold:     '#f0c050',
  danger:   '#e05555',
  muted:    '#8a9a80',
  card:     '#162b1a',
  border:   'rgba(168,224,99,0.15)',
  gridLine: 'rgba(168,224,99,0.08)'
};

var chartInstances = {};

export function destroyCharts() {
  Object.values(chartInstances).forEach(function(c) { if (c) c.destroy(); });
  chartInstances = {};
}

export function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = CHART_COLORS.muted;
  Chart.defaults.borderColor = CHART_COLORS.gridLine;
  Chart.defaults.font.family = 'Barlow Condensed';
}

export function switchStatsView(view) {
  activeStatsView = view;
  var btnOversikt = document.getElementById('stats-view-btn-overview');
  var btnAnalyse  = document.getElementById('stats-view-btn-analyse');
  if (btnOversikt) btnOversikt.classList.toggle('active', view === 'overview');
  if (btnAnalyse)  btnAnalyse.classList.toggle('active', view === 'analyse');
  var filters = document.getElementById('stats-filters');
  if (filters) filters.style.display = view === 'overview' ? '' : 'none';
  renderStats();
}

function fmtDate(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString(getSettings().lang === 'en' ? 'en-GB' : 'no-NO', opts);
}

export async function loadStats(forceRefresh) {
  if (!forceRefresh && allMatches.length > 0) {
    renderStats(); return;
  }
  var el = document.getElementById('stats-content');
  if (el) el.innerHTML = '<div class="loading"><div class="spinner"></div>' + t('loading_stats') + '</div>';
  try {
    var data = await fetchKamper();
    setAllMatches(data);
    renderStats();
  } catch(e) {
    if (el) el.innerHTML = '<div class="loading">' + t('load_error') + '</div>';
  }
}

function getSeasons() {
  var years = [];
  allMatches.forEach(function(k) {
    var y = k.date.substring(0, 4);
    if (!years.includes(y)) years.push(y);
  });
  years.sort();
  return years.length ? years : ['2025'];
}

export function getResult(k) {
  if (k.match_type === 'home') return k.home_score > k.away_score ? 'wins' : k.home_score < k.away_score ? 'loss' : 'draw';
  return k.away_score > k.home_score ? 'wins' : k.away_score < k.home_score ? 'loss' : 'draw';
}

export function calcWDL(matchArr) {
  var w = 0, d = 0, l = 0, g = 0, a = 0;
  matchArr.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.goals || 0; a += k.assists || 0;
  });
  return { w: w, d: d, l: l, g: g, a: a, n: matchArr.length };
}

function renderMatchList(matches) {
  return matches.map(function(k) {
    var r = getResult(k);
    var resIkon = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    var date = fmtDate(k.date, { day: '2-digit', month: 'short' });
    var team = k.own_team || '';
    var tournament = k.tournament ? ' \xb7 ' + esc(k.tournament) : '';
    var goalText = (k.goals || 0) > 0
      ? ' \xb7 ' + k.goals + String.fromCodePoint(9917) + ((k.assists || 0) > 0 ? ' ' + k.assists + String.fromCodePoint(127919) : '')
      : '';
    return '<div class="match-item" data-action="openEditModal" data-id="' + k.id + '">' +
      '<div class="match-result ' + r + '">' + resIkon + '</div>' +
      '<div class="match-info">' +
        '<div class="match-title-row">' +
          '<div class="match-opponent">' + esc(k.opponent) + '</div>' +
          (team ? '<div class="match-team-name">\xb7 ' + esc(team) + '</div>' : '') +
        '</div>' +
        '<div class="match-meta">' + date + tournament + goalText + '</div>' +
      '</div>' +
      '<div class="match-score">' + k.home_score + '\u2013' + k.away_score + '</div>' +
      '<div class="match-edit-icon">\u270F\uFE0F</div>' +
    '</div>';
  }).join('');
}

function renderMatchListPaged(matches) {
  var total = matches.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (matchPage >= totalPages) matchPage = totalPages - 1;
  var start = matchPage * PAGE_SIZE;
  var pageMatches = matches.slice(start, start + PAGE_SIZE);
  var html = renderMatchList(pageMatches);
  if (totalPages > 1) {
    var from = start + 1;
    var to = Math.min(start + PAGE_SIZE, total);
    html += '<div class="pagination">' +
      '<button class="page-btn" data-action="setMatchPage" data-page="' + (matchPage - 1) + '" ' + (matchPage === 0 ? 'disabled' : '') + '>' + t('page_prev') + '</button>' +
      '<span class="page-info">' + from + '\u2013' + to + ' ' + t('page_of') + ' ' + total + '</span>' +
      '<button class="page-btn" data-action="setMatchPage" data-page="' + (matchPage + 1) + '" ' + (matchPage >= totalPages - 1 ? 'disabled' : '') + '>' + t('page_next') + '</button>' +
    '</div>';
  }
  return html;
}

export function setMatchPage(page) {
  matchPage = page;
  var statsContent = document.getElementById('stats-content');
  if (!statsContent) return;
  if (opponentSearch) { renderOpponentSearchResults(statsContent); return; }
  var header = statsContent.querySelector('.match-list-header');
  if (!header) { renderStats(); return; }
  var seasonMatches = allMatches.filter(function(k) { return k.date.startsWith(activeSeason); });
  var matches = activeLag === 'all' ? seasonMatches : seasonMatches.filter(function(k) { return k.own_team === activeLag; });
  var toRemove = [];
  var node = header.nextSibling;
  while (node) { toRemove.push(node); node = node.nextSibling; }
  toRemove.forEach(function(n) { n.parentNode.removeChild(n); });
  var temp = document.createElement('div');
  temp.innerHTML = renderMatchListPaged(matches);
  while (temp.firstChild) { statsContent.appendChild(temp.firstChild); }
  header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function setSeason(s) { activeSeason = s; activeLag = 'all'; matchPage = 0; opponentSearch = ''; renderStats(); }
export function setTeamFilter(team) { activeLag = team; matchPage = 0; opponentSearch = ''; renderStats(); }

export function setOpponentSearch(val) {
  opponentSearch = val.trim().toLowerCase();
  matchPage = 0;
  var statsContent = document.getElementById('stats-content');
  if (!statsContent) return;
  if (opponentSearch) {
    renderOpponentSearchResults(statsContent);
  } else {
    renderStats();
  }
}

function renderOpponentSearchResults(container) {
  var query = opponentSearch;
  var pool = activeLag === 'all' ? allMatches : allMatches.filter(function(k) { return k.own_team === activeLag; });
  var hits = pool.filter(function(k) { return (k.opponent || '').toLowerCase().includes(query); });

  var oppMap = {};
  hits.forEach(function(k) {
    var name = k.opponent || '\u2014';
    if (!oppMap[name]) oppMap[name] = [];
    oppMap[name].push(k);
  });
  var opponents = Object.keys(oppMap).sort();

  var summaryHTML = '';
  if (hits.length === 0) {
    summaryHTML = '<div class="loading" style="padding:20px 0">' + t('no_match_vs') + ' &quot;' + esc(query) + '&quot;</div>';
  } else {
    summaryHTML = opponents.map(function(opp) {
      var s = calcWDL(oppMap[opp]);
      return '<div class="opponent-search-row">' +
        '<div class="opponent-search-name">' + esc(opp) + ' <span class="opponent-search-count">(' + s.n + ')</span></div>' +
        '<div class="opponent-search-badges">' +
          '<span class="t-badge win">' + s.w + t('win_short') + '</span>' +
          '<span class="t-badge draw">' + s.d + t('draw_short') + '</span>' +
          '<span class="t-badge loss">' + s.l + t('loss_short') + '</span>' +
          '<span class="tournament-wdl-sep"></span>' +
          '<span class="t-badge goals">\u26BD' + s.g + '</span>' +
          '<span class="t-badge assist">\u{1F3AF}' + s.a + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
    summaryHTML = '<div class="stat-row-card" style="margin-bottom:8px">' +
      '<div class="stat-row-title">' + t('opponent_search_title') + ' \u2013 ' + hits.length + ' ' + t('matches_short') + '</div>' +
      summaryHTML +
    '</div>';
    summaryHTML += '<div class="match-list-header">' + t('match_history') + '</div>' + renderMatchListPaged(hits);
  }

  var searchWrap = container.querySelector('.opponent-search-wrap');
  if (searchWrap) {
    var toRemove = [];
    var node = searchWrap.nextSibling;
    while (node) { toRemove.push(node); node = node.nextSibling; }
    toRemove.forEach(function(n) { n.parentNode.removeChild(n); });
    var temp = document.createElement('div');
    temp.innerHTML = summaryHTML;
    while (temp.firstChild) { container.appendChild(temp.firstChild); }
  } else {
    renderStats();
  }
}

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
    rows +
  '</div>';
}

export function renderStats() {
  destroyCharts();

  var seasons = getSeasons();
  if (!seasons.includes(activeSeason)) activeSeason = seasons[0];

  var filtersDiv = document.getElementById('stats-filters');
  if (filtersDiv) filtersDiv.style.display = activeStatsView === 'overview' ? '' : 'none';

  document.getElementById('season-selector').innerHTML = seasons.map(function(s) {
    return '<button class="season-pill ' + (s === activeSeason ? 'active' : '') + '" data-action="setSeason" data-season="' + s + '">' + s + '</button>';
  }).join('');

  var seasonMatches = allMatches.filter(function(k) { return k.date.startsWith(activeSeason); });
  var profileTeams = getProfile().team || [];
  if (!activeLag || (!profileTeams.includes(activeLag) && activeLag !== 'all')) activeLag = 'all';
  var teamPills = [{ key: 'all', label: t('alle_lag') }].concat(profileTeams.map(function(l) { return { key: l, label: l }; }));
  document.getElementById('team-filter-selector').innerHTML = teamPills.map(function(p) {
    return '<button class="season-pill ' + (activeLag === p.key ? 'active' : '') + '" data-action="setTeamFilter" data-team="' + esc(p.key) + '"> ' + esc(p.label) + '</button>';
  }).join('');

  var matches = activeLag === 'all' ? seasonMatches : seasonMatches.filter(function(k) { return k.own_team === activeLag; });
  var n = matches.length;
  var teamText = activeLag === 'all' ? t('all_teams_subtitle') : activeLag;
  var statsSubEl = document.getElementById('stats-sub');
  if (statsSubEl) statsSubEl.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;

  if (activeStatsView === 'analyse') {
    renderAnalyse(matches);
    return;
  }

  var statsContent = document.getElementById('stats-content');
  if (!statsContent) return;

  if (n === 0) {
    statsContent.innerHTML = '<div class="loading">' + t('no_matches_season') + '</div>';
    return;
  }

  var s = calcWDL(matches);
  var pct = function(v) { return Math.round((v / n) * 100); };

  statsContent.innerHTML =
    renderFormStreak(matches) +
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
    renderHomeAwaySection(matches) +
    renderTournamentSection(matches) +
    '<div class="opponent-search-wrap">' +
      '<div class="match-list-header" style="margin-bottom:8px">' + t('match_history') + '</div>' +
      '<div class="opponent-search-field-wrap">' +
        '<span class="opponent-search-icon">\u{1F50D}</span>' +
        '<input type="text" id="opponent-search-input" class="opponent-search-input" placeholder="' + t('opponent_search_ph') + '" value="' + esc(opponentSearch) + '" data-action="setOpponentSearch" />' +
        (opponentSearch ? '<button class="opponent-search-clear" data-action="clearOpponentSearch">\u2715</button>' : '') +
      '</div>' +
    '</div>' +
    renderMatchListPaged(matches);
}

export function renderAnalyse(matches) {
  destroyCharts();
  initChartDefaults();

  var container = document.getElementById('stats-content');
  if (!container) return;

  var asc = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  var seasons = getSeasons();
  var profileTeams = getProfile().team || [];
  var teamPills = [{ key: 'all', label: t('alle_lag') }].concat(profileTeams.map(function(l) { return { key: l, label: l }; }));

  var selectorHTML =
    '<div class="form-section" style="margin-bottom:8px">' +
      '<div class="season-selector">' +
        seasons.map(function(s) {
          return '<button class="season-pill ' + (s === activeSeason ? 'active' : '') + '" data-action="setSeason" data-season="' + s + '">' + s + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="form-section" style="margin-bottom:12px">' +
      '<div class="season-selector">' +
        teamPills.map(function(p) {
          return '<button class="season-pill ' + (activeLag === p.key ? 'active' : '') + '" data-action="setTeamFilter" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  var n = matches.length;
  var teamText = activeLag === 'all' ? t('all_teams_subtitle') : activeLag;
  var statsSubEl2 = document.getElementById('stats-sub');
  if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;

  if (!isPremium()) {
    container.innerHTML = selectorHTML + renderFormStreak(matches) +
      '<div class="chart-locked">' +
        '<div class="chart-card" style="filter:blur(3px);pointer-events:none">' +
          '<div class="chart-card-title">' + t('chart_win_pct') + '</div>' +
          '<div class="chart-canvas-wrap" style="height:160px;background:rgba(168,224,99,0.04);border-radius:8px"></div>' +
        '</div>' +
        '<div class="chart-locked-overlay">' +
          '<div class="chart-locked-icon">\u{1F512}</div>' +
          '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
          '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
          '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
        '</div>' +
      '</div>';
    return;
  }

  if (n === 0) {
    container.innerHTML = selectorHTML + '<div class="loading">' + t('no_matches_season') + '</div>';
    return;
  }

  container.innerHTML = selectorHTML +
    renderFormStreak(matches) +
    '<div class="chart-card" id="chart-card-winpct">' +
      '<div class="chart-card-title">' + t('chart_win_pct') + '</div>' +
      '<div class="chart-canvas-wrap"><canvas id="chart-winpct" height="180"></canvas></div>' +
    '</div>' +
    '<div class="chart-card" id="chart-card-goals">' +
      '<div class="chart-card-title">' + t('chart_goals_assists') + '</div>' +
      '<div class="chart-canvas-wrap"><canvas id="chart-goals" height="180"></canvas></div>' +
    '</div>' +
    '<div class="chart-card" id="chart-card-tournament">' +
      '<div class="chart-card-title">' + t('chart_goals_tourn') + '</div>' +
      '<div class="chart-canvas-wrap" id="chart-tournament-wrap"><canvas id="chart-tournament"></canvas></div>' +
    '</div>';

  if (typeof Chart === 'undefined') {
    container.querySelectorAll('.chart-canvas-wrap').forEach(function(el) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">' + t('loading_charts') + '</div>';
    });
    return;
  }

  var labels1 = [], winPctData = [], wins1 = 0;
  asc.forEach(function(k, i) {
    if (getResult(k) === 'wins') wins1++;
    labels1.push(fmtDate(k.date, { day: '2-digit', month: 'short' }));
    winPctData.push(Math.round((wins1 / (i + 1)) * 100));
  });
  chartInstances['winpct'] = new Chart(document.getElementById('chart-winpct'), {
    type: 'line',
    data: { labels: labels1, datasets: [{ label: t('chart_win_pct'), data: winPctData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(168,224,99,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.3 }] },
    options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return ctx.parsed.y + '%'; } } } }, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { min: 0, max: 100, ticks: { callback: function(v) { return v + '%'; }, stepSize: 25, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } } } }
  });

  var labels2 = [], goalData = [], assistData = [];
  asc.forEach(function(k) {
    labels2.push(fmtDate(k.date, { day: '2-digit', month: 'short' }));
    goalData.push(k.goals || 0);
    assistData.push(k.assists || 0);
  });
  chartInstances['goals'] = new Chart(document.getElementById('chart-goals'), {
    type: 'line',
    data: { labels: labels2, datasets: [{ label: t('stat_goals'), data: goalData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(168,224,99,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.2 }, { label: t('stat_assists'), data: assistData, borderColor: CHART_COLORS.gold, backgroundColor: 'rgba(240,192,80,0.06)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.gold, fill: true, tension: 0.2 }] },
    options: { responsive: true, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Barlow Condensed', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { min: 0, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } } } }
  });

  var tournMap = {};
  matches.forEach(function(k) {
    var tn = k.tournament || '\u2014';
    if (!tournMap[tn]) tournMap[tn] = { g: 0, a: 0 };
    tournMap[tn].g += k.goals   || 0;
    tournMap[tn].a += k.assists || 0;
  });
  var tournKeys = Object.keys(tournMap).sort(function(a, b) { return tournMap[b].g - tournMap[a].g; });
  var barHeight = Math.max(120, tournKeys.length * 44);
  document.getElementById('chart-tournament-wrap').style.height = barHeight + 'px';
  chartInstances['tournament'] = new Chart(document.getElementById('chart-tournament'), {
    type: 'bar',
    data: { labels: tournKeys, datasets: [{ label: t('stat_goals'), data: tournKeys.map(function(k) { return tournMap[k].g; }), backgroundColor: 'rgba(168,224,99,0.6)', borderColor: CHART_COLORS.lime, borderWidth: 1, borderRadius: 4 }, { label: t('stat_assists'), data: tournKeys.map(function(k) { return tournMap[k].a; }), backgroundColor: 'rgba(240,192,80,0.5)', borderColor: CHART_COLORS.gold, borderWidth: 1, borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Barlow Condensed', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { ticks: { font: { size: 11 } }, grid: { display: false } } } }
  });
}
