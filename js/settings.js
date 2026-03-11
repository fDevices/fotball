import { SETTINGS_KEY } from './config.js';
import { upsertSettings } from './supabase.js';

var _settingsCache = null;

function defaultSettings() {
  return { sport: 'fotball', seasonFormat: 'aar', activeSeason: '', lang: 'no', extraSeasons: [] };
}

export function getSettings() {
  if (_settingsCache) return _settingsCache;
  try { _settingsCache = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings(); }
  catch(e) { _settingsCache = defaultSettings(); }
  return _settingsCache;
}

export function saveSettings(s) {
  _settingsCache = s;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  saveSettingsToSupabase(s);
}

async function saveSettingsToSupabase(s) {
  try {
    await upsertSettings({
      id: 'default',
      sport: s.sport,
      season_format: s.seasonFormat,
      active_season: s.activeSeason || '',
      lang: s.lang || 'no',
      oppdatert: new Date().toISOString()
    });
  } catch(e) {}
}

export function buildSeasonLabel(aar, format) {
  if (!aar) return '';
  if (format === 'sesong') { var y = parseInt(aar); return y + '\u2013' + (y + 1); }
  return String(aar);
}

export function getAllSeasons(allMatches) {
  var s = getSettings();
  var ekstra = s.extraSeasons || [];
  var fromMatches = [];
  if (allMatches) {
    allMatches.forEach(function(k) {
      var aar = k.dato ? k.dato.substring(0, 4) : null;
      if (aar && !fromMatches.includes(aar)) fromMatches.push(aar);
    });
  }
  var sett = [];
  fromMatches.concat(ekstra).forEach(function(aar) {
    var label = buildSeasonLabel(aar, s.seasonFormat);
    if (!sett.includes(label)) sett.push(label);
  });
  return sett.sort();
}

export function renderSettings() {
  // Import lazily via dynamic event to avoid circular dep chain
  document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
