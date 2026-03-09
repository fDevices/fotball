import { CACHE_KEY } from './config.js';

export var allMatches = [];

export function setAllMatches(matches) {
  allMatches = matches;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(matches)); } catch(e) {}
}

export function invalidateMatchCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch(e) {}
}
