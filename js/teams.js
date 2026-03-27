import { getProfile, saveProfile_local, saveProfileToSupabase } from './profile.js';
import { showToast } from './toast.js';
import { esc } from './utils.js';
import { t } from './i18n.js';

// ── Log-screen team dropdown ─────────────────────────────────────────────────

var selectedTeam = '';
var teamDropdownOpen = false;
var showNewTeamInput = false;

export function getSelectedTeam() { return selectedTeam; }

export function toggleTeamDropdown() {
  teamDropdownOpen = !teamDropdownOpen;
  var dd = document.getElementById('team-dropdown');
  var sel = document.getElementById('team-selected');
  var chev = document.getElementById('team-chevron');
  if (dd) dd.classList.toggle('open', teamDropdownOpen);
  if (sel) sel.classList.toggle('open', teamDropdownOpen);
  if (chev) chev.classList.toggle('open', teamDropdownOpen);
  if (sel) sel.setAttribute('aria-expanded', teamDropdownOpen ? 'true' : 'false');
  if (teamDropdownOpen) renderTeamDropdown();
}

function closeLagDropdown() {
  teamDropdownOpen = false;
  showNewTeamInput = false;
  var dd = document.getElementById('team-dropdown');
  var sel = document.getElementById('team-selected');
  var chev = document.getElementById('team-chevron');
  var nr = document.getElementById('team-new-row');
  if (dd) dd.classList.remove('open');
  if (sel) sel.classList.remove('open');
  if (chev) chev.classList.remove('open');
  if (sel) sel.setAttribute('aria-expanded', 'false');
  if (nr) nr.classList.remove('visible');
}

