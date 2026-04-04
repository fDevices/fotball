import { fetchMatches } from './supabase.js';
import { getAllMatches, setAllMatches } from './state.js';
import { getSettings, getAllSeasons, getDateLocale } from './settings.js';
import { getProfile } from './profile.js';
import { t } from './i18n.js';
import { esc, getResult, isDevPremium } from './utils.js';
import { renderAnalyse, destroyCharts, renderFormStreak } from './stats-analyse.js';
import { renderMatchListPaged } from './stats-search.js';

export var activeStatsView = 'overview';
export var activeLag = 'all';
export var activeSeason = getSettings().activeSeason || String(new Date().getFullYear());
export var activeTournament = 'all';
export var matchPage = 0;
export var opponentSearch = '';
var h2hSearch = '';

function matchesTeamFilter(k, lag) {
  if (lag === 'all') return true;
  var stored = (k.own_team || '').toLowerCase();
  var filter = lag.toLowerCase();
  return stored === filter || stored.endsWith(' ' + filter);
}

function matchesSeason(k, season) {
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var year = parseInt((k.date || '').slice(0, 4), 10);
  // Split-season format (e.g. 2025–2026): include both years
  if (/[–\-]/.test(season)) return year === base || year === base + 1;
  // Single-year format: direct startsWith match
  return (k.date || '').startsWith(season);
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

function renderMonthlyBreakdown(matches) {
  var monthMap = {};
  matches.forEach(function(k) {
    var ym = (k.date || '').slice(0, 7);
    if (!ym) return;
    if (!monthMap[ym]) monthMap[ym] = [];
    monthMap[ym].push(k);
  });

  var keys = Object.keys(monthMap).sort();
  if (!keys.length) return '';

  var multiYear = new Set(matches.map(function(k) { return (k.date || '').slice(0, 4); })).size > 1;

  function monthLabel(ym) {
    var d = new Date(ym + '-02');
    var mon = d.toLocaleDateString(getDateLocale(), { month: 'short' });
    if (multiYear) {
      var yr = String(d.getFullYear()).slice(2);
      return mon + ' ' + yr;
    }
    return mon;
  }

  var rows = keys.map(function(ym) {
    var s = calcWDL(monthMap[ym]);
    return '<div class="tournament-stat-row">' +
      '<div class="tournament-stat-name">' + monthLabel(ym) + ' <span style="color:var(--muted);font-size:12px;font-weight:400">(' + s.n + ' ' + t('matches_short') + ')</span></div>' +
      '<div class="tournament-stat-badges">' +
        '<span class="t-badge win">' + s.w + t('win_short') + '</span>' +
        '<span class="t-badge draw">' + s.d + t('draw_short') + '</span>' +
        '<span class="t-badge loss">' + s.l + t('loss_short') + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  var inner = '<div class="stat-row-card" style="margin-bottom:8px">' +
    '<div class="stat-row-title">' + t('monthly_title') + '</div>' +
    rows +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}

function renderHeadToHead(matches) {
  var oppMap = {};
  matches.forEach(function(k) {
    var name = k.opponent || '\u2014';
    if (!oppMap[name]) oppMap[name] = [];
    oppMap[name].push(k);
  });

  var totalOpponents = Object.keys(oppMap).length;

  var opponents = Object.keys(oppMap).sort(function(a, b) {
    var diff = oppMap[b].length - oppMap[a].length;
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  var inner;

  if (!h2hSearch) {
    // Empty state: just the search input + count hint
    inner = '<div class="stat-row-card">' +
      '<div class="stat-row-title">' + t('h2h_title') + '</div>' +
      '<input id="h2h-search-input" type="text" class="opponent-search-input" style="width:100%;box-sizing:border-box" placeholder="' + t('h2h_search_placeholder') + '" value="">' +
      '<div style="text-align:center;color:var(--muted);font-size:10px;margin-top:5px">' +
        t('h2h_matches_count').replace('{n}', totalOpponents) +
      '</div>' +
    '</div>';
  } else {
    var query = h2hSearch.toLowerCase();
    var matched = opponents.filter(function(opp) {
      return opp.toLowerCase().includes(query);
    });

    var resultHTML;
    if (!matched.length) {
      resultHTML = '<div style="text-align:center;color:var(--muted);font-size:11px;margin-top:8px">' + t('h2h_no_match') + '</div>';
    } else {
      var top = matched[0];
      var ms = oppMap[top];
      var total = ms.length;
      var w = 0, d = 0, l = 0, gf = 0, ga = 0;
      ms.forEach(function(k) {
        var res = getResult(k);
        if (res === 'wins') w++;
        else if (res === 'draw') d++;
        else l++;
        gf += k.match_type === 'home' ? (k.home_score || 0) : (k.away_score || 0);
        ga += k.match_type === 'home' ? (k.away_score || 0) : (k.home_score || 0);
      });
      var pctW = Math.round((w / total) * 100);
      var pctD = Math.round((d / total) * 100);
      var pctL = 100 - pctW - pctD;
      var moreHTML = matched.length > 1
        ? '<div style="color:var(--muted);font-size:10px;margin-top:4px">+ ' + (matched.length - 1) + ' ' + t('h2h_more_opponents') + '</div>'
        : '';
      resultHTML =
        '<div style="background:rgba(168,224,99,0.06);border-radius:8px;padding:9px 10px;margin-top:8px">' +
          '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">' +
            esc(top) + ' <span style="color:var(--muted);font-size:10px;font-weight:400">· ' + total + ' ' + t('matches_short') + '</span>' +
          '</div>' +
          '<div class="wdl-bar" style="height:5px;margin-bottom:4px">' +
            '<div class="wdl-seg w" style="width:' + pctW + '%"></div>' +
            '<div class="wdl-seg d" style="width:' + pctD + '%"></div>' +
            '<div class="wdl-seg l" style="width:' + pctL + '%"></div>' +
          '</div>' +
          '<div class="stat-row"><span class="stat-row-label">' + t('stat_wins') + '</span><span class="stat-row-value" style="color:var(--lime)">' + w + '</span></div>' +
          '<div class="stat-row"><span class="stat-row-label">' + t('stat_draws') + '</span><span class="stat-row-value" style="color:var(--gold)">' + d + '</span></div>' +
          '<div class="stat-row"><span class="stat-row-label">' + t('stat_losses') + '</span><span class="stat-row-value" style="color:var(--danger)">' + l + '</span></div>' +
          '<div style="border-top:1px solid rgba(168,224,99,0.08);margin:6px 0 4px"></div>' +
          '<div class="stat-row"><span class="stat-row-label">' + t('stat_goals') + '</span><span class="stat-row-value" style="color:var(--lime)">' + gf + '</span></div>' +
          '<div class="stat-row"><span class="stat-row-label">' + t('h2h_goals_conceded') + '</span><span class="stat-row-value" style="color:var(--danger)">' + ga + '</span></div>' +
        '</div>' +
        moreHTML;
    }

    inner = '<div class="stat-row-card">' +
      '<div class="stat-row-title">' + t('h2h_title') + '</div>' +
      '<input id="h2h-search-input" type="text" class="opponent-search-input" style="width:100%;box-sizing:border-box" placeholder="' + t('h2h_search_placeholder') + '" value="' + esc(h2hSearch) + '">' +
      resultHTML +
    '</div>';
  }

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}

function calcStreaks(matches) {
  var sorted = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });
  var n = sorted.length;

  var currentStreak = 0;
  for (var i = n - 1; i >= 0; i--) {
    if ((sorted[i].goals || 0) > 0) currentStreak++;
    else break;
  }

  var bestStreak = 0, runStreak = 0;
  var bestDrought = 0, runDrought = 0;
  for (var j = 0; j < n; j++) {
    if ((sorted[j].goals || 0) > 0) {
      runStreak++;
      runDrought = 0;
    } else {
      runDrought++;
      runStreak = 0;
    }
    if (runStreak > bestStreak) bestStreak = runStreak;
    if (runDrought > bestDrought) bestDrought = runDrought;
  }

  var scoringCount = sorted.filter(function(k) { return (k.goals || 0) > 0; }).length;
  var scoringPct = n > 0 ? Math.round((scoringCount / n) * 100) : 0;

  return { currentStreak: currentStreak, bestStreak: bestStreak, bestDrought: bestDrought, scoringPct: scoringPct };
}

function renderScoringStreaks(matches) {
  var s = calcStreaks(matches);

  var inner = '<div class="stat-row-card">' +
    '<div class="stat-row-title">' + t('scoring_streaks_title') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">' +
      '<div style="background:rgba(168,224,99,0.06);border-radius:8px;padding:8px;text-align:center">' +
        '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:4px">' + t('streak_current') + '</div>' +
        '<div style="font-size:24px;font-weight:800;color:var(--lime);line-height:1">' + s.currentStreak + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + t('streak_matches') + '</div>' +
      '</div>' +
      '<div style="background:rgba(240,192,80,0.06);border-radius:8px;padding:8px;text-align:center">' +
        '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:4px">' + t('streak_best') + '</div>' +
        '<div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1">' + s.bestStreak + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + t('streak_matches') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="stat-row"><span class="stat-row-label">' + t('streak_drought') + '</span><span class="stat-row-value" style="color:var(--danger)">' + s.bestDrought + ' ' + t('streak_drought_matches') + '</span></div>' +
    '<div class="stat-row"><span class="stat-row-label">' + t('streak_scoring_pct') + '</span><span class="stat-row-value" style="color:var(--lime)">' + s.scoringPct + '%</span></div>' +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}

function renderPerformanceProfile(matches) {
  var dims = [
    { key: 'cat_effort',    field: 'rating_effort' },
    { key: 'cat_focus',     field: 'rating_focus' },
    { key: 'cat_technique', field: 'rating_technique' },
    { key: 'cat_team_play', field: 'rating_team_play' },
    { key: 'cat_impact',    field: 'rating_impact' },
    { key: 'cat_overall',   field: 'rating_overall' }
  ];

  function avgField(field) {
    var vals = matches.map(function(k) { return k[field]; }).filter(function(v) { return v != null; });
    if (!vals.length) return null;
    return vals.reduce(function(s, v) { return s + v; }, 0) / vals.length;
  }

  function barColor(avg) {
    if (avg >= 4.0) return 'var(--lime)';
    if (avg >= 3.0) return 'var(--gold)';
    return 'var(--danger)';
  }

  function barWidth(avg) {
    return Math.min(100, Math.max(20, ((avg - 1) / 4) * 80 + 20));
  }

  var rows = dims.map(function(d) {
    var avg = avgField(d.field);
    if (avg === null) return '';
    var color = barColor(avg);
    var width = barWidth(avg);
    return '<div class="rating-avg-row">' +
      '<span class="rating-avg-label">' + t(d.key) + '</span>' +
      '<div class="rating-avg-bar-wrap"><div class="rating-avg-bar" style="width:' + width + '%;background:' + color + '"></div></div>' +
      '<span class="rating-avg-val" style="color:' + color + '">' + avg.toFixed(1) + '</span>' +
    '</div>';
  }).join('');

  var hasAnyRating = dims.some(function(d) { return avgField(d.field) !== null; });

  var inner = '<div class="stat-row-card">' +
    '<div class="stat-row-title">' + t('perf_profile_title') + '</div>' +
    (rows || '<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0">\u2014</div>') +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  if (!hasAnyRating) return '';
  return inner;
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

function renderOpponentSearchResults(container) {
  var query = opponentSearch;
  var pool = getAllMatches().filter(function(k) { return matchesTeamFilter(k, activeLag); });
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
    summaryHTML += '<div class="match-list-header">' + t('match_history') + '</div>' + renderMatchListPaged(hits, matchPage);
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

export function switchStatsView(view) {
  activeStatsView = view;
  var btnOversikt = document.getElementById('stats-view-btn-overview');
  var btnAnalyse  = document.getElementById('stats-view-btn-analyse');
  if (btnOversikt) btnOversikt.classList.toggle('active', view === 'overview');
  if (btnAnalyse)  btnAnalyse.classList.toggle('active', view === 'analyse');
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  var filters = document.getElementById('stats-filters');
  if (filters && !isDesktop) filters.style.display = view === 'overview' ? '' : 'none';
  renderStats();
}

export async function loadStats(forceRefresh) {
  if (!forceRefresh && getAllMatches().length > 0) {
    renderStats(); return;
  }
  var el = document.getElementById('stats-content');
  if (el) el.innerHTML = '<div class="loading"><div class="spinner"></div>' + t('loading_stats') + '</div>';
  try {
    var data = await fetchMatches();
    setAllMatches(data);
    renderStats();
  } catch(e) {
    if (el) el.innerHTML = '<div class="loading">' + t('load_error') + '</div>';
  }
}

export function renderStats() {
  destroyCharts();
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;

  var seasons = getAllSeasons(getAllMatches());
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  if (!seasons.includes(activeSeason)) activeSeason = seasons[0];

  var statsHeading = document.getElementById('stats-heading');
  if (statsHeading) statsHeading.firstChild.textContent = t('stats_season_label');
  var statsHeadingSeason = document.getElementById('stats-heading-season');
  if (statsHeadingSeason) statsHeadingSeason.textContent = ' ' + activeSeason;

  var filtersDiv = document.getElementById('stats-filters');
  if (filtersDiv) filtersDiv.style.display = (isDesktop || activeStatsView === 'overview') ? '' : 'none';

  document.getElementById('season-selector').innerHTML = seasons.map(function(s) {
    return '<button class="season-pill ' + (s === activeSeason ? 'active' : '') + '" data-action="setSeason" data-season="' + s + '">' + s + '</button>';
  }).join('');

  var seasonMatches = getAllMatches().filter(function(k) { return matchesSeason(k, activeSeason); });
  var profileTeams = getProfile().teams || [];
  if (!activeLag || (!profileTeams.includes(activeLag) && activeLag !== 'all')) activeLag = 'all';
  var teamPills = [{ key: 'all', label: t('alle_lag') }].concat(profileTeams.map(function(l) { return { key: l, label: l }; }));
  document.getElementById('team-filter-selector').innerHTML = teamPills.map(function(p) {
    return '<button class="season-pill ' + (activeLag === p.key ? 'active' : '') + '" data-action="setTeamFilter" data-team="' + esc(p.key) + '"> ' + esc(p.label) + '</button>';
  }).join('');

  var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, activeLag); });

  // Build tournament pills from teamMatches
  var tournamentValues = [];
  teamMatches.forEach(function(k) { var v = k.tournament || ''; if (!tournamentValues.includes(v)) tournamentValues.push(v); });
  tournamentValues.sort(function(a, b) { if (!a) return 1; if (!b) return -1; return a.localeCompare(b); });
  var tournamentFilterEl = document.getElementById('tournament-filter-selector');
  if (tournamentFilterEl) {
    if (tournamentValues.length <= 1) {
      tournamentFilterEl.innerHTML = '';
      if (activeTournament !== 'all') activeTournament = 'all';
    } else {
      var tournamentPills = [{ key: 'all', label: t('tournament_filter_all') }].concat(tournamentValues.map(function(v) {
        return { key: v, label: v === '' ? t('no_tournament') : v };
      }));
      if (!tournamentPills.some(function(p) { return p.key === activeTournament; })) activeTournament = 'all';
      tournamentFilterEl.innerHTML = tournamentPills.map(function(p) {
        return '<button class="season-pill ' + (activeTournament === p.key ? 'active' : '') + '" data-action="setTournamentFilter" data-tournament="' + esc(p.key) + '">' + esc(p.label) + '</button>';
      }).join('');
    }
  }

  var matches = activeTournament === 'all' ? teamMatches : teamMatches.filter(function(k) { return (k.tournament || '') === activeTournament; });
  var n = matches.length;
  var teamText = activeLag === 'all' ? t('all_teams_subtitle') : activeLag;
  var statsSubEl = document.getElementById('stats-sub');
  if (statsSubEl) statsSubEl.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;

  if (activeStatsView === 'analyse' && !isDesktop) {
    renderAnalyse(matches, activeLag, activeSeason);
    return;
  }

  var statsContent = document.getElementById('stats-content');
  if (!statsContent) {
    if (isDesktop) renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse', true);
    return;
  }

  if (n === 0) {
    statsContent.innerHTML = '<div class="loading">' + t('no_matches_season') + '</div>';
    if (isDesktop) renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse', true);
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
    renderPerformanceProfile(matches) +
    renderScoringStreaks(matches) +
    renderMonthlyBreakdown(matches) +
    renderHeadToHead(matches) +
    '<div class="opponent-search-wrap">' +
      '<div class="opponent-search-field-wrap">' +
        '<span class="opponent-search-icon">\u{1F50D}</span>' +
        '<input type="text" id="opponent-search-input" class="opponent-search-input" placeholder="' + t('opponent_search_ph') + '" value="' + esc(opponentSearch) + '" />' +
        (opponentSearch ? '<button class="opponent-search-clear" data-action="clearOpponentSearch">\u2715</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="match-list-header">' + t('match_history') + '</div>' +
    renderMatchListPaged(matches, matchPage);
  if (isDesktop) {
    renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse', true);
  }
}

export function setMatchPage(page) {
  matchPage = page;
  var statsContent = document.getElementById('stats-content');
  if (!statsContent) return;
  if (opponentSearch) { renderOpponentSearchResults(statsContent); return; }
  var header = statsContent.querySelector('.match-list-header');
  if (!header) { renderStats(); return; }
  var seasonMatches = getAllMatches().filter(function(k) { return matchesSeason(k, activeSeason); });
  var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, activeLag); });
  var matches = activeTournament === 'all' ? teamMatches : teamMatches.filter(function(k) { return (k.tournament || '') === activeTournament; });
  var toRemove = [];
  var node = header.nextSibling;
  while (node) { toRemove.push(node); node = node.nextSibling; }
  toRemove.forEach(function(n) { n.parentNode.removeChild(n); });
  var temp = document.createElement('div');
  temp.innerHTML = renderMatchListPaged(matches, matchPage);
  while (temp.firstChild) { statsContent.appendChild(temp.firstChild); }
  header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function setSeason(s) { activeSeason = s; activeLag = 'all'; activeTournament = 'all'; matchPage = 0; opponentSearch = ''; h2hSearch = ''; renderStats(); }
export function setTeamFilter(team) { activeLag = team; activeTournament = 'all'; matchPage = 0; opponentSearch = ''; h2hSearch = ''; renderStats(); }
export function setTournamentFilter(tournament) { activeTournament = tournament; h2hSearch = ''; matchPage = 0; renderStats(); }

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

export function setH2hSearch(v) {
  h2hSearch = v;
  renderStats();
  var input = document.getElementById('h2h-search-input');
  if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}
