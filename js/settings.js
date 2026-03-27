import { SETTINGS_KEY } from './config.js';
import { getUserId } from './auth.js';
import { upsertSettings } from './supabase.js';

var _settingsCache = null;

export function defaultSettings() {
  return { sport: 'football', seasonFormat: 'year', activeSeason: '', lang: 'no', extraSeasons: [], dateFormat: 'eu', assessmentEnabled: false };
}

function migrateSettings(s) {
  if (s.sport === 'fotball') s.sport = 'football';
  if (s.seasonFormat === 'aar') s.seasonFormat = 'year';
  if (s.seasonFormat === 'sesong') s.seasonFormat = 'season';
  return s;
}

export function getSettings() {
  if (_settingsCache) return _settingsCache;
  try { _settingsCache = migrateSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings()); }
  catch(e) { _settingsCache = defaultSettings(); }
  return _settingsCache;
}

export function saveSettings(s) {
  var safe = Object.assign({}, defaultSettings(), migrateSettings(s));
  if (!['no', 'en'].includes(safe.lang)) safe.lang = 'no';
  if (!['year', 'season'].includes(safe.seasonFormat)) safe.seasonFormat = 'year';
  if (!['football', 'orientering', 'ski'].includes(safe.sport)) safe.sport = 'football';
  if (!Array.isArray(safe.extraSeasons)) safe.extraSeasons = [];
  if (typeof safe.activeSeason !== 'string') safe.activeSeason = '';
  if (!['eu', 'us'].includes(safe.dateFormat)) safe.dateFormat = 'eu';
  if (typeof safe.assessmentEnabled !== 'boolean') safe.assessmentEnabled = false;
  _settingsCache = safe;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  saveSettingsToSupabase(safe);
}

async function saveSettingsToSupabase(s) {
  // Note: assessmentEnabled, dateFormat, and extraSeasons are intentionally localStorage-only.
  // They do not need cross-device sync and require no DB columns.
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

export function buildSeasonLabel(year, format) {
  if (!year) return '';
  if (format === 'season') { var y = parseInt(year); return y + '\u2013' + (y + 1); }
  return String(year);
}

export function getDateLocale() {
  return getSettings().dateFormat === 'us' ? 'en-US' : 'no-NO';
}

export function getAllSeasons(allMatches) {
  var s = getSettings();
  var extra = s.extraSeasons || [];
  var fromMatches = [];
  if (allMatches) {
    allMatches.forEach(function(k) {
      var year = k.date ? k.date.substring(0, 4) : null;
      if (year && !fromMatches.includes(year)) fromMatches.push(year);
    });
  }
  var seasons = [];
  fromMatches.concat(extra).forEach(function(year) {
    var label = buildSeasonLabel(year, s.seasonFormat);
    if (!seasons.includes(label)) seasons.push(label);
  });
  return seasons.sort(function(a, b) { return parseInt(a) - parseInt(b); });
}

export function requestRenderSettings() {
  // Fires event to break circular dep chain: settings → settings-render → settings
  document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
