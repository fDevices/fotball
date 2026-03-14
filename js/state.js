import { CACHE_KEY } from './config.js';

export var allMatches = [];

export function setAllMatches(matches) {
  if (!Array.isArray(matches)) {
    console.warn('setAllMatches: expected array, got', typeof matches);
    return;
  }
  allMatches = matches;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(matches)); } catch(e) { console.warn('setAllMatches: sessionStorage write failed', e); }
}

export function invalidateMatchCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch(e) { console.warn('invalidateMatchCache: sessionStorage remove failed', e); }
}
