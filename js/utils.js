export function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// TODO Phase 4: replace with Stripe subscription check
export function isDevPremium() {
  return true;
}

// Clamps goals and assists to be valid relative to own team's score.
// Returns { goals, assists } with both clamped to [0, ownScore].
export function clampStats(goals, assists, ownScore) {
  var g = Math.max(0, Math.min(goals, ownScore));
  var a = Math.max(0, Math.min(assists, ownScore - g));
  return { goals: g, assists: a };
}

export function getResult(k) {
  if (k.match_type === 'home') return k.home_score > k.away_score ? 'wins' : k.home_score < k.away_score ? 'loss' : 'draw';
  return k.away_score > k.home_score ? 'wins' : k.away_score < k.home_score ? 'loss' : 'draw';
}

export function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  ));
}

export function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  var focusable = getFocusableElements(container);
  if (!focusable.length) return;
  var idx = focusable.indexOf(document.activeElement);
  if (event.shiftKey) {
    var prev = idx <= 0 ? focusable[focusable.length - 1] : focusable[idx - 1];
    prev.focus();
  } else {
    var next = idx === focusable.length - 1 ? focusable[0] : focusable[idx + 1];
    next.focus();
  }
}
