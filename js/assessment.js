import { updateKamp } from './supabase.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { isDevPremium } from './utils.js';

var _matchId = null;
var _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
var _activeContext = null; // 'sheet' | 'modal'

var CATEGORIES = ['effort', 'focus', 'technique', 'team_play', 'impact'];
var CAT_KEYS   = { effort: 'cat_effort', focus: 'cat_focus', technique: 'cat_technique', team_play: 'cat_team_play', impact: 'cat_impact' };

function resetState() {
  _matchId = null;
  _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
  _activeContext = null;
}

// ── Sheet (Log tab) ──────────────────────────────────────────────────────────

export function openAssessmentSheet(matchId) {
  resetState();
  _matchId = matchId;
  _activeContext = 'sheet';
  renderAssessmentSheet();
  var backdrop = document.getElementById('assessment-backdrop');
  var sheet    = document.getElementById('assessment-sheet');
  if (!backdrop || !sheet) return;
  backdrop.classList.add('open');
  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeAssessmentSheet() {
  var backdrop = document.getElementById('assessment-backdrop');
  var sheet    = document.getElementById('assessment-sheet');
  if (backdrop) backdrop.classList.remove('open');
  if (sheet)    sheet.classList.remove('open');
  document.body.style.overflow = '';
  resetState();
}

export function resetAssessmentState() {
  resetState();
}

export function renderAssessmentSheet() {
  var el = document.getElementById('assessment-body');
  if (!el) return;
  var title = document.getElementById('assess-title');
  if (title) title.textContent = t('assess_heading');
  var skipBtn = document.getElementById('assess-skip-btn');
  if (skipBtn) skipBtn.textContent = t('assess_skip');
  var saveBtn = document.getElementById('assess-save-btn');
  if (saveBtn) saveBtn.textContent = t('assess_save');
  el.innerHTML = '';
  el.appendChild(buildAssessmentRows('sheet'));
}

// ── Modal (edit context) ─────────────────────────────────────────────────────

export function loadMatchIntoAssessment(match) {
  _ratings = {
    effort:    match.rating_effort    || 0,
    focus:     match.rating_focus     || 0,
    technique: match.rating_technique || 0,
    team_play: match.rating_team_play || 0,
    impact:    match.rating_impact    || 0
  };
  _activeContext = 'modal';
}

export function renderModalAssessmentSection() {
  var el = document.getElementById('modal-assessment-body');
  if (!el) return;
  el.innerHTML = '';
  el.appendChild(buildAssessmentRows('modal'));
}

// ── Shared rendering ─────────────────────────────────────────────────────────

function buildAssessmentRows(context) {
  var wrap = document.createElement('div');
  wrap.className = 'assessment-rows';

  if (context === 'modal') {
    var heading = document.createElement('div');
    heading.className = 'assessment-heading';
    heading.textContent = t('assess_heading');
    wrap.appendChild(heading);
  }

  CATEGORIES.forEach(function(cat) {
    var row = document.createElement('div');
    row.className = 'assessment-row';

    var label = document.createElement('div');
    label.className = 'assessment-cat-label';
    label.textContent = t(CAT_KEYS[cat]);
    row.appendChild(label);

    var btns = document.createElement('div');
    btns.className = 'assessment-num-btns';

    for (var v = 1; v <= 5; v++) {
      var btn = document.createElement('button');
      btn.className = 'assessment-num-btn' + (_ratings[cat] === v ? ' active' : '');
      btn.textContent = String(v);
      btn.dataset.action   = 'setRating';
      btn.dataset.category = cat;
      btn.dataset.value    = String(v);
      btn.dataset.context  = context;
      btns.appendChild(btn);
    }
    row.appendChild(btns);

    var hint = document.createElement('div');
    hint.className = 'assessment-rating-hint';
    hint.id = 'rating-hint-' + context + '-' + cat;
    hint.textContent = _ratings[cat] ? t('rating_' + _ratings[cat]) : '';
    row.appendChild(hint);

    wrap.appendChild(row);
  });

  // Reflection fields
  var divider = document.createElement('div');
  divider.className = 'modal-divider';
  wrap.appendChild(divider);

  var goodId    = context === 'sheet' ? 'assess-reflection-good'    : 'modal-assess-reflection-good';
  var improveId = context === 'sheet' ? 'assess-reflection-improve' : 'modal-assess-reflection-improve';

  wrap.appendChild(buildTextarea(goodId, t('assess_good')));
  wrap.appendChild(buildTextarea(improveId, t('assess_improve')));

  // Premium gate (sheet context only — modal always shows, save handles it)
  if (context === 'sheet' && !isDevPremium()) {
    var overlay = document.createElement('div');
    overlay.className = 'assessment-lock-overlay';
    var lockTitle = document.createElement('div');
    lockTitle.className = 'pro-lock-title';
    lockTitle.textContent = t('pro_feature');
    var lockDesc = document.createElement('div');
    lockDesc.className = 'pro-lock-desc';
    lockDesc.textContent = t('pro_upgrade_text');
    var lockBtn = document.createElement('button');
    lockBtn.className = 'pro-lock-btn';
    lockBtn.dataset.action = 'showProToast';
    lockBtn.textContent = t('pro_unlock_btn');
    overlay.appendChild(lockTitle);
    overlay.appendChild(lockDesc);
    overlay.appendChild(lockBtn);
    wrap.appendChild(overlay);
  }

  return wrap;
}

function buildTextarea(id, placeholder) {
  var label = document.createElement('label');
  label.className = 'assessment-textarea-label';
  label.htmlFor = id;
  label.textContent = placeholder;
  var ta = document.createElement('textarea');
  ta.id          = id;
  ta.className   = 'assessment-textarea';
  ta.placeholder = placeholder;
  ta.maxLength   = 500;
  var wrap = document.createElement('div');
  wrap.className = 'assessment-textarea-wrap';
  wrap.appendChild(label);
  wrap.appendChild(ta);
  return wrap;
}

// ── Rating interaction ───────────────────────────────────────────────────────

export function setRating(category, value, context) {
  if (!CATEGORIES.includes(category)) return;
  // Toggle: tapping active button deselects
  _ratings[category] = (_ratings[category] === value) ? 0 : value;
  // Re-render the buttons for this category in the right container
  var ctx = context || _activeContext || 'sheet';
  var containerId = ctx === 'modal' ? 'modal-assessment-body' : 'assessment-body';
  var container = document.getElementById(containerId);
  if (!container) return;
  var allBtns = container.querySelectorAll('[data-action="setRating"][data-category="' + category + '"]');
  allBtns.forEach(function(btn) {
    btn.classList.toggle('active', Number(btn.dataset.value) === _ratings[category]);
  });
  var hint = document.getElementById('rating-hint-' + ctx + '-' + category);
  if (hint) hint.textContent = _ratings[category] ? t('rating_' + _ratings[category]) : '';
}

// ── Save (sheet context) ─────────────────────────────────────────────────────

export async function saveAssessment() {
  if (!_matchId) return;
  var payload = {
    rating_effort:    _ratings.effort    || null,
    rating_focus:     _ratings.focus     || null,
    rating_technique: _ratings.technique || null,
    rating_team_play: _ratings.team_play || null,
    rating_impact:    _ratings.impact    || null,
    reflection_good:    (document.getElementById('assess-reflection-good')?.value    || '').trim() || null,
    reflection_improve: (document.getElementById('assess-reflection-improve')?.value || '').trim() || null
  };
  var saveBtn = document.getElementById('assess-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('saving'); }
  try {
    var res = await updateKamp(_matchId, payload);
    if (res.ok) {
      closeAssessmentSheet();
      showToast(t('assess_saved'), 'success');
    } else {
      showToast(t('toast_nettverksfeil_kort'), 'error');
    }
  } catch(e) {
    showToast(t('toast_nettverksfeil_kort'), 'error');
  }
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('assess_save'); }
}

// ── Payload getter (modal context) ───────────────────────────────────────────

export function getAssessmentPayload() {
  return {
    rating_effort:    _ratings.effort    || null,
    rating_focus:     _ratings.focus     || null,
    rating_technique: _ratings.technique || null,
    rating_team_play: _ratings.team_play || null,
    rating_impact:    _ratings.impact    || null,
    reflection_good:    (document.getElementById('modal-assess-reflection-good')?.value    || '').trim() || null,
    reflection_improve: (document.getElementById('modal-assess-reflection-improve')?.value || '').trim() || null
  };
}
