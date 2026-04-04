import { getResult, esc } from './utils.js';
import { t } from './i18n.js';
import { getDateLocale } from './settings.js';

var PAGE_SIZE = 20;

function fmtDate(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString(getDateLocale(), opts);
}

function renderMatchList(matches) {
  return matches.map(function(k) {
    var r = getResult(k);
    var resIkon = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    var date = fmtDate(k.date, { day: '2-digit', month: 'short' });
    var homeTeam = k.match_type === 'home' ? (k.own_team || '') : (k.opponent || '');
    var awayTeam = k.match_type === 'home' ? (k.opponent || '') : (k.own_team || '');
    var tournament = k.tournament ? ' \xb7 ' + esc(k.tournament) : '';
    var goalText = (k.goals || 0) > 0
      ? ' \xb7 ' + k.goals + String.fromCodePoint(9917) + ((k.assists || 0) > 0 ? ' ' + k.assists + String.fromCodePoint(127919) : '')
      : '';
    return '<div class="match-item" data-action="openEditModal" data-id="' + k.id + '">' +
      '<div class="match-result ' + r + '">' + resIkon + '</div>' +
      '<div class="match-info">' +
        '<div class="match-title-row">' +
          '<div class="match-opponent">' + esc(homeTeam) + '</div>' +
          (awayTeam ? '<div class="match-team-name">\xb7 ' + esc(awayTeam) + '</div>' : '') +
        '</div>' +
        '<div class="match-meta">' + date + tournament + goalText + '</div>' +
      '</div>' +
      '<div class="match-score">' + k.home_score + '\u2013' + k.away_score + '</div>' +
      '<div class="match-edit-icon">\u270F\uFE0F</div>' +
    '</div>';
  }).join('');
}

export function renderMatchListPaged(matches, page) {
  var matchPage = page || 0;
  var total = matches.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (matchPage >= totalPages) matchPage = totalPages - 1;
  var start = matchPage * PAGE_SIZE;
  var pageMatches = matches.slice(start, start + PAGE_SIZE);
  var half = Math.ceil(pageMatches.length / 2);
  var html = '<div class="match-list-grid">' +
    '<div class="match-col">' + renderMatchList(pageMatches.slice(0, half)) + '</div>' +
    '<div class="match-col">' + renderMatchList(pageMatches.slice(half)) + '</div>' +
  '</div>';
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
