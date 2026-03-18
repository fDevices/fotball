import { getSettings } from './settings.js';
import { buildSeasonLabel } from './settings.js';

export function updateLogBadge() {
  var s = getSettings();
  var badge = document.querySelector('#screen-log .header-badge');
  if (!badge) return;
  var aar = s.activeSeason || String(new Date().getFullYear());
  var baseAar = aar.split(/[\u2013-]/)[0].trim();
  var label = buildSeasonLabel(baseAar, s.seasonFormat);
  var icon = s.sport === 'orientering' ? '\u{1F9ED}' : s.sport === 'ski' ? '\u26F7\uFE0F' : '\u26BD';
  badge.textContent = icon + ' ' + label;
}

export function switchTab(tab) {
  var screen = document.getElementById('screen-' + tab);
  var tabBtn = document.getElementById('tab-' + tab);
  if (!screen || !tabBtn) return;
  document.dispatchEvent(new CustomEvent('athlytics:destroyCharts'));
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  screen.classList.add('active');
  tabBtn.classList.add('active');
  if (tab === 'stats') document.dispatchEvent(new CustomEvent('athlytics:loadStats'));
  if (tab === 'settings') document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
