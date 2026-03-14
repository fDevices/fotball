import { PROFIL_KEY } from './config.js';
import { fetchProfil, upsertProfil } from './supabase.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';
import { getSettings } from './settings.js';

var _profileCache = null;

export function getProfile() {
  if (_profileCache) return _profileCache;
  try {
    _profileCache = JSON.parse(localStorage.getItem(PROFIL_KEY)) ||
      { name: '', club: '', posisjon: '', team: [], favoriteTeam: '', tournaments: [], favoriteTournament: '' };
  } catch(e) {
    _profileCache = { name: '', club: '', posisjon: '', team: [], favoriteTeam: '', tournaments: [], favoriteTournament: '' };
  }
  return _profileCache;
}

export function saveProfile_local(profil) {
  var normalized = Object.assign({}, profil, {
    team: Array.isArray(profil.team) ? profil.team : [],
    tournaments: Array.isArray(profil.tournaments) ? profil.tournaments : []
  });
  _profileCache = normalized;
  localStorage.setItem(PROFIL_KEY, JSON.stringify(normalized));
}

export async function fetchProfileFromSupabase() {
  try {
    var row = await fetchProfil();
    if (row) {
      var p = {
        name: row.name || '',
        club: row.club || '',
        posisjon: row.posisjon || '',
        team: row.team || [],
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
      id: 'default',
      name: profil.name,
      club: profil.club,
      posisjon: profil.posisjon,
      team: profil.team,
      favorite_team: profil.favoriteTeam || '',
      tournaments: profil.tournaments || [],
      favorite_tournament: profil.favoriteTournament || '',
      avatar_url: profil.avatar || '',
      updated_at: new Date().toISOString()
    });
  } catch(e) { console.log('Supabase profil error:', e); }
}

export async function saveProfile() {
  var remote = await fetchProfileFromSupabase();
  var profil = {
    name: document.getElementById('profil-name').value.trim(),
    club: document.getElementById('profil-club').value.trim(),
    posisjon: document.getElementById('profil-posisjon').value.trim(),
    team: remote.team || [],
    favoriteTeam: remote.favoriteTeam || '',
    tournaments: remote.tournaments || [],
    favoriteTournament: remote.favoriteTournament || '',
    avatar: remote.avatar || ''
  };
  saveProfile_local(profil);
  await saveProfileToSupabase(profil);
  updateAvatar();
  renderProfileTeamList();
  renderLogSub();
  var el = document.getElementById('profil-saved');
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
  showToast(t('toast_profile_saved'), 'success');
}

export function loadProfileData(profil) {
  document.getElementById('profil-name').value = profil.name || '';
  document.getElementById('profil-club').value = profil.club || '';
  document.getElementById('profil-posisjon').value = profil.posisjon || '';
  var nameEl = document.getElementById('avatar-name');
  var clubEl = document.getElementById('avatar-club');
  nameEl.textContent = profil.name || '';
  nameEl.style.display = profil.name ? '' : 'none';
  clubEl.textContent = profil.club || '';
  clubEl.style.display = profil.club ? '' : 'none';
  showAvatarImage(profil.avatar || '');
  renderProfileTeamList();
  renderProfileTournamentList();
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
    hint.textContent = 'Trykk for å bytte bilde';
  } else {
    img.style.display = 'none';
    emoji.style.display = '';
    hint.textContent = 'Trykk for å laste opp bilde';
  }
}

export function renderLogSub() {
  var profil = getProfile();
  var s = getSettings();
  var isEn = s.lang === 'en';
  var greeting = isEn ? 'Hi' : 'Hei';
  var ready = isEn ? 'Ready to log match 🟢' : 'Klar til å logge kamp 🟢';
  var sub = profil.name ? (greeting + ', ' + profil.name.split(' ')[0] + '! 🟢') : ready;
  document.getElementById('log-sub').textContent = sub;
}

export function renderProfileTeamList() {
  var profil = getProfile();
  var list = document.getElementById('profile-team-list');
  if (!profil.team.length) {
    list.innerHTML = '<div class="team-list-empty">Ingen team lagt til ennå</div>';
    return;
  }
  var favoritt = profil.favoriteTeam || '';
  list.innerHTML = profil.team.map(function(name) {
    var isFav = name === favoritt;
    return '<div class="team-list-item">' +
      '<button class="team-star ' + (isFav ? 'active' : '') + '" data-action="setFavoriteTeam" data-name="' + esc(name) + '">' + (isFav ? '&#9733;' : '&#9734;') + '</button>' +
      '<span class="team-list-name' + (isFav ? ' favoritt' : '') + '">' + esc(name) + (isFav ? ' <span class="team-fav-badge">standard</span>' : '') + '</span>' +
      '<button class="team-list-del" data-action="deleteTeam" data-name="' + esc(name) + '">×</button>' +
    '</div>';
  }).join('');
}

export function renderProfileTournamentList() {
  var profil = getProfile();
  var list = document.getElementById('profile-tournament-list');
  if (!list) return;
  if (!profil.tournaments || !profil.tournaments.length) {
    list.innerHTML = '<div class="team-list-empty">Ingen tournaments enda</div>';
    return;
  }
  var fav = profil.favoriteTournament || '';
  list.innerHTML = '';
  profil.tournaments.forEach(function(name) {
    var isFav = name === fav;
    var div = document.createElement('div');
    div.className = 'team-list-item';
    var starBtn = document.createElement('button');
    starBtn.className = 'team-star' + (isFav ? ' active' : '');
    starBtn.textContent = isFav ? '\u2605' : '\u2606';
    starBtn.dataset.action = 'setFavoriteTournament';
    starBtn.dataset.name = name;
    var nameSpan = document.createElement('span');
    nameSpan.className = 'team-list-name' + (isFav ? ' favoritt' : '');
    nameSpan.textContent = name;
    if (isFav) {
      var badge = document.createElement('span');
      badge.className = 'team-fav-badge';
      badge.textContent = 'standard';
      nameSpan.appendChild(badge);
    }
    var delBtn = document.createElement('button');
    delBtn.className = 'team-list-del';
    delBtn.textContent = '\xd7';
    delBtn.dataset.action = 'deleteTournament';
    delBtn.dataset.name = name;
    div.appendChild(starBtn);
    div.appendChild(nameSpan);
    div.appendChild(delBtn);
    list.appendChild(div);
  });
}
