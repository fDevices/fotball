import { PROFIL_KEY } from './config.js';
import { getUserId, isAuthenticated } from './auth.js';
import { fetchProfil, upsertProfil } from './supabase.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { getSettings } from './settings.js';

var _profileCache = null;

var _promptDismissed = false;

export function isProfileComplete() {
  return !!(getProfile().name && getProfile().name.trim());
}

export function updateProfilePrompt() {
  var banner = document.getElementById('profile-prompt');
  var badge = document.getElementById('tab-profile-badge');
  if (!isAuthenticated()) {
    if (banner) banner.classList.add('hidden');
    if (badge) badge.classList.remove('visible');
    return;
  }
  var complete = isProfileComplete();
  if (banner) {
    if (complete || _promptDismissed) banner.classList.add('hidden');
    else banner.classList.remove('hidden');
  }
  if (badge) {
    if (complete || _promptDismissed) badge.classList.remove('visible');
    else badge.classList.add('visible');
  }
}

export function dismissProfilePrompt() {
  _promptDismissed = true;
  updateProfilePrompt();
}

export function getProfile() {
  if (_profileCache) return _profileCache;
  try {
    var stored = JSON.parse(localStorage.getItem(PROFIL_KEY));
    // Migrate legacy 'team' key to 'teams' if needed
    if (stored && stored.team && !stored.teams) stored.teams = stored.team;
    _profileCache = stored || { name: '', club: '', position: '', teams: [], favoriteTeam: '', tournaments: [], favoriteTournament: '' };
  } catch(e) {
    _profileCache = { name: '', club: '', position: '', teams: [], favoriteTeam: '', tournaments: [], favoriteTournament: '' };
  }
  return _profileCache;
}

export function saveProfile_local(profil) {
  var normalized = Object.assign({}, profil, {
    teams: Array.isArray(profil.teams) ? profil.teams : [],
    tournaments: Array.isArray(profil.tournaments) ? profil.tournaments : []
  });
  _profileCache = normalized;
  localStorage.setItem(PROFIL_KEY, JSON.stringify(normalized));
}

export async function fetchProfileFromSupabase() {
  try {
    var row = await fetchProfil(getUserId());
    if (row) {
      var p = {
        name: row.name || '',
        club: row.club || '',
        position: row.position || '',
        teams: row.team || [],
        favoriteTeam: row.favorite_team || '',
        tournaments: row.tournaments || [],
        favoriteTournament: row.favorite_tournament || '',
        avatar: row.avatar_url || ''
      };
      saveProfile_local(p);
      return p;
    }
  } catch(e) { console.warn('fetchProfileFromSupabase failed, using local cache:', e); }
  return getProfile();
}

export async function saveProfileToSupabase(profil) {
  try {
    await upsertProfil({
      id: getUserId(),
      name: profil.name,
      club: profil.club,
      team: profil.teams,
      favorite_team: profil.favoriteTeam || '',
      tournaments: profil.tournaments || [],
      favorite_tournament: profil.favoriteTournament || '',
      avatar_url: profil.avatar || '',
      updated_at: new Date().toISOString()
    });
  } catch(e) { console.warn('saveProfileToSupabase failed:', e); }
}

export async function saveProfile() {
  var remote = await fetchProfileFromSupabase();
  var profil = {
    name: document.getElementById('profil-name').value.trim(),
    club: document.getElementById('profil-club').value.trim(),
    position: document.getElementById('profil-posisjon').value.trim(),
    teams: remote.teams || [],
    favoriteTeam: remote.favoriteTeam || '',
    tournaments: remote.tournaments || [],
    favoriteTournament: remote.favoriteTournament || '',
    avatar: remote.avatar || ''
  };
  saveProfile_local(profil);
  await saveProfileToSupabase(profil);
  updateAvatar();
  document.dispatchEvent(new CustomEvent('athlytics:renderProfileLists'));
  renderLogSub();
  var el = document.getElementById('profil-saved');
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
  showToast(t('toast_profile_saved'), 'success');
  updateProfilePrompt();
}

export function loadProfileData(profil) {
  document.getElementById('profil-name').value = profil.name || '';
  document.getElementById('profil-club').value = profil.club || '';
  document.getElementById('profil-posisjon').value = profil.position || '';
  var nameEl = document.getElementById('avatar-name');
  var clubEl = document.getElementById('avatar-club');
  nameEl.textContent = profil.name || '';
  nameEl.style.display = profil.name ? '' : 'none';
  clubEl.textContent = profil.club || '';
  clubEl.style.display = profil.club ? '' : 'none';
  showAvatarImage(profil.avatar || '');
  document.dispatchEvent(new CustomEvent('athlytics:renderProfileLists'));
  updateProfilePrompt();
}

export function updateAvatar() {
  var name = document.getElementById('profil-name').value.trim();
  var club = document.getElementById('profil-club').value.trim();
  var nameEl = document.getElementById('avatar-name');
  var clubEl = document.getElementById('avatar-club');
  nameEl.textContent = name || '';
  nameEl.style.display = name ? '' : 'none';
  clubEl.textContent = club || '';
  clubEl.style.display = club ? '' : 'none';
}

export function uploadImage(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var base64 = e.target.result;
    var profil = getProfile();
    profil.avatar = base64;
    saveProfile_local(profil);
    showAvatarImage(base64);
  };
  reader.readAsDataURL(file);
}

export function showAvatarImage(src) {
  var img = document.getElementById('avatar-img');
  var emoji = document.getElementById('avatar-emoji');
  var hint = document.getElementById('avatar-upload-hint');
  if (src) {
    img.src = src;
    img.style.display = 'block';
    emoji.style.display = 'none';
    hint.textContent = t('avatar_change');
  } else {
    img.style.display = 'none';
    emoji.style.display = '';
    hint.textContent = t('avatar_upload');
  }
}

export function renderLogSub() {
  var profil = getProfile();
  var sub = profil.name ? (t('log_greeting') + ', ' + profil.name.split(' ')[0] + '! 🟢') : t('log_ready');
  var el = document.getElementById('log-sub');
  if (el) el.textContent = sub;
}


