import { getSettings, saveSettings, getAllSeasons } from './settings.js';

const ALLOWED_SPORTS = ['fotball', 'orientering', 'ski'];

const THEMES = {
  fotball:     { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
};

export function applyTheme(sport) {
  var th = THEMES[sport] || THEMES.fotball;
  Object.keys(th).forEach(function(k) {
    document.documentElement.style.setProperty('--' + k, th[k]);
  });
}
import { getAllMatches } from './state.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { updateLogBadge } from './navigation.js';

export function renderSettings() {
  var s = getSettings();

  var el = document.getElementById('st-lang-title');
  if (el) el.textContent = t('lang_title');
  var el2 = document.getElementById('st-lang-desc');
  if (el2) el2.textContent = t('lang_desc');
  var stSportTitle = document.getElementById('st-sport-title');
  if (stSportTitle) stSportTitle.textContent = t('sport_title');
  var stSportDesc = document.getElementById('st-sport-desc');
  if (stSportDesc) stSportDesc.textContent = t('sport_desc');
  var stSfTitle = document.getElementById('st-sf-title');
  if (stSfTitle) stSfTitle.textContent = t('sf_title');
  var stSfDesc = document.getElementById('st-sf-desc');
  if (stSfDesc) stSfDesc.textContent = t('sf_desc');
  var stDfTitle = document.getElementById('st-df-title');
  if (stDfTitle) stDfTitle.textContent = t('df_title');
  var stDfDesc = document.getElementById('st-df-desc');
  if (stDfDesc) stDfDesc.textContent = t('df_desc');
  var stAsTitle = document.getElementById('st-as-title');
  if (stAsTitle) stAsTitle.textContent = t('as_title');
  var stAsDesc = document.getElementById('st-as-desc');
  if (stAsDesc) stAsDesc.textContent = t('as_desc');
  var addSeasonBtn = document.getElementById('settings-add-season-btn');
  if (addSeasonBtn) addSeasonBtn.textContent = '+ ' + t('add_item');
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
    [{ key: 'fotball', label: t('sport_fotball'), soon: false }, { key: 'orientering', label: t('sport_ori'), soon: true }, { key: 'ski', label: t('sport_ski'), soon: true }].forEach(function(sp) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (sp.soon ? ' soon' : '') + (s.sport === sp.key ? ' active' : '');
      btn.innerHTML = sp.label + (sp.soon ? ' <span style="font-size:10px">(' + t('snart') + ')</span>' : '');
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
    [{ key: 'aar', label: t('format_aar') }, { key: 'sesong', label: t('format_season') }].forEach(function(f) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.seasonFormat === f.key ? ' active' : '');
      btn.textContent = f.label;
      btn.dataset.action = 'setSeasonFormat';
      btn.dataset.format = f.key;
      sfEl.appendChild(btn);
    });
  }

  var dfEl = document.getElementById('settings-date-format-options');
  if (dfEl) {
    dfEl.innerHTML = '';
    [{ key: 'eu', label: t('df_eu') }, { key: 'us', label: t('df_us') }].forEach(function(f) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.dateFormat === f.key ? ' active' : '');
      btn.textContent = f.label;
      btn.dataset.action = 'setDateFormat';
      btn.dataset.format = f.key;
      dfEl.appendChild(btn);
    });
  }

  renderActiveSeasonPills();
}

export function renderActiveSeasonPills() {
  var s = getSettings();
  var seasons = getAllSeasons(getAllMatches());
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


export function setSport(sport) {
  if (!ALLOWED_SPORTS.includes(sport)) return;
  var s = getSettings(); s.sport = sport;
  saveSettings(s); renderSettings();
  applyTheme(sport);
  updateLogBadge();
  showToast(t('toast_sport_updated'), 'success');
}

export function setDateFormat(format) {
  var s = getSettings(); s.dateFormat = format;
  saveSettings(s); renderSettings();
  showToast(t('toast_date_format'), 'success');
}

export function setSeasonFormat(format) {
  var s = getSettings(); s.seasonFormat = format;
  var validSeasons = getAllSeasons(allMatches);
  if (s.activeSeason && !validSeasons.includes(s.activeSeason)) s.activeSeason = '';
  saveSettings(s); renderSettings();
  updateLogBadge();
}

export function setActiveSeason(sesong) {
  var s = getSettings();
  s.activeSeason = (s.activeSeason === sesong) ? '' : sesong;
  saveSettings(s);
  renderActiveSeasonPills();
  updateLogBadge();
  showToast(t('toast_active_season') + (s.activeSeason || t('none')), 'success');
}

export function addSeason() {
  var input = document.getElementById('settings-ny-sesong');
  var val = input.value.trim().replace(/[^0-9]/g, '');
  if (!val || val.length !== 4 || !/^\d{4}$/.test(val)) { showToast(t('toast_ugyldig_aar'), 'error'); return; }
  var s = getSettings();
  if (!s.extraSeasons) s.extraSeasons = [];
  if (s.extraSeasons.includes(val)) { showToast(t('toast_season_exists'), 'error'); return; }
  s.extraSeasons.push(val);
  saveSettings(s);
  input.value = '';
  renderActiveSeasonPills();
  showToast(t('toast_season_added'), 'success');
}
