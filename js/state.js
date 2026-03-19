import { CACHE_KEY } from './config.js';

var _allMatches = [];

export function getAllMatches() {
  return _allMatches;
}

export function setAllMatches(matches) {
  if (!Array.isArray(matches)) {
    console.warn('setAllMatches: expected array, got', typeof matches);
    return;
  }
  _allMatches = matches;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(matches)); } catch(e) { console.warn('setAllMatches: sessionStorage write failed', e); }
}

export function invalidateMatchCache() {
  _allMatches = [];
  try { sessionStorage.removeItem(CACHE_KEY); } catch(e) { console.warn('invalidateMatchCache: sessionStorage remove failed', e); }
}
