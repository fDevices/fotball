import { getAllMatches } from './state.js';
import { fetchMatches } from './supabase.js';
import { getDateLocale } from './settings.js';
import { getProfile } from './profile.js';
import { showToast } from './toast.js';
import { esc, getResult } from './utils.js';
import { t } from './i18n.js';

async function getMatchesForExport() {
  if (getAllMatches().length > 0) return getAllMatches();
  try {
    return await fetchMatches();
  } catch(e) { return []; }
}

function matchesSeason(k, season) {
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var year = parseInt((k.date || '').slice(0, 4), 10);
  // Split-season (e.g. 2025–2026): include both years
  if (/[–\-]/.test(season)) return year === base || year === base + 1;
  return (k.date || '').startsWith(season);
}

function buildYearRange(matches) {
  var years = matches.map(function(k) { return parseInt((k.date || '').slice(0, 4), 10); }).filter(Boolean);
  if (!years.length) return String(new Date().getFullYear());
  var min = Math.min.apply(null, years);
  var max = Math.max.apply(null, years);
  return min === max ? String(min) : min + '\u2013' + max;
}

function resolveExportScope(all) {
  var sel = document.getElementById('export-season-select');
  var value = sel ? sel.value : '';
  if (!value || value === 'all') {
    return { matches: all, season: 'all', label: buildYearRange(all) };
  }
  return {
    matches: all.filter(function(k) { return matchesSeason(k, value); }),
    season: value,
    label: t('export_season') + ' ' + value
  };
}

function buildMatchResultLabel(k) {
  var r = getResult(k);
  return r === 'wins' ? t('stat_wins') : r === 'draw' ? t('stat_draws') : t('stat_losses');
}

function buildHomeAwayTeams(k) {
  return {
    homeTeam: k.match_type === 'home' ? (k.own_team  || '') : (k.opponent || ''),
    awayTeam: k.match_type === 'home' ? (k.opponent  || '') : (k.own_team || '')
  };
}

export async function exportCSV() {
  showToast(t('export_fetching'), 'info');
  var all = await getMatchesForExport();
  var result = resolveExportScope(all);
  if (!result.matches.length) { showToast(t('export_no_matches'), 'error'); return; }
  var header = [t('date'), t('home_label'), t('away_label'), t('export_tournament'),
    t('export_h_score'), t('export_a_score'), t('stat_goals'), t('stat_assists'), t('result_label')].join(',');
  var lines = [header];
  result.matches.forEach(function(k) {
    var resLabel = buildMatchResultLabel(k);
    var teams = buildHomeAwayTeams(k);
    function csvEsc(v) { var str = String(v || ''); return str.includes(',') ? '"' + str.replace(/"/g, '""') + '"' : str; }
    lines.push([
      csvEsc(k.date), csvEsc(teams.homeTeam), csvEsc(teams.awayTeam), csvEsc(k.tournament),
      k.home_score || 0, k.away_score || 0, k.goals || 0, k.assists || 0,
      csvEsc(resLabel)
    ].join(','));
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'athlytics-' + result.season + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast(t('export_csv_done'), 'success');
}

export async function exportPDF() {
  showToast(t('export_fetching'), 'info');
  var all = await getMatchesForExport();
  var result = resolveExportScope(all);
  if (!result.matches.length) { showToast(t('export_no_matches'), 'error'); return; }
  var profil = getProfile();
  var matches = result.matches;
  var locale = getDateLocale();

  var w = 0, d = 0, l = 0, g = 0, a = 0;
  matches.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.goals || 0; a += k.assists || 0;
  });
  var n = matches.length;

  var matchRows = matches.slice().reverse().map(function(k) {
    var r = getResult(k);
    var color = r === 'wins' ? '#4caf50' : r === 'draw' ? '#f0c050' : '#e05555';
    var resLabel = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    var date = new Date(k.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    var teams = buildHomeAwayTeams(k);
    return '<tr>' +
      '<td>' + date + '</td>' +
      '<td>' + esc(teams.homeTeam) + '</td>' +
      '<td>' + esc(teams.awayTeam) + '</td>' +
      '<td>' + esc(k.tournament || '') + '</td>' +
      '<td style="text-align:center">' + k.home_score + '\u2013' + k.away_score + '</td>' +
      '<td style="text-align:center">' + (k.goals   || 0) + '</td>' +
      '<td style="text-align:center">' + (k.assists || 0) + '</td>' +
      '<td style="text-align:center;color:' + color + ';font-weight:700">' + resLabel + '</td>' +
    '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Athlytics \u2013 ' + result.label + '</title>' +
    '<style>body{font-family:Arial,sans-serif;margin:32px;color:#111}' +
    'h1{font-size:28px;margin-bottom:2px}h2{font-size:14px;color:#666;font-weight:normal;margin-bottom:24px}' +
    '.summary{display:flex;gap:24px;margin-bottom:28px;flex-wrap:wrap}' +
    '.stat{text-align:center;background:#f5f5f0;border-radius:8px;padding:12px 20px}' +
    '.stat-n{font-size:32px;font-weight:900;line-height:1}' +
    '.stat-l{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-top:2px}' +
    'table{width:100%;border-collapse:collapse;font-size:13px}' +
    'th{background:#1a3a1f;color:#a8e063;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em}' +
    'tr:nth-child(even){background:#f9f9f9}td{padding:7px 10px;border-bottom:1px solid #eee}' +
    '.footer{margin-top:24px;font-size:11px;color:#999;text-align:center}' +
    '@media print{body{margin:16px}}' +
    '</style></head><body>' +
    '<h1>Athlytics Sport' + (profil.name ? ' \u2013 ' + esc(profil.name) : '') + '</h1>' +
    '<h2>' + esc(result.label) + (profil.club ? ' \xb7 ' + esc(profil.club) : '') + '</h2>' +
    '<div class="summary">' +
      '<div class="stat"><div class="stat-n">' + n + '</div><div class="stat-l">' + t('export_matches') + '</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#4caf50">' + w + '</div><div class="stat-l">' + t('stat_wins') + '</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#f0c050">' + d + '</div><div class="stat-l">' + t('stat_draws') + '</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#e05555">' + l + '</div><div class="stat-l">' + t('stat_losses') + '</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#1a3a1f">' + g + '</div><div class="stat-l">' + t('stat_goals') + '</div></div>' +
      '<div class="stat"><div class="stat-n">' + a + '</div><div class="stat-l">' + t('stat_assists') + '</div></div>' +
      '<div class="stat"><div class="stat-n">' + (g + a) + '</div><div class="stat-l">G+A</div></div>' +
    '</div>' +
    '<table><thead><tr>' +
      '<th>' + t('date') + '</th>' +
      '<th>' + t('home_label') + '</th>' +
      '<th>' + t('away_label') + '</th>' +
      '<th>' + t('export_tournament') + '</th>' +
      '<th style="text-align:center">' + t('result_label') + '</th>' +
      '<th style="text-align:center">' + t('stat_goals') + '</th>' +
      '<th style="text-align:center">' + t('export_ast') + '</th>' +
      '<th style="text-align:center">' + t('export_res') + '</th>' +
    '</tr></thead>' +
    '<tbody>' + matchRows + '</tbody></table>' +
    '<div class="footer">' + t('export_footer') + ' \xb7 athlyticsport.app \xb7 ' + new Date().toLocaleDateString(locale) + '</div>' +
    '</body></html>';

  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  var iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open(); iDoc.write(html); iDoc.close();
  setTimeout(function() {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(function() { document.body.removeChild(iframe); }, 1000);
  }, 400);
  showToast(t('export_pdf_done'), 'success');
}
