import { getSettings, saveSettings, buildSeasonLabel } from './settings.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { updateLogBadge } from './navigation.js';

export function renderSettings() {
  var s = getSettings();

  var el = document.getElementById('st-lang-title');
  if (el) el.textContent = t('lang_title');
  var el2 = document.getElementById('st-lang-desc');
  if (el2) el2.textContent = t('lang_desc');
  var langEl = document.getElementById('settings-lang-options');
  if (langEl) {
    langEl.innerHTML = '';
    [{ key: 'no', label: '\u{1F1F3}\u{1F1F4} Norsk' }, { key: 'en', label: '\u{1F1EC}\u{1F1E7} English' }].forEach(function(l) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.lang === l.key ? ' active' : '');
      btn.textContent = l.label;
      btn.dataset.action = 'setLang';
      btn.dataset.lang = l.key;
      langEl.appendChild(btn);
    });
  }

  var sportEl = document.getElementById('settings-sport-options');
  if (sportEl) {
    sportEl.innerHTML = '';
    [{ key: 'fotball', label: '\u26BD Fotball', soon: false }, { key: 'orientering', label: '\u{1F9ED} Orientering', soon: true }, { key: 'ski', label: '\u26F7\uFE0F Ski', soon: true }].forEach(function(sp) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (sp.soon ? ' soon' : '') + (s.sport === sp.key ? ' active' : '');
      btn.innerHTML = sp.label + (sp.soon ? ' <span style="font-size:10px">(snart)</span>' : '');
      if (!sp.soon) {
        btn.dataset.action = 'setSport';
        btn.dataset.sport = sp.key;
      }
      sportEl.appendChild(btn);
    });
  }

  var sfEl = document.getElementById('settings-sesong-options');
  if (sfEl) {
    sfEl.innerHTML = '';
    [{ key: 'aar', label: '\u{1F4C5} \u00c5r (2025)' }, { key: 'sesong', label: '\u{1F5D3}\uFE0F Sesong (2025\u20132026)' }].forEach(function(f) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.seasonFormat === f.key ? ' active' : '');
      btn.textContent = f.label;
      btn.dataset.action = 'setSeasonFormat';
      btn.dataset.format = f.key;
      sfEl.appendChild(btn);
    });
  }

  renderActiveSeasonPills();
}

export function renderActiveSeasonPills() {
  var s = getSettings();
  var seasons = getAllSeasonsLocal();
  var el = document.getElementById('settings-aktiv-sesong-options');
  if (!el) return;
  el.innerHTML = '';
  if (seasons.length === 0) {
    el.innerHTML = '<span style="font-size:13px;color:var(--muted)">' + t('no_seasons') + '</span>';
    return;
  }
  seasons.forEach(function(sesong) {
    var btn = document.createElement('button');
    btn.className = 'settings-pill' + (s.activeSeason === sesong ? ' active' : '');
    btn.textContent = sesong;
    btn.dataset.action = 'setActiveSeason';
    btn.dataset.season = sesong;
    el.appendChild(btn);
  });
}

function getAllSeasonsLocal() {
  // Import allMatches at call time to avoid circular dep
  var allMatches = [];
  try {
    var cached = sessionStorage.getItem('athlytics_kamper');
    if (cached) allMatches = JSON.parse(cached);
  } catch(e) {}
  var s = getSettings();
  var ekstra = s.extraSeasons || [];
  var fromMatches = [];
  allMatches.forEach(function(k) {
    var aar = k.dato ? k.dato.substring(0, 4) : null;
    if (aar && !fromMatches.includes(aar)) fromMatches.push(aar);
  });
  var sett = [];
  fromMatches.concat(ekstra).forEach(function(aar) {
    var label = buildSeasonLabel(aar, s.seasonFormat);
    if (!sett.includes(label)) sett.push(label);
  });
  return sett.sort();
}

export function setSport(sport) {
  var s = getSettings(); s.sport = sport;
  saveSettings(s); renderSettings();
  updateLogBadge();
  showToast(t('toast_sport_updated'), 'success');
}

export function setSeasonFormat(format) {
  var s = getSettings(); s.seasonFormat = format;
  saveSettings(s); renderSettings();
  updateLogBadge();
}

export function setActiveSeason(sesong) {
  var s = getSettings();
  s.activeSeason = (s.activeSeason === sesong) ? '' : sesong;
  saveSettings(s);
  renderActiveSeasonPills();
  updateLogBadge();
  showToast(t('toast_active_season') + (s.activeSeason || 'ingen'), 'success');
}

export function addSeason() {
  var input = document.getElementById('settings-ny-sesong');
  var val = input.value.trim().replace(/[^0-9]/g, '');
  if (!val || val.length < 4) { showToast(t('toast_ugyldig_aar'), 'error'); return; }
  var s = getSettings();
  if (!s.extraSeasons) s.extraSeasons = [];
  if (s.extraSeasons.includes(val)) { showToast(t('toast_season_exists'), 'error'); return; }
  s.extraSeasons.push(val);
  saveSettings(s);
  input.value = '';
  renderActiveSeasonPills();
  showToast(t('toast_season_added'), 'success');
}
