import { getAllSeasons, getDateLocale } from './settings.js';
import { getAllMatches } from './state.js';
import { getProfile } from './profile.js';
import { getResult, esc, isDevPremium } from './utils.js';
import { t } from './i18n.js';

var CHART_COLORS = {
  lime:     '#00f2ff',
  gold:     '#ffe173',
  danger:   '#ffb4ab',
  muted:    '#b9cacb',
  card:     '#1c2026',
  border:   'rgba(0,242,255,0.15)',
  gridLine: 'rgba(58,73,75,0.4)',
  blue:     '#63b8e0',
  purple:   '#b08ae0',
  teal:     '#50d0a0'
};

var chartInstances = {};

export function getChartInstance(key) {
  return chartInstances[key] || null;
}

function fmtDate(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString(getDateLocale(), opts);
}

export function destroyCharts() {
  Object.values(chartInstances).forEach(function(c) { if (c) c.destroy(); });
  chartInstances = {};
}

export function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#b9cacb';
  Chart.defaults.borderColor = 'rgba(58,73,75,0.4)';
  Chart.defaults.font.family = 'Space Grotesk';
}

export function renderFormStreak(matches) {
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

export function renderAnalyse(matches, activeLag, activeSeason, containerId, secondary) {
  if (!secondary) destroyCharts();
  initChartDefaults();

  var container = document.getElementById(containerId || 'stats-content');
  if (!container) return;

  var asc = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  // Use all matches (not just filtered) for season list so all seasons are shown
  var seasons = getAllSeasons(getAllMatches());
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  var profileTeams = getProfile().teams || [];
  var lag = activeLag || 'all';
  if (!lag || (!profileTeams.includes(lag) && lag !== 'all')) lag = 'all';
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
          return '<button class="season-pill ' + (lag === p.key ? 'active' : '') + '" data-action="setTeamFilter" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  var n = matches.length;
  var teamText = lag === 'all' ? t('all_teams_subtitle') : lag;
  if (!secondary) {
    var statsSubEl2 = document.getElementById('stats-sub');
    if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;
  }

  if (!isDevPremium()) {
    container.innerHTML = (secondary ? '' : selectorHTML) +
      '<div class="chart-locked">' +
        '<div class="chart-card" style="filter:blur(3px);pointer-events:none">' +
          '<div class="chart-card-title">' + t('chart_win_pct') + '</div>' +
          '<div class="chart-canvas-wrap" style="height:160px;background:rgba(0,242,255,0.04);border-radius:8px"></div>' +
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
    container.innerHTML = (secondary ? '' : selectorHTML) + '<div class="loading">' + t('no_matches_season') + '</div>';
    return;
  }

  var RATING_DIMS = [
    { key: 'cat_overall',   field: 'rating_overall',   color: CHART_COLORS.lime,   dash: [],    width: 2,   defaultVisible: true },
    { key: 'cat_effort',    field: 'rating_effort',    color: CHART_COLORS.gold,   dash: [4,3], width: 1.5, defaultVisible: true },
    { key: 'cat_impact',    field: 'rating_impact',    color: CHART_COLORS.blue,   dash: [2,3], width: 1.5, defaultVisible: true },
    { key: 'cat_focus',     field: 'rating_focus',     color: CHART_COLORS.purple, dash: [4,3], width: 1.5, defaultVisible: false },
    { key: 'cat_technique', field: 'rating_technique', color: CHART_COLORS.danger, dash: [2,3], width: 1.5, defaultVisible: false },
    { key: 'cat_team_play', field: 'rating_team_play', color: CHART_COLORS.teal,   dash: [4,3], width: 1.5, defaultVisible: false }
  ];

  var ratingMatches = asc.filter(function(k) {
    return RATING_DIMS.some(function(d) { return k[d.field] != null; });
  });
  var ratingCardHTML = '';
  if (ratingMatches.length > 0) {
    var pillsHTML = RATING_DIMS.map(function(d, i) {
      var on = d.defaultVisible;
      var style = on
        ? 'background:' + d.color + '22;border-color:' + d.color + '66;color:' + d.color
        : '';
      return '<button class="rating-pill' + (on ? ' rating-pill-on' : '') + '"' +
        ' data-action="toggleRatingLine"' +
        ' data-dataset-index="' + i + '"' +
        ' data-color="' + d.color + '"' +
        ' style="' + style + '">' +
        t(d.key) +
      '</button>';
    }).join('');
    ratingCardHTML =
      '<div class="chart-card" id="chart-card-rating">' +
        '<div class="chart-card-title">' + t('rating_trend_title') + '</div>' +
        '<div class="chart-canvas-wrap"><canvas id="chart-rating" height="180"></canvas></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">' + pillsHTML + '</div>' +
      '</div>';
  }

  container.innerHTML = (secondary ? '' : selectorHTML) +
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
    '</div>' +
    ratingCardHTML;

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
    data: { labels: labels1, datasets: [{ label: t('chart_win_pct'), data: winPctData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(0,242,255,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.3 }] },
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
    data: { labels: labels2, datasets: [{ label: t('stat_goals'), data: goalData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(0,242,255,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.2 }, { label: t('stat_assists'), data: assistData, borderColor: CHART_COLORS.gold, backgroundColor: 'rgba(255,225,115,0.06)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.gold, fill: true, tension: 0.2 }] },
    options: { responsive: true, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Space Grotesk', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { min: 0, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } } } }
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
    data: { labels: tournKeys, datasets: [{ label: t('stat_goals'), data: tournKeys.map(function(k) { return tournMap[k].g; }), backgroundColor: 'rgba(0,242,255,0.6)', borderColor: CHART_COLORS.lime, borderWidth: 1, borderRadius: 4 }, { label: t('stat_assists'), data: tournKeys.map(function(k) { return tournMap[k].a; }), backgroundColor: 'rgba(255,225,115,0.5)', borderColor: CHART_COLORS.gold, borderWidth: 1, borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Space Grotesk', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { ticks: { font: { size: 11 } }, grid: { display: false } } } }
  });

  if (ratingMatches.length > 0 && document.getElementById('chart-rating')) {
    var ratingLabels = asc.map(function(k) {
      return fmtDate(k.date, { day: '2-digit', month: 'short' });
    });

    var ratingDatasets = RATING_DIMS.map(function(d) {
      var data = asc.map(function(k) { return k[d.field] != null ? k[d.field] : null; });
      return {
        label: t(d.key),
        data: data,
        borderColor: d.color,
        backgroundColor: 'transparent',
        borderWidth: d.width,
        borderDash: d.dash,
        pointRadius: asc.length > 20 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: d.color,
        spanGaps: false,
        hidden: !d.defaultVisible,
        tension: 0.2
      };
    });

    chartInstances['ratingTrend'] = new Chart(document.getElementById('chart-rating'), {
      type: 'line',
      data: { labels: ratingLabels, datasets: ratingDatasets },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } },
          y: { min: 1, max: 5, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }
        }
      }
    });
  }
}
