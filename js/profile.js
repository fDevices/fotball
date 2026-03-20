import { PROFIL_KEY } from './config.js';
import { getUserId, isAuthenticated } from './auth.js';
import { fetchProfil, upsertProfil, uploadAvatar } from './supabase.js';
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
      // Legacy cleanup: clear base64 avatars stored before Storage migration.
      // saveProfile_local inside the if-block fires immediately (so cache is clean
      // even if the upsertProfil network call below fails). The saveProfile_local
      // outside the if-block is the normal-path save — both are intentional.
      if (isAuthenticated() && p.avatar && p.avatar.startsWith('data:')) {
        p.avatar = '';
        saveProfile_local(p);
        upsertProfil({ id: getUserId(), avatar_url: '' }).catch(function() {});
      }
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

export async function uploadImage(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];

  // Authenticated path: compress + upload to Supabase Storage
  if (isAuthenticated()) {
    if (!file.type.startsWith('image/')) {
      showToast(t('toast_avatar_invalid_type'), 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('toast_avatar_too_large'), 'error');
      return;
    }
    try {
      // Load image (async)
      var img = await new Promise(function(resolve, reject) {
        var image = new Image();
        var objectUrl = URL.createObjectURL(file);
        image.onload = function() { URL.revokeObjectURL(objectUrl); resolve(image); };
        image.onerror = function() { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
        image.src = objectUrl;
      });

      // Compress via canvas (fit-within 800x800, no cropping)
      var MAX = 800;
      var scale = Math.min(1, MAX / img.width, MAX / img.height);
      var canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

      // Export as JPEG blob (async)
      var blob = await new Promise(function(resolve) {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });
      if (!blob) throw new Error('Canvas toBlob returned null');

      // Upload to Storage
      var publicUrl = await uploadAvatar(getUserId(), blob);

      // Persist: Supabase first, then local cache
      var profil = getProfile();
      profil.avatar = publicUrl;
      await saveProfileToSupabase(profil);
      saveProfile_local(profil);
      showAvatarImage(publicUrl + '?t=' + Date.now());
    } catch (err) {
      console.warn('Avatar upload failed:', err);
      showToast(t('toast_avatar_upload_failed'), 'error');
    }
    return;
  }

  // Unauthenticated path: base64 in localStorage (unchanged)
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


