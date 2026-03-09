import { allMatches } from './state.js';
import { fetchKamper } from './supabase.js';
import { CACHE_KEY } from './config.js';
import { getSettings } from './settings.js';
import { getProfile } from './profile.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';
import { getResult } from './stats.js';

async function getMatchesForExport() {
  if (allMatches && allMatches.length > 0) return allMatches;
  try {
    var cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch(e) {}
  try {
    return await fetchKamper();
  } catch(e) { return []; }
}

function getActiveSeasonMatches(all, s) {
  var season = s.activeSeason || String(new Date().getFullYear());
  var baseYear = season.split(/[\u2013-]/)[0].trim();
  return { matches: all.filter(function(k) { return k.dato && k.dato.startsWith(baseYear); }), season: season };
}

function buildMatchResultLabel(k) {
  var r = getResult(k);
  return r === 'wins' ? 'Seier' : r === 'draw' ? 'Uavgjort' : 'Tap';
}

function buildHomeAwayTeams(k) {
  return {
    homeTeam: k.kamptype === 'hjemme' ? (k.eget_lag || '') : (k.motstanderlag || ''),
    awayTeam: k.kamptype === 'hjemme' ? (k.motstanderlag || '') : (k.eget_lag || '')
  };
}

export async function exportCSV() {
  showToast('Henter data...', 'success');
  var all = await getMatchesForExport();
  var s = getSettings();
  var result = getActiveSeasonMatches(all, s);
  if (!result.matches.length) { showToast('Ingen kamper å eksportere', 'error'); return; }
  var lines = ['Dato,Hjemmelag,Bortelag,Turnering,Hjemme,Borte,Mal,Assist,Resultat'];
  result.matches.forEach(function(k) {
    var resLabel = buildMatchResultLabel(k);
    var teams = buildHomeAwayTeams(k);
    function csvEsc(v) { var str = String(v || ''); return str.includes(',') ? '"' + str.replace(/"/g, '""') + '"' : str; }
    lines.push([
      csvEsc(k.dato), csvEsc(teams.homeTeam), csvEsc(teams.awayTeam), csvEsc(k.turnering),
      k.hjemme || 0, k.borte || 0, k.mal || 0, k.assist || 0,
      csvEsc(resLabel)
    ].join(','));
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'athlytics-' + result.season + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('\u{1F4CA} CSV lastet ned', 'success');
}

export async function exportPDF() {
  showToast('Henter data...', 'success');
  var all = await getMatchesForExport();
  var s = getSettings();
  var result = getActiveSeasonMatches(all, s);
  if (!result.matches.length) { showToast('Ingen kamper å eksportere', 'error'); return; }
  var profil = getProfile();
  var matches = result.matches;
  var season = result.season;

  var w = 0, d = 0, l = 0, g = 0, a = 0;
  matches.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.mal || 0; a += k.assist || 0;
  });
  var n = matches.length;

  var matchRows = matches.slice().reverse().map(function(k) {
    var r = getResult(k);
    var color = r === 'wins' ? '#4caf50' : r === 'draw' ? '#f0c050' : '#e05555';
    var resLabel = r === 'wins' ? 'S' : r === 'draw' ? 'U' : 'T';
    var date = new Date(k.dato).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' });
    var teams = buildHomeAwayTeams(k);
    return '<tr>' +
      '<td>' + date + '</td>' +
      '<td>' + esc(teams.homeTeam) + '</td>' +
      '<td>' + esc(teams.awayTeam) + '</td>' +
      '<td>' + esc(k.turnering || '') + '</td>' +
      '<td style="text-align:center">' + k.hjemme + '\u2013' + k.borte + '</td>' +
      '<td style="text-align:center">' + (k.mal || 0) + '</td>' +
      '<td style="text-align:center">' + (k.assist || 0) + '</td>' +
      '<td style="text-align:center;color:' + color + ';font-weight:700">' + resLabel + '</td>' +
    '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Athlytics \u2013 ' + season + '</title>' +
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
    '<h2>Sesong ' + season + (profil.club ? ' \xb7 ' + esc(profil.club) : '') + '</h2>' +
    '<div class="summary">' +
      '<div class="stat"><div class="stat-n">' + n + '</div><div class="stat-l">Kamper</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#4caf50">' + w + '</div><div class="stat-l">Seier</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#f0c050">' + d + '</div><div class="stat-l">Uavgjort</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#e05555">' + l + '</div><div class="stat-l">Tap</div></div>' +
      '<div class="stat"><div class="stat-n" style="color:#1a3a1f">' + g + '</div><div class="stat-l">M\u00e5l</div></div>' +
      '<div class="stat"><div class="stat-n">' + a + '</div><div class="stat-l">Assist</div></div>' +
      '<div class="stat"><div class="stat-n">' + (g + a) + '</div><div class="stat-l">G+A</div></div>' +
    '</div>' +
    '<table><thead><tr><th>Dato</th><th>Hjemmelag</th><th>Bortelag</th><th>Turnering</th><th style="text-align:center">Resultat</th><th style="text-align:center">M\u00e5l</th><th style="text-align:center">Ast</th><th style="text-align:center">Res</th></tr></thead>' +
    '<tbody>' + matchRows + '</tbody></table>' +
    '<div class="footer">Generert av Athlytics Sport \xb7 athlyticsport.app \xb7 ' + new Date().toLocaleDateString('no-NO') + '</div>' +
    '</body></html>';

  var win = window.open('', '_blank');
  if (!win) { showToast('Tillat popup for PDF', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 400);
  showToast('\u{1F4C4} PDF åpnet \u2013 trykk Skriv ut', 'success');
}
