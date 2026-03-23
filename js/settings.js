import { SETTINGS_KEY } from './config.js';
import { getUserId } from './auth.js';
import { upsertSettings } from './supabase.js';

var _settingsCache = null;

export function defaultSettings() {
  return { sport: 'fotball', seasonFormat: 'aar', activeSeason: '', lang: 'no', extraSeasons: [], dateFormat: 'eu', assessmentEnabled: false };
}

export function getSettings() {
  if (_settingsCache) return _settingsCache;
  try { _settingsCache = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings(); }
  catch(e) { _settingsCache = defaultSettings(); }
  return _settingsCache;
}

export function saveSettings(s) {
  var safe = Object.assign({}, defaultSettings(), s);
  if (!['no', 'en'].includes(safe.lang)) safe.lang = 'no';
  if (!['aar', 'sesong'].includes(safe.seasonFormat)) safe.seasonFormat = 'aar';
  if (!['fotball', 'orientering', 'ski'].includes(safe.sport)) safe.sport = 'fotball';
  if (!Array.isArray(safe.extraSeasons)) safe.extraSeasons = [];
  if (typeof safe.activeSeason !== 'string') safe.activeSeason = '';
  if (!['eu', 'us'].includes(safe.dateFormat)) safe.dateFormat = 'eu';
  if (typeof safe.assessmentEnabled !== 'boolean') safe.assessmentEnabled = false;
  _settingsCache = safe;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  saveSettingsToSupabase(safe);
}

async function saveSettingsToSupabase(s) {
  try {
    await upsertSettings({
      id: getUserId(),
      sport: s.sport,
      season_format: s.seasonFormat,
      active_season: s.activeSeason || '',
      lang: s.lang || 'no',
      updated_at: new Date().toISOString()
    });
  } catch(e) { console.warn('saveSettingsToSupabase failed:', e); }
}

export function buildSeasonLabel(aar, format) {
  if (!aar) return '';
  if (format === 'sesong') { var y = parseInt(aar); return y + '\u2013' + (y + 1); }
  return String(aar);
}

export function getDateLocale() {
  return getSettings().dateFormat === 'us' ? 'en-US' : 'no-NO';
}

export function getAllSeasons(allMatches) {
  var s = getSettings();
  var ekstra = s.extraSeasons || [];
  var fromMatches = [];
  if (allMatches) {
    allMatches.forEach(function(k) {
      var aar = k.date ? k.date.substring(0, 4) : null;
      if (aar && !fromMatches.includes(aar)) fromMatches.push(aar);
    });
  }
  var sett = [];
  fromMatches.concat(ekstra).forEach(function(aar) {
    var label = buildSeasonLabel(aar, s.seasonFormat);
    if (!sett.includes(label)) sett.push(label);
  });
  return sett.sort(function(a, b) { return parseInt(a) - parseInt(b); });
}

export function requestRenderSettings() {
  // Fires event to break circular dep chain: settings → settings-render → settings
  document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
