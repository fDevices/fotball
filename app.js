  const SUPABASE_URL = 'https://gjxsebeajcrmseraypyw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_gkIN7XSAzQVKS9lpqj6LYQ_vV8G3VRe';
  const CACHE_KEY    = 'athlytics_kamper';
  const PROFIL_KEY   = 'athlytics_profil';
  const SETTINGS_KEY = 'athlytics_settings';

  // ── In-memory caches (avoid repeated JSON.parse on every call) ──────────
  var _profileCache = null;
  var _settingsCache = null;

  // ── i18n ─────────────────────────────────────────────────────────────────
  const TEKST = {
    no: {
      tab_log:'Logg', tab_stats:'Statistikk', tab_profile:'Profil', tab_settings:'Settings',
      date:'Dato', opponentTeam:'Motstanderlag', own_team:'Eget team / tropp',
      turnering:'Turnering / serie', goals:'Mål', assist:'Assist',
      hjemmekamp:'🏠 Hjemmekamp', bortekamp:'✈️ Bortekamp', save_match:'Lagre kamp',
      home_label:'Hjemmelag', away_label:'Bortelag',
      match_type_label:'Hjemme eller away?', result_label:'Resultat',
      ph_opponent:'F.eks. Brann IL', ph_tournament:'F.eks. Kretscup, seriespill...',
      select_team:'— Velg team —', nytt_lag:'＋ Nytt team...',
      select_tournament:'— Velg turnering —',
      res_win:'🏆 Seier', res_uavgjort:'🤝 Uavgjort', res_tap:'💪 Tap',
      alle_lag:'Alle team', match_history:'Kamphistorikk', no_matches:'Ingen matches denne the_season',
      snitt:'snitt/kamp', h_short:'H', b_short:'B',
      profile_sub:'Innstillinger og team', avatar_upload:'Trykk for å laste opp bilde',
      spillerinfo:'Spillerinfo', name:'Navn', club:'Klubb', posisjon:'Posisjon',
      ph_navn:'Fullt name', ph_klubb:'F.eks. Stabæk', ph_posisjon:'F.eks. Midtbane',
      mine_lag:'Mine team / tropper', ph_add_team:'Legg til team...', add_item:'Legg til',
      save_profile:'Lagre profil', standard_badge:'standard',
      settings_sub:'Tilpass Athlytics Sport',
      lang_title:'🌍 Språk', lang_desc:'Velg språk for appen.',
      sport_title:'🏅 Sport', sport_desc:'Velg hvilken sport du primært tracker. Flere sporter kommer snart.',
      sf_title:'📅 Sesongformat', sf_desc:'Norsk format bruker kalenderår (2025). Internasjonalt format bruker sesong (2025–2026).',
      as_title:'⭐ Aktiv sesong', as_desc:'Forhåndsvalgt sesong i Logg og Statistikk.',
      no_seasons:'Ingen seasons enda – legg til nedenfor',
      ph_new_season:'Legg til sesong (f.eks. 2027)',
      format_aar:'📅 År (2025)', format_season:'🗓️ Sesong (2025–2026)',
      sport_fotball:'⚽ Fotball', sport_ori:'🧭 Orientering', sport_ski:'⛷️ Ski', snart:'snart',
      modal_rediger:'Rediger kamp', save_changes:'Lagre endringer', delete_btn:'🗑 Slett',
      toast_profile_saved:'✓ Profil saved', toast_lag_finnes:'Laget finnes allerede',
      toast_fyll_inn:'Fyll inn date, opponent og velg team', toast_match_saved:'⚽ Kamp saved!',
      toast_nettverksfeil:'Nettverksfeil – prøv igjen', toast_sport_updated:'Sport oppdatert',
      toast_active_season:'⭐ Aktiv sesong: ', toast_ugyldig_aar:'Skriv inn et gyldig årstall',
      toast_season_exists:'Sesongen finnes allerede', toast_season_added:'✓ Sesong lagt til',
      toast_match_updated:'✓ Kamp oppdatert', toast_feil_lagring:'Feil ved lagring',
      toast_match_deleted:'🗑 Kamp slettet', toast_delete_error:'Feil ved sletting',
      toast_nettverksfeil_kort:'Nettverksfeil',
    },
    en: {
      tab_log:'Log', tab_stats:'Stats', tab_profile:'Profile', tab_settings:'Settings',
      date:'Date', opponentTeam:'Opponent', own_team:'My team / squad',
      turnering:'Tournament / league', goals:'Goals', assist:'Assists',
      hjemmekamp:'🏠 Home', bortekamp:'✈️ Away', save_match:'Save match',
      home_label:'Home', away_label:'Away',
      match_type_label:'Home or away?', result_label:'Result',
      ph_opponent:'E.g. Arsenal FC', ph_tournament:'E.g. Cup, league...',
      select_team:'— Select team —', nytt_lag:'＋ New team...',
      select_tournament:'— Select tournament —',
      res_win:'🏆 Win', res_uavgjort:'🤝 Draw', res_tap:'💪 Loss',
      alle_lag:'All teams', match_history:'Match history', no_matches:'No matches this season',
      snitt:'avg/match', h_short:'H', b_short:'A',
      profile_sub:'Settings and teams', avatar_upload:'Tap to upload photo',
      spillerinfo:'Player info', name:'Name', club:'Club', posisjon:'Position',
      ph_navn:'Full name', ph_klubb:'E.g. Arsenal', ph_posisjon:'E.g. Midfielder',
      mine_lag:'My teams / squads', ph_add_team:'Add team...', add_item:'Add',
      save_profile:'Save profile', standard_badge:'default',
      settings_sub:'Customize Athlytics Sport',
      lang_title:'🌍 Language', lang_desc:'Choose language for the app.',
      sport_title:'🏅 Sport', sport_desc:'Choose your primary sport. More sports coming soon.',
      sf_title:'📅 Season format', sf_desc:'Norwegian format uses calendar year (2025). International uses season (2025–2026).',
      as_title:'⭐ Active season', as_desc:'Pre-selected season in Log and Stats.',
      no_seasons:'No seasons yet – add one below',
      ph_new_season:'Add season (e.g. 2027)',
      format_aar:'📅 Year (2025)', format_season:'🗓️ Season (2025–2026)',
      sport_fotball:'⚽ Football', sport_ori:'🧭 Orienteering', sport_ski:'⛷️ Skiing', snart:'soon',
      modal_rediger:'Edit match', save_changes:'Save changes', delete_btn:'🗑 Delete',
      toast_profile_saved:'✓ Profile saved', toast_lag_finnes:'Team already exists',
      toast_fyll_inn:'Fill in date, opponent and select team', toast_match_saved:'⚽ Match saved!',
      toast_nettverksfeil:'Network error – try again', toast_sport_updated:'Sport updated',
      toast_active_season:'⭐ Active season: ', toast_ugyldig_aar:'Enter a valid year',
      toast_season_exists:'Season already exists', toast_season_added:'✓ Season added',
      toast_match_updated:'✓ Match updated', toast_feil_lagring:'Error saving',
      toast_match_deleted:'🗑 Match deleted', toast_delete_error:'Error deleting',
      toast_nettverksfeil_kort:'Network error',
    }
  };
  function t(key) {
    var lang = (_settingsCache || getSettings()).lang || 'no';
    return (TEKST[lang] || TEKST.no)[key] || TEKST.no[key] || key;
  }

  // ════════════════════════════════ PROFIL ════════════════════════════════

  function getProfile() {
    if (_profileCache) return _profileCache;
    try { _profileCache = JSON.parse(localStorage.getItem(PROFIL_KEY)) || { name: '', club: '', posisjon: '', team: [], favoriteTeam: '' }; }
    catch(e) { _profileCache = { name: '', club: '', posisjon: '', team: [], favoriteTeam: '', tournaments: [], favoriteTournament: '' }; }
    return _profileCache;
  }

  function saveProfile_local(profil) {
    _profileCache = profil;
    saveProfile_local(profil);
  }

  async function fetchProfileFromSupabase() {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/profiler?id=eq.default&select=*', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      var data = await res.json();
      if (data && data[0]) {
        var p = {
          name: data[0].name || '',
          club: data[0].club || '',
          posisjon: data[0].posisjon || '',
          team: data[0].team || [],
          favoriteTeam: data[0].favorite_team || '',
          tournaments: data[0].tournaments || [],
          favoriteTournament: data[0].favorite_tournament || '',
          avatar: data[0].avatar_url || ''
        };
        saveProfile_local(p);
        return p;
      }
    } catch(e) {}
    return getProfile();
  }

  async function saveProfileToSupabase(profil) {
    try {
      await fetch(SUPABASE_URL + '/rest/v1/profiler', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: 'default',
          name: profil.name,
          club: profil.club,
          posisjon: profil.posisjon,
          team: profil.team,
          favorite_team: profil.favoriteTeam || '',
          tournaments: profil.tournaments || [],
          favorite_tournament: profil.favoriteTournament || '',
          avatar_url: profil.avatar || '',
          oppdatert: new Date().toISOString()
        })
      });
    } catch(e) { console.log('Supabase profil feil:', e); }
  }

  function uploadImage(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      // Save to localStorage
      const profil = getProfile();
      profil.avatar = base64;
      saveProfile_local(profil);
      // Show image
      showAvatarImage(base64);
    };
    reader.readAsDataURL(file);
  }

  function showAvatarImage(src) {
    const img = document.getElementById('avatar-img');
    const emoji = document.getElementById('avatar-emoji');
    const hint = document.getElementById('avatar-upload-hint');
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

  async function saveProfile() {
    const profil = {
      name: document.getElementById('profil-name').value.trim(),
      club: document.getElementById('profil-club').value.trim(),
      posisjon: document.getElementById('profil-posisjon').value.trim(),
      team: getProfile().team,
      favoriteTeam: getProfile().favoriteTeam || '',
      avatar: getProfile().avatar || ''
    };
    saveProfile_local(profil);
    await saveProfileToSupabase(profil);
    updateAvatar();
    renderProfileTeamList();
    renderLogSub();
    const el = document.getElementById('profil-saved');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
    showToast('✓ Profil saved', 'success');
  }

  function updateAvatar() {
    const name = document.getElementById('profil-name').value.trim();
    const club = document.getElementById('profil-club').value.trim();
    var nameEl = document.getElementById('avatar-name');
    var clubEl = document.getElementById('avatar-club');
    nameEl.textContent = name || '';
    nameEl.style.display = name ? '' : 'none';
    clubEl.textContent = club || '';
    clubEl.style.display = club ? '' : 'none';
  }

  function addTeamFromProfile() {
    const input = document.getElementById('profile-team-input');
    const name = input.value.trim();
    if (!name) return;
    const profil = getProfile();
    if (profil.team.includes(name)) { showToast('Laget finnes allerede', 'error'); return; }
    profil.team.push(name);
    saveProfile_local(profil);
    input.value = '';
    renderProfileTeamList();
    renderTeamDropdown();
  }

  function deleteTeam(name) {
    const profil = getProfile();
    profil.team = profil.team.filter(l => l !== name);
    if (profil.favoriteTeam === name) profil.favoriteTeam = '';
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    renderProfileTeamList();
    renderTeamDropdown();
  }

  function setFavoriteTeam(name) {
    var profil = getProfile();
    profil.favoriteTeam = (profil.favoriteTeam === name) ? '' : name;
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    renderProfileTeamList();
    renderTeamDropdown();
    if (profil.favoriteTeam) selectTeam(profil.favoriteTeam);
  }

  // ── TURNERING ─────────────────────────────────────────────────────────
  var selectedTournament = '';

  function toggleTournamentDropdown() {
    var dd = document.getElementById('tournament-dropdown');
    if (dd) {
      var isOpen = dd.classList.contains('open');
      dd.classList.toggle('open', !isOpen);
      var chev = document.getElementById('tournament-chevron');
      if (chev) chev.classList.toggle('open', !isOpen);
    }
  }

  function selectTournament(name) {
    selectedTournament = name;
    var sel = document.getElementById('tournament-selected-text');
    if (sel) {
      sel.textContent = name || '— Velg turnering —';
      sel.classList.toggle('placeholder', !name);
    }
    var dd = document.getElementById('tournament-dropdown');
    if (dd) dd.classList.remove('open');
    var chev = document.getElementById('tournament-chevron');
    if (chev) chev.classList.remove('open');
    showNewTournamentInput = false;
    var newRow = document.getElementById('tournament-new-row');
    if (newRow) newRow.classList.remove('visible');
    renderTournamentDropdown();
  }

  var showNewTournamentInput = false;

  function renderTournamentDropdown() {
    var profil = getProfile();
    var list = document.getElementById('tournament-options-list');
    if (!list) return;
    list.innerHTML = '';
    // Include current value even if not in profile
    var tournamentList = profil.tournaments || [];
    if (selectedTournament && !tournamentList.includes(selectedTournament)) tournamentList = [selectedTournament].concat(tournamentList);
    tournamentList.forEach(function(name) {
      var div = document.createElement('div');
      div.className = 'team-option' + (selectedTournament === name ? ' selected' : '');
      div.innerHTML = name + (selectedTournament === name ? ' <span style="color:var(--lime)">✓</span>' : '');
      div.onclick = function() { selectTournament(name); };
      list.appendChild(div);
    });
    var addDiv = document.createElement('div');
    addDiv.className = 'team-option team-option-add';
    addDiv.innerHTML = '<span>＋</span> Ny turnering...';
    addDiv.onclick = function() { toggleNewTournamentInput(); };
    list.appendChild(addDiv);
  }

  function toggleNewTournamentInput() {
    showNewTournamentInput = !showNewTournamentInput;
    document.getElementById('tournament-new-row').classList.toggle('visible', showNewTournamentInput);
    if (showNewTournamentInput) setTimeout(function() { document.getElementById('tournament-new-input').focus(); }, 50);
  }

  function saveNewTournamentFromDropdown() {
    var input = document.getElementById('tournament-new-input');
    var name = input.value.trim();
    if (!name) return;
    var profil = getProfile();
    if (!profil.tournaments) profil.tournaments = [];
    if (!profil.tournaments.includes(name)) {
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

  // ── MODAL LAG + TURNERING DROPDOWNS ──────────────────────────────────
  var modalSelectedTeam = '';
  var modalSelectedTournament = '';

  function renderModalTeamDropdown() {
    var profil = getProfile();
    var list = document.getElementById('modal-team-options-list');
    if (!list) return;
    list.innerHTML = '';
    // Include current value even if not in profile
    var teamList = profil.team || [];
    if (modalSelectedTeam && !teamList.includes(modalSelectedTeam)) teamList = [modalSelectedTeam].concat(teamList);
    teamList.forEach(function(name) {
      var div = document.createElement('div');
      div.className = 'team-option' + (modalSelectedTeam === name ? ' selected' : '');
      div.innerHTML = name + (modalSelectedTeam === name ? ' <span style="color:var(--lime)">✓</span>' : '');
      div.onclick = function() { selectModalTeam(name); };
      list.appendChild(div);
    });
  }

  function selectModalTeam(name) {
    modalSelectedTeam = name;
    document.getElementById('modal-own-team').value = name;
    var txt = document.getElementById('modal-own-team-text');
    if (txt) { txt.textContent = name || 'Velg team...'; txt.classList.toggle('placeholder', !name); }
    var dd = document.getElementById('modal-team-dropdown');
    if (dd) dd.classList.remove('open');
    var chev = document.getElementById('modal-team-chevron');
    if (chev) chev.classList.remove('open');
    renderModalTeamDropdown();
  }

  function toggleModalTeamDropdown() {
    var dd = document.getElementById('modal-team-dropdown');
    var chev = document.getElementById('modal-team-chevron');
    if (dd) { var isOpen = dd.classList.toggle('open'); if (chev) chev.classList.toggle('open', isOpen); }
  }

  function renderModalTournamentDropdown() {
    var profil = getProfile();
    var list = document.getElementById('modal-tournament-options-list');
    if (!list) return;
    list.innerHTML = '';
    // Include current value even if not in profile
    var tournamentList = profil.tournaments || [];
    if (modalSelectedTournament && !tournamentList.includes(modalSelectedTournament)) tournamentList = [modalSelectedTournament].concat(tournamentList);
    tournamentList.forEach(function(name) {
      var div = document.createElement('div');
      div.className = 'team-option' + (modalSelectedTournament === name ? ' selected' : '');
      div.innerHTML = name + (modalSelectedTournament === name ? ' <span style="color:var(--lime)">✓</span>' : '');
      div.onclick = function() { selectModalTournament(name); };
      list.appendChild(div);
    });
  }

  function selectModalTournament(name) {
    modalSelectedTournament = name;
    document.getElementById('modal-tournament').value = name;
    var txt = document.getElementById('modal-tournament-text');
    if (txt) { txt.textContent = name || 'Velg turnering...'; txt.classList.toggle('placeholder', !name); }
    var dd = document.getElementById('modal-tournament-dropdown');
    if (dd) dd.classList.remove('open');
    var chev = document.getElementById('modal-tournament-chevron');
    if (chev) chev.classList.remove('open');
    renderModalTournamentDropdown();
  }

  function toggleModalTournamentDropdown() {
    var dd = document.getElementById('modal-tournament-dropdown');
    var chev = document.getElementById('modal-tournament-chevron');
    if (dd) { var isOpen = dd.classList.toggle('open'); if (chev) chev.classList.toggle('open', isOpen); }
  }

  function addTournament() {
    var input = document.getElementById('profile-new-tournament');
    var name = input ? input.value.trim() : '';
    if (!name) return;
    var profil = getProfile();
    if (!profil.tournaments) profil.tournaments = [];
    if (profil.tournaments.includes(name)) { showToast('Turneringen finnes allerede', 'error'); return; }
    profil.tournaments.push(name);
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    if (input) input.value = '';
    renderProfileTournamentList();
    renderTournamentDropdown();
    showToast('✓ Turnering lagt til', 'success');
  }

  function deleteTournament(name) {
    var profil = getProfile();
    profil.tournaments = profil.tournaments.filter(function(t) { return t !== name; });
    if (profil.favoriteTournament === name) profil.favoriteTournament = '';
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    if (selectedTournament === name) selectTournament('');
    renderProfileTournamentList();
    renderTournamentDropdown();
  }

  function setFavoriteTournament(name) {
    var profil = getProfile();
    profil.favoriteTournament = (profil.favoriteTournament === name) ? '' : name;
    saveProfile_local(profil);
    saveProfileToSupabase(profil);
    renderProfileTournamentList();
    renderTournamentDropdown();
    if (profil.favoriteTournament) selectTournament(profil.favoriteTournament);
  }

  function renderProfileTournamentList() {
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
      starBtn.textContent = isFav ? '★' : '☆';
      starBtn.onclick = function() { setFavoriteTournament(name); };
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
      delBtn.textContent = '×';
      delBtn.onclick = function() { deleteTournament(name); };
      div.appendChild(starBtn);
      div.appendChild(nameSpan);
      div.appendChild(delBtn);
      list.appendChild(div);
    });
  }

  function renderProfileTeamList() {
    const profil = getProfile();
    const list = document.getElementById('profile-team-list');
    if (!profil.team.length) {
      list.innerHTML = '<div class="team-list-empty">Ingen team lagt til ennå</div>';
      return;
    }
    const favoritt = profil.favoriteTeam || '';
    list.innerHTML = profil.team.map(function(name) {
      var isFav = name === favoritt;
      return '<div class="team-list-item">' +
        '<button class="team-star ' + (isFav ? 'active' : '') + '" onclick="setFavoriteTeam(\'' + name.replace(/'/g, "\\'") + '\')">' + (isFav ? '&#9733;' : '&#9734;') + '</button>' +
        '<span class="team-list-name' + (isFav ? ' favoritt' : '') + '">' + name + (isFav ? ' <span class=\"team-fav-badge\">standard</span>' : '') + '</span>' +
        '<button class="team-list-del" onclick="deleteTeam(\'' + name.replace(/'/g, "\\'") + '\')">×</button>' +
      '</div>';
    }).join('');
  }

  function loadProfileData(profil) {
    document.getElementById('profil-name').value = profil.name || '';
    document.getElementById('profil-club').value = profil.club || '';
    document.getElementById('profil-posisjon').value = profil.posisjon || '';
    var nameEl2 = document.getElementById('avatar-name');
    var clubEl2 = document.getElementById('avatar-club');
    nameEl2.textContent = profil.name || '';
    nameEl2.style.display = profil.name ? '' : 'none';
    clubEl2.textContent = profil.club || '';
    clubEl2.style.display = profil.club ? '' : 'none';
    showAvatarImage(profil.avatar || '');
    renderProfileTeamList();
    renderProfileTournamentList();
    renderTournamentDropdown();
  }

  function loadProfile() {
    loadProfileData(getProfile());
  }

  function renderLogSub() {
    var profil = getProfile();
    var s = getSettings();
    var isEn = s.lang === 'en';
    var greeting = isEn ? 'Hi' : 'Hei';
    var ready = isEn ? 'Ready to log match 🟢' : 'Klar til å logge kamp 🟢';
    var sub = profil.name ? (greeting + ', ' + profil.name.split(' ')[0] + '! 🟢') : ready;
    document.getElementById('log-sub').textContent = sub;
  }

  // ════════════════════════════════ LAG DROPDOWN ════════════════════════════════

  let selectedTeam = '';
  let teamDropdownOpen = false;
  let showNewTeamInput = false;

  function toggleTeamDropdown() {
    teamDropdownOpen = !teamDropdownOpen;
    document.getElementById('team-dropdown').classList.toggle('open', teamDropdownOpen);
    document.getElementById('team-selected').classList.toggle('open', teamDropdownOpen);
    document.getElementById('team-chevron').classList.toggle('open', teamDropdownOpen);
    if (teamDropdownOpen) renderTeamDropdown();
  }

  function closeLagDropdown() {
    teamDropdownOpen = false;
    showNewTeamInput = false;
    document.getElementById('team-dropdown').classList.remove('open');
    document.getElementById('team-selected').classList.remove('open');
    document.getElementById('team-chevron').classList.remove('open');
    document.getElementById('team-new-row').classList.remove('visible');
  }

  function renderTeamDropdown() {
    const profil = getProfile();
    const list = document.getElementById('team-options-list');
    let html = '';
    profil.team.forEach(name => {
      html += `<div class="team-option ${selectedTeam === name ? 'selected' : ''}" onclick="selectTeam('${name.replace(/'/g,"\\'")}')">
        ${name}
        ${selectedTeam === name ? '<span style="color:var(--lime)">✓</span>' : ''}
      </div>`;
    });
    html += `<div class="team-option team-option-add" onclick="toggleNewTeamInput()">
      <span>＋</span> Nytt team...
    </div>`;
    list.innerHTML = html;
  }

  function selectTeam(name) {
    selectedTeam = name;
    const txt = document.getElementById('team-selected-text');
    txt.textContent = name;
    txt.classList.remove('placeholder');
    closeLagDropdown();
  }

  function toggleNewTeamInput() {
    showNewTeamInput = !showNewTeamInput;
    document.getElementById('team-new-row').classList.toggle('visible', showNewTeamInput);
    if (showNewTeamInput) setTimeout(() => document.getElementById('team-new-input').focus(), 50);
  }

  function saveNewTeamFromDropdown() {
    const input = document.getElementById('team-new-input');
    const name = input.value.trim();
    if (!name) return;
    const profil = getProfile();
    if (!profil.team.includes(name)) {
      profil.team.push(name);
      saveProfile_local(profil);
      saveProfileToSupabase(profil);
      renderProfileTeamList();
    }
    input.value = '';
    selectTeam(name);
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.team-selector-wrap')) {
      closeLagDropdown();
      // Close turnering dropdown
      var tdd = document.getElementById('tournament-dropdown');
      if (tdd) tdd.classList.remove('open');
      var tchev = document.getElementById('tournament-chevron');
      if (tchev) tchev.classList.remove('open');
      // Close modal dropdowns
      ['modal-team-dropdown','modal-tournament-dropdown'].forEach(function(id) {
        var dd = document.getElementById(id);
        if (dd) dd.classList.remove('open');
      });
    }
  });

  // ════════════════════════════════ LOGG ════════════════════════════════

  let goals = 0, assist = 0, home = 0, away = 0, matchType = 'hjemme';

  function setMatchType(type) {
    matchType = type;
    document.getElementById('btn-home-toggle').classList.toggle('active', type === 'hjemme');
    document.getElementById('btn-away-toggle').classList.toggle('active', type === 'away');
    document.getElementById('label-home').classList.toggle('highlight', type === 'hjemme');
    document.getElementById('label-away').classList.toggle('highlight', type === 'away');
    updateResult();
  }

  function updateResult() {
    const el = document.getElementById('result-display');
    const r = matchType === 'hjemme'
      ? (home > away ? 'wins' : home < away ? 'loss' : 'draw')
      : (away > home ? 'wins' : away < home ? 'loss' : 'draw');
    const labels = { wins: t('res_win'), draw: t('res_uavgjort'), loss: t('res_tap') };
    el.textContent = labels[r];
    el.className = 'result-auto ' + r;
  }

  function adjust(type, delta) {
    var ownScore = matchType === 'hjemme' ? home : away;
    if (type === 'goals') {
      goals = Math.min(ownScore, Math.max(0, goals + delta));
      assist = Math.min(assist, ownScore - goals);
      document.getElementById('goals-display').textContent = goals;
      document.getElementById('assist-display').textContent = assist;
    }
    if (type === 'assist') {
      assist = Math.min(ownScore - goals, Math.max(0, assist + delta));
      document.getElementById('assist-display').textContent = assist;
    }
    if (type === 'home') {
      home = Math.max(0, home + delta);
      if (matchType === 'hjemme') {
        goals = Math.min(goals, home);
        assist = Math.min(assist, home - goals);
        document.getElementById('goals-display').textContent = goals;
        document.getElementById('assist-display').textContent = assist;
      }
      document.getElementById('home-display').textContent = home;
      updateResult();
    }
    if (type === 'away') {
      away = Math.max(0, away + delta);
      if (matchType === 'away') {
        goals = Math.min(goals, away);
        assist = Math.min(assist, away - goals);
        document.getElementById('goals-display').textContent = goals;
        document.getElementById('assist-display').textContent = assist;
      }
      document.getElementById('away-display').textContent = away;
      updateResult();
    }
  }

  async function saveMatch() {
    const date = document.getElementById('date').value;
    const opponent = document.getElementById('opponent').value.trim();
    const turnering = selectedTournament;
    if (!date || !opponent || !selectedTeam) {
      showToast('Fyll inn date, opponent og velg team', 'error');
      return;
    }
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; btn.textContent = 'Lagrer...';
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/kamper', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ dato: date, motstanderlag: opponent, eget_lag: selectedTeam, turnering, hjemme: home, borte: away, mal: goals, assist, kamptype: matchType })
      });
      if (res.ok) {
        const newMatches = await res.json();
        if (newMatches && newMatches[0]) {
          allMatches.unshift(newMatches[0]);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(allMatches));
        } else {
          invalidateStatsCache();
        }
        showToast('⚽ Kamp saved!', 'success');
        resetForm();
      }
      else { const err = await res.json(); showToast('Feil: ' + (err.message || 'ukjent'), 'error'); }
    } catch(e) { showToast('Nettverksfeil – prøv igjen', 'error'); }
    btn.disabled = false; btn.textContent = 'Lagre kamp';
  }

  function resetForm() {
    document.getElementById('opponent').value = '';
    selectTournament('');
    goals = 0; assist = 0; home = 0; away = 0;
    ['goals','assist','home','away'].forEach(t => document.getElementById(t+'-display').textContent = '0');
    setMatchType('hjemme');
    updateResult();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    // Reset team: keep last selected if still valid
    renderTeamDropdown();
  }

  // ════════════════════════════════ STATS ════════════════════════════════

  let allMatches = [];
  let activeSeason = '2025';

  async function loadStats(forceRefresh = false) {
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) { allMatches = JSON.parse(cached); renderStats(); return; }
      } catch(e) {}
    }
    document.getElementById('stats-content').innerHTML = '<div class="loading"><div class="spinner"></div>Henter statistikk...</div>';
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/kamper?select=*&order=dato.desc', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      allMatches = await res.json();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(allMatches));
      renderStats();
    } catch(e) {
      document.getElementById('stats-content').innerHTML = '<div class="loading">Klarte ikke laste data</div>';
    }
  }

  function invalidateStatsCache() { sessionStorage.removeItem(CACHE_KEY); }

  function getSeasons() {
    const years = [...new Set(allMatches.map(k => k.dato.substring(0, 4)))].sort();
    return years.length ? years : ['2025'];
  }

  function getResult(k) {
    if (k.kamptype === 'hjemme') return k.hjemme > k.borte ? 'wins' : k.hjemme < k.borte ? 'loss' : 'draw';
    return k.borte > k.hjemme ? 'wins' : k.borte < k.hjemme ? 'loss' : 'draw';
  }

  function renderMatchList(matches) {
    return matches.map(function(k) {
      var r = getResult(k);
      var resIkon = r === 'wins' ? 'S' : r === 'draw' ? 'U' : 'T';
      var date = new Date(k.dato).toLocaleDateString('no-NO', {day:'2-digit', month:'short'});
      var team = k.eget_lag || '';
      var tournament = k.turnering ? ' · ' + k.turnering : '';
      var goalText = (k.mal||0) > 0 ? ' · ' + k.mal + String.fromCodePoint(9917) + ((k.assist||0) > 0 ? ' ' + k.assist + String.fromCodePoint(127919) : '') : '';
      var onclick = "openEditModal('" + k.id + "')";
      return '<div class="match-item" onclick="' + onclick + '">' +
        '<div class="match-result ' + r + '">' + resIkon + '</div>' +
        '<div class="match-info">' +
          '<div class="match-title-row">' +
            '<div class="match-opponent">' + k.motstanderlag + '</div>' +
            (team ? '<div class="match-team-name">· ' + team + '</div>' : '') +
          '</div>' +
          '<div class="match-meta">' + date + tournament + goalText + '</div>' +
        '</div>' +
        '<div class="match-score">' + k.hjemme + '–' + k.borte + '</div>' +
        '<div class="match-edit-icon">✏️</div>' +
      '</div>';
    }).join('');
  }

  function renderMatchListPaged(matches) {
    var total = matches.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (matchPage >= totalPages) matchPage = totalPages - 1;
    var start = matchPage * PAGE_SIZE;
    var pageMatches = matches.slice(start, start + PAGE_SIZE);
    var html = renderMatchList(pageMatches);
    if (totalPages > 1) {
      var from = start + 1;
      var to = Math.min(start + PAGE_SIZE, total);
      html += '<div class="pagination">' +
        '<button class="page-btn" onclick="setMatchPage(' + (matchPage - 1) + ')" ' + (matchPage === 0 ? 'disabled' : '') + '>← Forrige</button>' +
        '<span class="page-info">' + from + '–' + to + ' av ' + total + '</span>' +
        '<button class="page-btn" onclick="setMatchPage(' + (matchPage + 1) + ')" ' + (matchPage >= totalPages - 1 ? 'disabled' : '') + '>Neste →</button>' +
      '</div>';
    }
    return html;
  }

  function setMatchPage(page) {
    matchPage = page;
    var statsContent = document.getElementById('stats-content');
    if (!statsContent) return;
    // Re-render just the match list + pagination (avoid full re-render)
    var header = statsContent.querySelector('.match-list-header');
    if (!header) { renderStats(); return; }
    var seasonMatches = allMatches.filter(function(k) { return k.dato.startsWith(activeSeason); });
    var matches = activeLag === 'all' ? seasonMatches : seasonMatches.filter(function(k) { return k.eget_lag === activeLag; });
    // Remove old match items and pagination
    var toRemove = [];
    var node = header.nextSibling;
    while (node) { toRemove.push(node); node = node.nextSibling; }
    toRemove.forEach(function(n) { n.parentNode.removeChild(n); });
    // Insert new content
    var temp = document.createElement('div');
    temp.innerHTML = renderMatchListPaged(matches);
    while (temp.firstChild) { statsContent.appendChild(temp.firstChild); }
    // Scroll to header
    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function calcWDL(matchArr) {
    var w = 0, d = 0, l = 0, g = 0, a = 0;
    matchArr.forEach(function(k) {
      var r = getResult(k);
      if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
      g += k.mal || 0; a += k.assist || 0;
    });
    return { w: w, d: d, l: l, g: g, a: a, n: matchArr.length };
  }

  function renderHomeAwaySection(matches) {
    var homeMatches = matches.filter(function(k) { return k.kamptype === 'hjemme'; });
    var awayMatches = matches.filter(function(k) { return k.kamptype !== 'hjemme'; });
    if (homeMatches.length === 0 && awayMatches.length === 0) return '';

    function cardHTML(label, matchArr, colorClass) {
      if (matchArr.length === 0) return '<div class="ha-card"><div class="ha-card-title ' + colorClass + '">' + label + '</div><div style="text-align:center;color:var(--muted);font-size:13px;padding:8px 0">Ingen kamper</div></div>';
      var s = calcWDL(matchArr);
      var pctW = Math.round((s.w / s.n) * 100);
      var pctD = Math.round((s.d / s.n) * 100);
      var pctL = 100 - pctW - pctD;
      return '<div class="ha-card">' +
        '<div class="ha-card-title ' + colorClass + '">' + label + ' (' + s.n + ')</div>' +
        '<div class="ha-nums">' +
          '<div class="ha-num"><div class="ha-num-val lime">' + s.w + '</div><div class="ha-num-lbl">S</div></div>' +
          '<div class="ha-num"><div class="ha-num-val gold">' + s.d + '</div><div class="ha-num-lbl">U</div></div>' +
          '<div class="ha-num"><div class="ha-num-val danger">' + s.l + '</div><div class="ha-num-lbl">T</div></div>' +
        '</div>' +
        '<div class="ha-mini-bar">' +
          '<div class="ha-mini-seg" style="width:' + pctW + '%;background:var(--lime)"></div>' +
          '<div class="ha-mini-seg" style="width:' + pctD + '%;background:var(--gold)"></div>' +
          '<div class="ha-mini-seg" style="width:' + pctL + '%;background:var(--danger)"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' +
          '<div style="text-align:center">' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--lime)">' + s.g + '</div>' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">Mål</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--gold)">' + s.a + '</div>' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">Assist</div>' +
          '</div>' +
          '<div style="text-align:center">' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:800;color:var(--white)">' + (s.g + s.a) + '</div>' +
            '<div style="font-family:Barlow Condensed,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">G+A</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return '<div class="stat-row-card" style="margin-bottom:8px">' +
      '<div class="stat-row-title">Hjemme vs Borte</div>' +
      '<div class="ha-grid">' +
        cardHTML('🏠 Hjemme', homeMatches, 'home') +
        cardHTML('✈️ Borte', awayMatches, 'away') +
      '</div>' +
    '</div>';
  }

  function renderTournamentSection(matches) {
    var tournamentMap = {};
    matches.forEach(function(k) {
      var tn = k.turnering || '—';
      if (!tournamentMap[tn]) tournamentMap[tn] = [];
      tournamentMap[tn].push(k);
    });
    var tournaments = Object.keys(tournamentMap).sort(function(a, b) {
      return tournamentMap[b].length - tournamentMap[a].length;
    });
    if (tournaments.length <= 1) return '';

    var rows = tournaments.map(function(tn) {
      var s = calcWDL(tournamentMap[tn]);
      return '<div class="tournament-stat-row">' +
        '<div class="tournament-stat-name">' + tn + ' <span style="color:var(--muted);font-size:12px;font-weight:400">(' + s.n + ' kamper)</span></div>' +
        '<div class="tournament-stat-badges">' +
          '<span class="t-badge win">' + s.w + 'S</span>' +
          '<span class="t-badge draw">' + s.d + 'U</span>' +
          '<span class="t-badge loss">' + s.l + 'T</span>' +
          '<span class="tournament-wdl-sep"></span>' +
          '<span class="t-badge goals">⚽' + s.g + '</span>' +
          '<span class="t-badge assist">🎯' + s.a + '</span>' +
          '<span class="t-badge ga">✨' + (s.g + s.a) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="stat-row-card" style="margin-bottom:8px">' +
      '<div class="stat-row-title">Per turnering</div>' +
      rows +
    '</div>';
  }

  function renderStats() {
    const seasons = getSeasons();
    if (!seasons.includes(activeSeason)) activeSeason = seasons[0];
    document.getElementById('season-selector').innerHTML = seasons.map(s =>
      `<button class="season-pill ${s === activeSeason ? 'active' : ''}" onclick="setSeason('${s}')">${s}</button>`
    ).join('');

    // Lag filter pills
    const seasonMatches = allMatches.filter(k => k.dato.startsWith(activeSeason));
    const profileTeams = getProfile().team || [];
    if (!activeLag || (!profileTeams.includes(activeLag) && activeLag !== 'alle')) activeLag = 'all';
    const teamPills = [{ key: 'all', label: 'Alle team' }, ...profileTeams.map(l => ({ key: l, label: l }))];
    document.getElementById('team-filter-selector').innerHTML = teamPills.map(p =>
      `<button class="season-pill ${activeLag === p.key ? 'active' : ''}" onclick="setTeamFilter('${p.key.replace(/'/g,"\'")}')"> ${p.label}</button>`
    ).join('');

    const matches = activeLag === 'all' ? seasonMatches : seasonMatches.filter(k => k.eget_lag === activeLag);
    const n = matches.length;
    const teamText = activeLag === 'all' ? 'alle team' : activeLag;
    document.getElementById('stats-sub').textContent = `${n} kamper · ${teamText}`;
    if (n === 0) { document.getElementById('stats-content').innerHTML = '<div class="loading">Ingen kamper denne sesongen</div>'; return; }

    const s = calcWDL(matches);
    const pct = v => Math.round((v / n) * 100);

    document.getElementById('stats-content').innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-num lime">${s.w}</div><div class="stat-lbl">Seier</div></div>
        <div class="stat-card"><div class="stat-num gold">${s.d}</div><div class="stat-lbl">Uavgjort</div></div>
        <div class="stat-card"><div class="stat-num danger">${s.l}</div><div class="stat-lbl">Tap</div></div>
      </div>
      <div class="stat-row-card">
        <div class="stat-row-title">Kampfordeling – ${n} kamper</div>
        <div class="wdl-bar">
          <div class="wdl-seg w" style="width:${pct(s.w)}%"></div>
          <div class="wdl-seg d" style="width:${pct(s.d)}%"></div>
          <div class="wdl-seg l" style="width:${pct(s.l)}%"></div>
        </div>
        <div class="wdl-labels">
          <span class="wdl-label" style="color:var(--lime)">${pct(s.w)}% S</span>
          <span class="wdl-label" style="color:var(--gold)">${pct(s.d)}% U</span>
          <span class="wdl-label" style="color:var(--danger)">${pct(s.l)}% T</span>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-num lime">${s.g}</div><div class="stat-lbl">Mål</div></div>
        <div class="stat-card"><div class="stat-num gold">${s.a}</div><div class="stat-lbl">Assist</div></div>
        <div class="stat-card"><div class="stat-num">${s.g + s.a}</div><div class="stat-lbl">G+A</div></div>
      </div>
      <div class="stat-row-card">
        <div class="stat-row-title">Gjennomsnitt per kamp</div>
        <div class="stat-row"><span class="stat-row-label">Mål per kamp</span><span class="stat-row-value">${(s.g/n).toFixed(1)}</span></div>
        <div class="stat-row"><span class="stat-row-label">Assist per kamp</span><span class="stat-row-value">${(s.a/n).toFixed(1)}</span></div>
        <div class="stat-row"><span class="stat-row-label">G+A per kamp</span><span class="stat-row-value">${((s.g+s.a)/n).toFixed(1)}</span></div>
      </div>
      ${renderHomeAwaySection(matches)}
      ${renderTournamentSection(matches)}
      <div class="match-list-header">Kamphistorikk</div>
      ${renderMatchListPaged(matches)}
    `;
  }

  let activeLag = 'all';
  var matchPage = 0;
  var PAGE_SIZE = 20;
  function setSeason(s) { activeSeason = s; activeLag = 'all'; matchPage = 0; renderStats(); }
  function setTeamFilter(team) { activeLag = team; matchPage = 0; renderStats(); }

  // ════════════════════════════════ TAB NAV ════════════════════════════════

  // ── SETTINGS FUNCTIONS ───────────────────────────────────────────────
  function toggleLangPicker(btn) {
    // Close all other dropdowns first
    document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
    // Find sibling dropdown
    var dd = btn ? btn.parentElement.querySelector('.lang-picker-dropdown') : document.querySelector('.lang-picker-dropdown');
    if (dd) dd.classList.toggle('open');
    setTimeout(function() {
      document.addEventListener('click', function closePicker(e) {
        if (!e.target.closest('.lang-flag-btn') && !e.target.closest('.lang-picker-dropdown')) {
          document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
          document.removeEventListener('click', closePicker);
        }
      });
    }, 50);
  }

  function updateFlags() {
    var s = getSettings();
    var flag = s.lang === 'en' ? '🇬🇧' : '🇳🇴';
    document.querySelectorAll('.lang-flag-btn').forEach(function(btn) {
      btn.textContent = flag;
    });
  }

  function setLang(lang) {
    var s = getSettings(); s.lang = lang;
    saveSettings(s);
    var d = document.getElementById('lang-picker-dropdown');
    if (d) d.classList.remove('open');
    updateFlags();
    updateAllText();
    showToast(lang === 'no' ? '🇳🇴 Norsk' : '🇬🇧 English', 'success');
  }

  function updateAllText() {
    // Logg screen labels
    var labels = {
      'label-date': 'date', 'label-opponent': 'opponentTeam',
      'label-egetlag': 'own_team', 'label-turnering': 'turnering',
      'label-goals': 'goals', 'label-assist': 'assist',
      'label-home': 'home_label', 'label-away': 'away_label',
      'label-matchType': 'match_type_label', 'label-result': 'result_label'
    };
    Object.keys(labels).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = t(labels[id]);
    });
    // Placeholders
    var ph = {
      'opponent': 'ph_opponent',
      'profil-name': 'ph_navn', 'profil-club': 'ph_klubb', 'profil-posisjon': 'ph_posisjon',
      'profile-new-tournament': 'ph_add_team', 'settings-ny-sesong': 'ph_new_season'
    };
    Object.keys(ph).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.placeholder = t(ph[id]);
    });
    // Buttons (use innerHTML to preserve emojis)
    var btnSave = document.getElementById('submit-btn');
    if (btnSave) btnSave.textContent = t('save_match');
    var btnProfile = document.getElementById('btn-save-profil');
    if (btnProfile) btnProfile.textContent = t('save_profile');
    // Toggle buttons - use innerHTML to keep emoji
    var btnHome = document.getElementById('btn-home-toggle');
    var btnAway = document.getElementById('btn-away-toggle');
    if (btnHome) btnHome.innerHTML = t('hjemmekamp');
    if (btnAway) btnAway.innerHTML = t('bortekamp');
    // Lag dropdown placeholder (only if no team selected)
    var teamTxt = document.getElementById('team-selected-text');
    if (teamTxt && teamTxt.classList.contains('placeholder')) {
      teamTxt.textContent = t('select_team');
    }
    // Turnering dropdown placeholder (only if no turnering selected)
    var tournamentTxt = document.getElementById('tournament-selected-text');
    if (tournamentTxt && !selectedTournament) {
      tournamentTxt.textContent = t('select_tournament');
    }
    // Tab labels
    var tabKeys = { log: 'tab_log', stats: 'tab_stats', profil: 'tab_profile', settings: 'tab_settings' };
    ['log','stats','profil','settings'].forEach(function(tab) {
      var el = document.querySelector('#tab-' + tab + ' .tab-label');
      if (el) el.textContent = t(tabKeys[tab]);
    });
    updateLogBadge();
    renderLogSub();
    updateResult();
    // Other screen static texts
    var profileSub = document.getElementById('profil-sub');
    if (profileSub) profileSub.textContent = getSettings().lang === 'en' ? 'Settings and teams' : 'Innstillinger og team';
    var settingsSub = document.getElementById('settings-sub');
    if (settingsSub) settingsSub.textContent = getSettings().lang === 'en' ? 'Customize Athlytics Sport' : 'Tilpass Athlytics Sport';
    if (document.getElementById('screen-settings') &&
        document.getElementById('screen-settings').classList.contains('active')) renderSettings();
  }

  function renderSettings() {
    var s = getSettings();

    // Language
    var el = document.getElementById('st-lang-title');
    if (el) el.textContent = t('lang_title');
    var el2 = document.getElementById('st-lang-desc');
    if (el2) el2.textContent = t('lang_desc');
    var langEl = document.getElementById('settings-lang-options');
    if (langEl) {
      langEl.innerHTML = '';
      [{key:'no',label:'🇳🇴 Norsk'},{key:'en',label:'🇬🇧 English'}].forEach(function(l) {
        var btn = document.createElement('button');
        btn.className = 'settings-pill' + (s.lang===l.key ? ' active' : '');
        btn.textContent = l.label;
        btn.onclick = function() { setLang(l.key); };
        langEl.appendChild(btn);
      });
    }

    // Sport
    var sportEl = document.getElementById('settings-sport-options');
    if (sportEl) {
      sportEl.innerHTML = '';
      [{key:'fotball',label:'⚽ Fotball',soon:false},{key:'orientering',label:'🧭 Orientering',soon:true},{key:'ski',label:'⛷️ Ski',soon:true}].forEach(function(sp) {
        var btn = document.createElement('button');
        btn.className = 'settings-pill' + (sp.soon ? ' soon' : '') + (s.sport===sp.key ? ' active' : '');
        btn.innerHTML = sp.label + (sp.soon ? ' <span style="font-size:10px">(snart)</span>' : '');
        if (!sp.soon) btn.onclick = function() { setSport(sp.key); };
        sportEl.appendChild(btn);
      });
    }

    // Sesongformat
    var sfEl = document.getElementById('settings-sesong-options');
    if (sfEl) {
      sfEl.innerHTML = '';
      [{key:'aar',label:'📅 År (2025)'},{key:'sesong',label:'🗓️ Sesong (2025–2026)'}].forEach(function(f) {
        var btn = document.createElement('button');
        btn.className = 'settings-pill' + (s.seasonFormat===f.key ? ' active' : '');
        btn.textContent = f.label;
        btn.onclick = function() { setSeasonFormat(f.key); };
        sfEl.appendChild(btn);
      });
    }

    renderActiveSeasonPills();
  }
  function defaultSettings() {
    return { sport: 'fotball', seasonFormat: 'aar', activeSeason: '', lang: 'no', extraSeasons: [] };
  }

  function getSettings() {
    if (_settingsCache) return _settingsCache;
    try { _settingsCache = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings(); }
    catch(e) { _settingsCache = defaultSettings(); }
    return _settingsCache;
  }

  function saveSettings(s) {
    _settingsCache = s;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    saveSettingsToSupabase(s);
  }

  async function saveSettingsToSupabase(s) {
    try {
      await fetch(SUPABASE_URL + '/rest/v1/profiler', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: 'default',
          sport: s.sport,
          season_format: s.seasonFormat,
          active_season: s.activeSeason || '',
          lang: s.lang || 'no',
          oppdatert: new Date().toISOString()
        })
      });
    } catch(e) {}
  }

  function buildSeasonLabel(aar, format) {
    if (!aar) return '';
    if (format === 'sesong') { var y = parseInt(aar); return y + '–' + (y+1); }
    return String(aar);
  }

  function getAllSeasons() {
    var s = getSettings();
    var ekstra = s.extraSeasons || [];
    var fromMatches = [];
    if (typeof allMatches !== 'undefined') {
      allMatches.forEach(function(k) {
        var aar = k.dato ? k.dato.substring(0,4) : null;
        if (aar && !fromMatches.includes(aar)) fromMatches.push(aar);
      });
    }
    var sett = [];
    fromMatches.concat(ekstra).forEach(function(aar) {
      var label = buildSeasonLabel(aar, s.seasonFormat);
      if (!sett.includes(label)) sett.push(label);
    });
    return sett.sort();
  }

  function setSport(sport) {
    var s = getSettings(); s.sport = sport;
    saveSettings(s); renderSettings();
    updateLogBadge();
    showToast('Sport oppdatert', 'success');
  }

  function setSeasonFormat(format) {
    var s = getSettings(); s.seasonFormat = format;
    saveSettings(s); renderSettings();
    updateLogBadge();
  }

  function setActiveSeason(sesong) {
    var s = getSettings();
    s.activeSeason = (s.activeSeason === sesong) ? '' : sesong;
    saveSettings(s);
    renderActiveSeasonPills();
    updateLogBadge();
    showToast('⭐ Aktiv sesong: ' + (s.activeSeason || 'ingen'), 'success');
  }

  function addSeason() {
    var input = document.getElementById('settings-ny-sesong');
    var val = input.value.trim().replace(/[^0-9]/g, '');
    if (!val || val.length < 4) { showToast('Skriv inn et gyldig årstall', 'error'); return; }
    var s = getSettings();
    if (!s.extraSeasons) s.extraSeasons = [];
    if (s.extraSeasons.includes(val)) { showToast('Sesongen finnes allerede', 'error'); return; }
    s.extraSeasons.push(val);
    saveSettings(s);
    input.value = '';
    renderActiveSeasonPills();
    showToast('✓ Sesong lagt til', 'success');
  }

  function updateLogBadge() {
    var s = getSettings();
    var badge = document.querySelector('#screen-log .header-badge');
    if (!badge) return;
    var aar = s.activeSeason || String(new Date().getFullYear());
    // strip sesong format back to year if needed
    var baseAar = aar.split(/[–-]/)[0].trim();
    var label = buildSeasonLabel(baseAar, s.seasonFormat);
    var icon = s.sport === 'orientering' ? '🧭' : s.sport === 'ski' ? '⛷️' : '⚽';
    badge.textContent = icon + ' ' + label;
  }

  function switchTab(tab) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('screen-' + tab).classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'stats') loadStats();
    if (tab === 'settings') renderSettings();
  }

  // ════════════════════════════════ TOAST ════════════════════════════════

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast ' + type + ' show';
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => { t.textContent = ''; }, 350);
    }, 3000);
  }

  // ════════════════════════════════ EDIT MODAL ════════════════════════════════

  let modalMatchId = null;
  let mHome = 0, mAway = 0, mGoals = 0, mAssists = 0, mMatchType = 'home';

  function getResultColor(k) {
    return getResult(k);
  }

  function openEditModal(id) {
    const k = allMatches.find(function(k) { return String(k.id) === String(id); });
    if (!k) return;
    modalMatchId = id;
    mHome = k.hjemme || 0;
    mAway  = k.borte  || 0;
    mGoals    = k.mal    || 0;
    mAssists = k.assist || 0;
    mMatchType = k.kamptype || 'hjemme';

    document.getElementById('modal-dato').value       = k.dato;
    document.getElementById('modal-motstander').value = k.motstanderlag || '';
    selectModalTeam(k.eget_lag || '');
    selectModalTournament(k.turnering || '');
    renderModalTeamDropdown();
    renderModalTournamentDropdown();
    document.getElementById('modal-home').textContent = mHome;
    document.getElementById('modal-away').textContent  = mAway;
    document.getElementById('modal-goals').textContent    = mGoals;
    document.getElementById('modal-assist').textContent = mAssists;
    document.getElementById('modal-title').textContent  = k.motstanderlag || 'Rediger kamp';
    setModalMatchType(mMatchType);

    document.getElementById('modal-backdrop').classList.add('open');
    document.getElementById('modal-sheet').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
    document.getElementById('modal-sheet').classList.remove('open');
    document.body.style.overflow = '';
    modalMatchId = null;
    // Close any open dropdowns inside modal
    ['modal-team-dropdown','modal-tournament-dropdown'].forEach(function(id) {
      var dd = document.getElementById(id);
      if (dd) dd.classList.remove('open');
    });
  }

  function setModalMatchType(type) {
    mMatchType = type;
    document.getElementById('modal-btn-home').classList.toggle('active', type === 'hjemme');
    document.getElementById('modal-btn-away').classList.toggle('active', type === 'away');
  }

  function modalAdjust(type, delta) {
    if (type === 'hjemme') { mHome = Math.max(0, mHome + delta); document.getElementById('modal-home').textContent = mHome; }
    if (type === 'away')  { mAway  = Math.max(0, mAway  + delta); document.getElementById('modal-away').textContent  = mAway; }
    if (type === 'goals')    { mGoals    = Math.max(0, mGoals    + delta); document.getElementById('modal-goals').textContent    = mGoals; }
    if (type === 'assist') { mAssists = Math.max(0, mAssists + delta); document.getElementById('modal-assist').textContent = mAssists; }
  }

  async function saveEditedMatch() {
    if (!modalMatchId) return;
    const body = {
      dato:         document.getElementById('modal-dato').value,
      motstanderlag: document.getElementById('modal-motstander').value.trim(),
      eget_lag:     document.getElementById('modal-own-team').value.trim(),
      turnering:    document.getElementById('modal-tournament').value.trim(),
      hjemme: mHome, borte: mAway, mal: mGoals, assist: mAssists, kamptype: mMatchType
    };
    const btn = document.querySelector('.modal-save-btn');
    btn.textContent = 'Lagrer...'; btn.disabled = true;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/kamper?id=eq.${modalMatchId}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        // Update local cache
        const idx = allMatches.findIndex(k => k.id === modalMatchId);
        if (idx !== -1) allMatches[idx] = { ...allMatches[idx], ...body };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(allMatches));
        closeModal();
        renderStats();
        showToast('✓ Kamp oppdatert', 'success');
      } else {
        showToast('Feil ved lagring', 'error');
      }
    } catch(e) { showToast('Nettverksfeil', 'error'); }
    btn.textContent = 'Lagre endringer'; btn.disabled = false;
  }

  async function deleteMatch() {
    if (!modalMatchId) return;
    if (!confirm('Sikker på at du vil slette denne kampen?')) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/kamper?id=eq.${modalMatchId}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      if (res.ok) {
        allMatches = allMatches.filter(k => k.id !== modalMatchId);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(allMatches));
        closeModal();
        renderStats();
        showToast('🗑 Kamp slettet', 'success');
      } else {
        showToast('Feil ved sletting', 'error');
      }
    } catch(e) { showToast('Nettverksfeil', 'error'); }
  }

  // ════════════════════════════════ INIT ════════════════════════════════

  window.addEventListener('load', () => {
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    updateResult();
    // Load profil - try Supabase first, fall back to localStorage
    fetchProfileFromSupabase().then(function(p) {
      loadProfileData(p);
      renderTeamDropdown();
      renderLogSub();
      if (p.favoriteTeam && p.team.includes(p.favoriteTeam)) selectTeam(p.favoriteTeam);
      if (p.favoriteTournament && p.tournaments && p.tournaments.includes(p.favoriteTournament)) selectTournament(p.favoriteTournament);
      renderTournamentDropdown();
      renderProfileTournamentList();
      updateLogBadge();
      updateFlags();
      updateAllText();
    });
  });


  // ════════════════════════════════ EXPORT ════════════════════════════════

  async function getMatchesForExport() {
    if (allMatches && allMatches.length > 0) return allMatches;
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) { allMatches = JSON.parse(cached); return allMatches; }
    } catch(e) {}
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/kamper?select=*&order=dato.desc', {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      });
      allMatches = await res.json();
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(allMatches));
      return allMatches;
    } catch(e) { return []; }
  }

  async function exportCSV() {
    showToast('Henter data...', 'success');
    var all = await getMatchesForExport();
    var s = getSettings();
    var season = s.activeSeason || String(new Date().getFullYear());
    var baseYear = season.split(/[–-]/)[0].trim();
    var matches = all.filter(function(k) { return k.dato && k.dato.startsWith(baseYear); });
    if (!matches.length) { showToast('Ingen kamper å eksportere', 'error'); return; }
    var lines = ['Dato,Hjemmelag,Bortelag,Turnering,Hjemme,Borte,Mal,Assist,Resultat'];
    matches.forEach(function(k) {
      var r = getResult(k);
      var resLabel = r === 'wins' ? 'Seier' : r === 'draw' ? 'Uavgjort' : 'Tap';
      var homeTeam = k.kamptype === 'hjemme' ? (k.eget_lag || '') : (k.motstanderlag || '');
      var awayTeam = k.kamptype === 'hjemme' ? (k.motstanderlag || '') : (k.eget_lag || '');
      function esc(v) { var s = String(v || ''); return s.includes(',') ? '"' + s.replace(/"/g,'""') + '"' : s; }
      lines.push([
        esc(k.dato), esc(homeTeam), esc(awayTeam), esc(k.turnering),
        k.hjemme || 0, k.borte || 0, k.mal || 0, k.assist || 0,
        esc(resLabel)
      ].join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var s = getSettings();
    var season = s.activeSeason || String(new Date().getFullYear());
    a.href = url; a.download = 'athlytics-' + season + '.csv';
    a.click(); URL.revokeObjectURL(url);
    showToast('📊 CSV lastet ned', 'success');
  }

  async function exportPDF() {
    showToast('Henter data...', 'success');
    var all = await getMatchesForExport();
    var s = getSettings();
    var season = s.activeSeason || String(new Date().getFullYear());
    var baseYear = season.split(/[–-]/)[0].trim();
    var matches = all.filter(function(k) { return k.dato && k.dato.startsWith(baseYear); });
    if (!matches.length) { showToast('Ingen kamper å eksportere', 'error'); return; }
    var s = getSettings();
    var season = s.activeSeason || String(new Date().getFullYear());
    var profil = getProfile();

    // Calc stats
    var w = 0, d = 0, l = 0, g = 0, a = 0;
    matches.forEach(function(k) {
      var r = getResult(k); if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
      g += k.mal || 0; a += k.assist || 0;
    });
    var n = matches.length;

    var matchRows = matches.slice().reverse().map(function(k) {
      var r = getResult(k);
      var color = r === 'wins' ? '#4caf50' : r === 'draw' ? '#f0c050' : '#e05555';
      var resLabel = r === 'wins' ? 'S' : r === 'draw' ? 'U' : 'T';
      var date = new Date(k.dato).toLocaleDateString('no-NO', {day:'2-digit', month:'short', year:'numeric'});
      var homeTeam = k.kamptype === 'hjemme' ? (k.eget_lag || '') : (k.motstanderlag || '');
      var awayTeam = k.kamptype === 'hjemme' ? (k.motstanderlag || '') : (k.eget_lag || '');
      return '<tr>' +
        '<td>' + date + '</td>' +
        '<td>' + homeTeam + '</td>' +
        '<td>' + awayTeam + '</td>' +
        '<td>' + (k.turnering || '') + '</td>' +
        '<td style="text-align:center">' + k.hjemme + '–' + k.borte + '</td>' +
        '<td style="text-align:center">' + (k.mal || 0) + '</td>' +
        '<td style="text-align:center">' + (k.assist || 0) + '</td>' +
        '<td style="text-align:center;color:' + color + ';font-weight:700">' + resLabel + '</td>' +
      '</tr>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>Athlytics – ' + season + '</title>' +
      '<style>body{font-family:Arial,sans-serif;margin:32px;color:#111}' +
      'h1{font-size:28px;margin-bottom:2px}h2{font-size:14px;color:#666;font-weight:normal;margin-bottom:24px}' +
      '.summary{display:flex;gap:24px;margin-bottom:28px;flex-wrap:wrap}' +
      '.stat{text-align:center;background:#f5f5f0;border-radius:8px;padding:12px 20px}' +
      '.stat-n{font-size:32px;font-weight:900;line-height:1}' +
      '.stat-l{font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-top:2px}' +
      'table{width:100%;border-collapse:collapse;font-size:13px}' +
      'th{background:#1a3a1f;color:#a8e063;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em}' +
      'tr:nth-child(even){background:#f9f9f9}td{padding:7px 10px;border-bottom:1px solid #eee}' +
      '.footer{margin-top:24px;font-size:11px;color:#999;text-align:center}' +
      '@media print{body{margin:16px}}' +
      '</style></head><body>' +
      '<h1>Athlytics Sport' + (profil.name ? ' – ' + profil.name : '') + '</h1>' +
      '<h2>Sesong ' + season + (profil.club ? ' · ' + profil.club : '') + '</h2>' +
      '<div class="summary">' +
        '<div class="stat"><div class="stat-n">' + n + '</div><div class="stat-l">Kamper</div></div>' +
        '<div class="stat"><div class="stat-n" style="color:#4caf50">' + w + '</div><div class="stat-l">Seier</div></div>' +
        '<div class="stat"><div class="stat-n" style="color:#f0c050">' + d + '</div><div class="stat-l">Uavgjort</div></div>' +
        '<div class="stat"><div class="stat-n" style="color:#e05555">' + l + '</div><div class="stat-l">Tap</div></div>' +
        '<div class="stat"><div class="stat-n" style="color:#1a3a1f">' + g + '</div><div class="stat-l">Mål</div></div>' +
        '<div class="stat"><div class="stat-n">' + a + '</div><div class="stat-l">Assist</div></div>' +
        '<div class="stat"><div class="stat-n">' + (g + a) + '</div><div class="stat-l">G+A</div></div>' +
      '</div>' +
      '<table><thead><tr><th>Dato</th><th>Hjemmelag</th><th>Bortelag</th><th>Turnering</th><th style="text-align:center">Resultat</th><th style="text-align:center">Mål</th><th style="text-align:center">Ast</th><th style="text-align:center">Res</th></tr></thead>' +
      '<tbody>' + matchRows + '</tbody></table>' +
      '<div class="footer">Generert av Athlytics Sport · athlyticsport.app · ' + new Date().toLocaleDateString('no-NO') + '</div>' +
      '</body></html>';

    var win = window.open('', '_blank');
    if (!win) { showToast('Tillat popup for PDF', 'error'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function() { win.print(); }, 400);
    showToast('📄 PDF åpnet – trykk Skriv ut', 'success');
  }

  function renderActiveSeasonPills() {
    var s = getSettings();
    var seasons = getAllSeasons();
    var el = document.getElementById('settings-aktiv-sesong-options');
    if (!el) return;
    el.innerHTML = '';
    if (seasons.length === 0) {
      el.innerHTML = '<span style="font-size:13px;color:var(--muted)">' + t('no_seasons') + '</span>';
      return;
    }
    seasons.forEach(function(sesong) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.activeSeason===sesong ? ' active' : '');
      btn.textContent = sesong;
      btn.onclick = function() { setActiveSeason(sesong); };
      el.appendChild(btn);
    });
  }

