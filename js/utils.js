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
