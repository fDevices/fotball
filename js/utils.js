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

export function getResult(k) {
  if (k.match_type === 'home') return k.home_score > k.away_score ? 'wins' : k.home_score < k.away_score ? 'loss' : 'draw';
  return k.away_score > k.home_score ? 'wins' : k.away_score < k.home_score ? 'loss' : 'draw';
}