export function renderTeamDropdown() {
  var profil = getProfile();
  var list = document.getElementById('team-options-list');
  if (!list) return;
  list.innerHTML = '';
  (profil.teams || []).forEach(function(name) {
    var div = document.createElement('div');
    div.className = 'team-option' + (selectedTeam === name ? ' selected' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', selectedTeam === name ? 'true' : 'false');
    div.dataset.action = 'selectTeam';
    div.dataset.name = name;
    div.textContent = name;
    if (selectedTeam === name) {
      var check = document.createElement('span');
      check.style.color = 'var(--lime)';
      check.textContent = '\u2713';
      div.appendChild(check);
    }
    list.appendChild(div);
  });
  var addDiv = document.createElement('div');
  addDiv.className = 'team-option team-option-add';
  addDiv.dataset.action = 'toggleNewTeamInput';
  addDiv.textContent = t('nytt_lag');
  list.appendChild(addDiv);
}

export function selectTeam(name) {
  selectedTeam = name;
  var txt = document.getElementById('team-selected-text');
  if (txt) { txt.textContent = name; txt.classList.remove('placeholder'); }
  closeLagDropdown();
}

export function toggleNewTeamInput() {
  showNewTeamInput = !showNewTeamInput;
  var nr = document.getElementById('team-new-row');
  if (nr) nr.classList.toggle('visible', showNewTeamInput);
  if (showNewTeamInput) setTimeout(function() { var inp = document.getElementById('team-new-input'); if (inp) inp.focus(); }, 50);
}

export function saveNewTeamFromDropdown() {
  var input = document.getElementById('team-new-input');
  var name = input.value.trim();
  if (!name) return;
  var profil = getProfile();
  if (!profil.teams.some(function(t) { return t.toLowerCase() === name.toLowerCase(); })) {
    profil.teams.push(name);
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    renderProfileTeamList();
  }
  input.value = '';
  selectTeam(name);
}

export function addTeamFromProfile() {
  var input = document.getElementById('profile-team-input');
  var name = input.value.trim();
  if (!name) return;
  var profil = getProfile();
  if (profil.teams.some(function(tm) { return tm.toLowerCase() === name.toLowerCase(); })) { showToast(t('toast_lag_finnes'), 'error'); return; }
  profil.teams.push(name);
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  input.value = '';
  renderProfileTeamList();
  renderTeamDropdown();
  showToast(t('toast_team_added'), 'success');
}

export function deleteTeam(name) {
  var profil = getProfile();
  profil.teams = profil.teams.filter(function(l) { return l !== name; });
  if (profil.favoriteTeam === name) profil.favoriteTeam = '';
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  renderProfileTeamList();
  renderTeamDropdown();
}

export function setFavoriteTeam(name) {
  var profil = getProfile();
  profil.favoriteTeam = (profil.favoriteTeam === name) ? '' : name;
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  renderProfileTeamList();
  renderTeamDropdown();
  // Intentional: marking a favorite also activates it as the current filter selection
  if (profil.favoriteTeam) selectTeam(profil.favoriteTeam);
}

// ── Log-screen tournament dropdown ──────────────────────────────────────────

var selectedTournament = '';
var showNewTournamentInput = false;

export function getSelectedTournament() { return selectedTournament; }

export function toggleTournamentDropdown() {
  var dd = document.getElementById('tournament-dropdown');
  if (dd) {
    var isOpen = dd.classList.contains('open');
    dd.classList.toggle('open', !isOpen);
    var chev = document.getElementById('tournament-chevron');
    if (chev) chev.classList.toggle('open', !isOpen);
    var trigger = document.getElementById('tournament-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
  }
}

export function selectTournament(name) {
  selectedTournament = name;
  var sel = document.getElementById('tournament-selected-text');
  if (sel) {
    sel.textContent = name || '\u2014 Velg turnering \u2014';
    sel.classList.toggle('placeholder', !name);
    sel._selected = !!name;
  }
  var dd = document.getElementById('tournament-dropdown');
  if (dd) dd.classList.remove('open');
  var chev = document.getElementById('tournament-chevron');
  if (chev) chev.classList.remove('open');
  var trigger = document.getElementById('tournament-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  showNewTournamentInput = false;
  var newRow = document.getElementById('tournament-new-row');
  if (newRow) newRow.classList.remove('visible');
  renderTournamentDropdown();
}

export function renderTournamentDropdown() {
  var profil = getProfile();
  var list = document.getElementById('tournament-options-list');
  if (!list) return;
  list.innerHTML = '';
  if (selectedTournament) {
    var resetDiv = document.createElement('div');
    resetDiv.className = 'team-option team-option-reset';
    resetDiv.innerHTML = '<span style="color:var(--muted)">\u2715</span> ' + t('tournament_reset');
    resetDiv.dataset.action = 'selectTournament';
    resetDiv.dataset.name = '';
    list.appendChild(resetDiv);
  }
  var tournamentList = profil.tournaments || [];
  if (selectedTournament && !tournamentList.includes(selectedTournament)) {
    tournamentList = [selectedTournament].concat(tournamentList);
  }
  tournamentList.forEach(function(name) {
    var div = document.createElement('div');
    div.className = 'team-option' + (selectedTournament === name ? ' selected' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', selectedTournament === name ? 'true' : 'false');
    div.innerHTML = esc(name) + (selectedTournament === name ? ' <span style="color:var(--lime)">\u2713</span>' : '');
    div.dataset.action = 'selectTournament';
    div.dataset.name = name;
    list.appendChild(div);
  });
  var addDiv = document.createElement('div');
  addDiv.className = 'team-option team-option-add';
  addDiv.innerHTML = '<span>\uff0b</span> ' + t('tournament_new');
  addDiv.dataset.action = 'toggleNewTournamentInput';
  list.appendChild(addDiv);
}

export function toggleNewTournamentInput() {
  showNewTournamentInput = !showNewTournamentInput;
  var nr = document.getElementById('tournament-new-row');
  if (nr) nr.classList.toggle('visible', showNewTournamentInput);
  if (showNewTournamentInput) setTimeout(function() { var inp = document.getElementById('tournament-new-input'); if (inp) inp.focus(); }, 50);
}

export function saveNewTournamentFromDropdown() {
  var input = document.getElementById('tournament-new-input');
  var name = input.value.trim();
  if (!name) return;
  var profil = getProfile();
  if (!profil.tournaments) profil.tournaments = [];
  if (!profil.tournaments.some(function(t) { return t.toLowerCase() === name.toLowerCase(); })) {
    profil.tournaments.push(name);
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    renderProfileTournamentList();
  }
  input.value = '';
  showNewTournamentInput = false;
  document.getElementById('tournament-new-row').classList.remove('visible');
  selectTournament(name);
}

export function addTournament() {
  var input = document.getElementById('profile-new-tournament');
  var name = input ? input.value.trim() : '';
  if (!name) return;
  var profil = getProfile();
  if (!profil.tournaments) profil.tournaments = [];
  if (profil.tournaments.some(function(tn) { return tn.toLowerCase() === name.toLowerCase(); })) { showToast(t('toast_tournament_exists'), 'error'); return; }
  profil.tournaments.push(name);
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  if (input) input.value = '';
  renderProfileTournamentList();
  renderTournamentDropdown();
  showToast(t('toast_tournament_added'), 'success');
}

export function deleteTournament(name) {
  var profil = getProfile();
  profil.tournaments = profil.tournaments.filter(function(tn) { return tn !== name; });
  if (profil.favoriteTournament === name) profil.favoriteTournament = '';
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  if (selectedTournament === name) selectTournament('');
  renderProfileTournamentList();
  renderTournamentDropdown();
}

export function setFavoriteTournament(name) {
  var profil = getProfile();
  profil.favoriteTournament = (profil.favoriteTournament === name) ? '' : name;
  saveProfile_local(profil);
  saveProfileToSupabase(profil);
  renderProfileTournamentList();
  renderTournamentDropdown();
  // Intentional: marking a favorite also activates it as the current filter selection
  if (profil.favoriteTournament) selectTournament(profil.favoriteTournament);
}

// ── Modal dropdowns ──────────────────────────────────────────────────────────

var modalSelectedTeam = '';
var modalSelectedTournament = '';

export function getModalSelectedTeam() { return modalSelectedTeam; }
export function getModalSelectedTournament() { return modalSelectedTournament; }

export function renderModalTeamDropdown() {
  var profil = getProfile();
  var list = document.getElementById('modal-team-options-list');
  if (!list) return;
  list.innerHTML = '';
  var teamList = profil.teams || [];
  if (modalSelectedTeam && !teamList.includes(modalSelectedTeam)) teamList = [modalSelectedTeam].concat(teamList);
  teamList.forEach(function(name) {
    var div = document.createElement('div');
    div.className = 'team-option' + (modalSelectedTeam === name ? ' selected' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', modalSelectedTeam === name ? 'true' : 'false');
    div.innerHTML = esc(name) + (modalSelectedTeam === name ? ' <span style="color:var(--lime)">\u2713</span>' : '');
    div.dataset.action = 'selectModalTeam';
    div.dataset.name = name;
    list.appendChild(div);
  });
}

export function selectModalTeam(name) {
  modalSelectedTeam = name;
  document.getElementById('modal-own-team').value = name;
  var txt = document.getElementById('modal-own-team-text');
  if (txt) { txt.textContent = name || t('select_team'); txt.classList.toggle('placeholder', !name); }
  var dd = document.getElementById('modal-team-dropdown');
  if (dd) dd.classList.remove('open');
  var chev = document.getElementById('modal-team-chevron');
  if (chev) chev.classList.remove('open');
  var trigger = document.getElementById('modal-team-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  renderModalTeamDropdown();
}

export function toggleModalTeamDropdown() {
  var dd = document.getElementById('modal-team-dropdown');
  var chev = document.getElementById('modal-team-chevron');
  if (dd) {
    var isOpen = dd.classList.toggle('open');
    if (chev) chev.classList.toggle('open', isOpen);
    var trigger = document.getElementById('modal-team-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

export function renderModalTournamentDropdown() {
  var profil = getProfile();
  var list = document.getElementById('modal-tournament-options-list');
  if (!list) return;
  list.innerHTML = '';
  var tournamentList = profil.tournaments || [];
  if (modalSelectedTournament && !tournamentList.includes(modalSelectedTournament)) {
    tournamentList = [modalSelectedTournament].concat(tournamentList);
  }
  tournamentList.forEach(function(name) {
    var div = document.createElement('div');
    div.className = 'team-option' + (modalSelectedTournament === name ? ' selected' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', modalSelectedTournament === name ? 'true' : 'false');
    div.innerHTML = esc(name) + (modalSelectedTournament === name ? ' <span style="color:var(--lime)">\u2713</span>' : '');
    div.dataset.action = 'selectModalTournament';
    div.dataset.name = name;
    list.appendChild(div);
  });
}

export function selectModalTournament(name) {
  modalSelectedTournament = name;
  document.getElementById('modal-tournament').value = name;
  var txt = document.getElementById('modal-tournament-text');
  if (txt) { txt.textContent = name || t('select_tournament'); txt.classList.toggle('placeholder', !name); }
  var dd = document.getElementById('modal-tournament-dropdown');
  if (dd) dd.classList.remove('open');
  var chev = document.getElementById('modal-tournament-chevron');
  if (chev) chev.classList.remove('open');
  var trigger = document.getElementById('modal-tournament-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  renderModalTournamentDropdown();
}

export function toggleModalTournamentDropdown() {
  var dd = document.getElementById('modal-tournament-dropdown');
  var chev = document.getElementById('modal-tournament-chevron');
  if (dd) {
    var isOpen = dd.classList.toggle('open');
    if (chev) chev.classList.toggle('open', isOpen);
    var trigger = document.getElementById('modal-tournament-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

export function closeAllDropdowns() {
  document.querySelectorAll('.team-option.dropdown-highlight').forEach(function(el) {
    el.classList.remove('dropdown-highlight');
  });
  var tdd = document.getElementById('tournament-dropdown');
  if (tdd) tdd.classList.remove('open');
  var tchev = document.getElementById('tournament-chevron');
  if (tchev) tchev.classList.remove('open');
  ['modal-team-dropdown', 'modal-tournament-dropdown'].forEach(function(id) {
    var dd = document.getElementById(id);
    if (dd) dd.classList.remove('open');
  });
  // Also close team dropdown
  teamDropdownOpen = false;
  var td = document.getElementById('team-dropdown');
  if (td) td.classList.remove('open');
  var ts = document.getElementById('team-selected');
  if (ts) ts.classList.remove('open');
  var tch = document.getElementById('team-chevron');
  if (tch) tch.classList.remove('open');
  var tnr = document.getElementById('team-new-row');
  if (tnr) tnr.classList.remove('visible');
  showNewTeamInput = false;
  var tournNr = document.getElementById('tournament-new-row');
  if (tournNr) tournNr.classList.remove('visible');
  showNewTournamentInput = false;
  ['team-selected', 'tournament-trigger', 'modal-team-trigger', 'modal-tournament-trigger'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('aria-expanded', 'false');
  });
}

// ── Profile list rendering ───────────────────────────────────────────────────

export function renderProfileTeamList() {
  var profil = getProfile();
  var list = document.getElementById('profile-team-list');
  if (!list) return;
  list.innerHTML = '';
  if (!profil.teams || !profil.teams.length) {
    list.innerHTML = '<div class="team-list-empty">' + t('no_teams_yet') + '</div>';
    return;
  }
  var favoritt = profil.favoriteTeam || '';
  profil.teams.forEach(function(name) {
    var isFav = name === favoritt;
    var div = document.createElement('div');
    div.className = 'team-list-item';
    var starBtn = document.createElement('button');
    starBtn.className = 'team-star' + (isFav ? ' active' : '');
    starBtn.textContent = isFav ? '\u2605' : '\u2606';
    starBtn.dataset.action = 'setFavoriteTeam';
    starBtn.dataset.name = name;
    var nameSpan = document.createElement('span');
    nameSpan.className = 'team-list-name' + (isFav ? ' favoritt' : '');
    nameSpan.textContent = name;
    if (isFav) {
      var badge = document.createElement('span');
      badge.className = 'team-fav-badge';
      badge.textContent = t('standard_badge');
      nameSpan.appendChild(badge);
    }
    var delBtn = document.createElement('button');
    delBtn.className = 'team-list-del';
    delBtn.textContent = '\xd7';
    delBtn.dataset.action = 'deleteTeam';
    delBtn.dataset.name = name;
    div.appendChild(starBtn);
    div.appendChild(nameSpan);
    div.appendChild(delBtn);
    list.appendChild(div);
  });
}

export function renderProfileTournamentList() {
  var profil = getProfile();
  var list = document.getElementById('profile-tournament-list');
  if (!list) return;
  list.innerHTML = '';
  if (!profil.tournaments || !profil.tournaments.length) {
    list.innerHTML = '<div class="team-list-empty">' + t('no_tournaments_yet') + '</div>';
    return;
  }
  var fav = profil.favoriteTournament || '';
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
      badge.textContent = t('standard_badge');
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
