import { saveProfile, dismissProfilePrompt } from './profile.js';
import { selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab } from './navigation.js';
import { toggleLangPicker } from './i18n.js';
import { setLang } from './text-refresh.js';
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch } from './stats-overview.js';
import { adjust, saveMatch, setMatchType } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
import { exportCSV, exportPDF } from './export.js';
import { setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason } from './settings-render.js';
import { showToast } from './toast.js';
import { logout, isAuthenticated } from './auth.js';
import { openSharePanel, closeSharePanel, createShareToken, removeShareToken, copyShareLink } from './share-manage.js';
import { openAuthOverlay, dismissDemoBanner, toggleAuthView, handleAuthLogin, handleAuthSignup } from './auth-ui.js';

export const WRITE_ACTIONS = new Set([
  'saveMatch', 'saveProfile', 'saveEditedMatch', 'confirmDeleteMatch',
  'addTeamFromProfile', 'addTournament', 'deleteTeam', 'deleteTournament',
  'setFavoriteTeam', 'setFavoriteTournament', 'saveNewTeamFromDropdown',
  'saveNewTournamentFromDropdown', 'addSeason', 'setSport', 'setSeasonFormat',
  'setDateFormat', 'setActiveSeason', 'saveAssessment', 'exportCSV', 'exportPDF',
  'createShareToken', 'deleteShareToken'
]);

export const ACTIONS = {
  saveMatch:                     () => saveMatch(),
  adjust:                        (e) => { var el = e.target.closest('[data-type]'); if (!el) return; adjust(el.dataset.type, Number(el.dataset.delta)); },
  setMatchType:                  (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setMatchType(el.dataset.matchType); },
  switchTab:                     (e) => { var el = e.target.closest('[data-tab]'); if (!el) return; switchTab(el.dataset.tab); },
  setLang:                       (e) => { var el = e.target.closest('[data-lang]'); if (!el) return; setLang(el.dataset.lang); },
  toggleLangPicker:              (e) => toggleLangPicker(e.target.closest('[data-action]')),
  saveProfile:                   () => saveProfile(),
  addTeamFromProfile:            () => addTeamFromProfile(),
  addTournament:                 () => addTournament(),
  toggleTeamDropdown:            () => toggleTeamDropdown(),
  toggleTournamentDropdown:      () => toggleTournamentDropdown(),
  saveNewTeamFromDropdown:       () => saveNewTeamFromDropdown(),
  saveNewTournamentFromDropdown: () => saveNewTournamentFromDropdown(),
  toggleNewTeamInput:            () => toggleNewTeamInput(),
  toggleNewTournamentInput:      () => toggleNewTournamentInput(),
  selectTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTeam(el.dataset.name); },
  selectTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTournament(el.dataset.name); },
  setFavoriteTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTeam(el.dataset.name); },
  deleteTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTeam(el.dataset.name); },
  setFavoriteTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTournament(el.dataset.name); },
  deleteTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTournament(el.dataset.name); },
  toggleModalTeamDropdown:       () => toggleModalTeamDropdown(),
  toggleModalTournamentDropdown: () => toggleModalTournamentDropdown(),
  selectModalTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTeam(el.dataset.name); },
  selectModalTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTournament(el.dataset.name); },
  openEditModal:                 (e) => { var el = e.target.closest('[data-id]'); if (!el) return; openEditModal(el.dataset.id); },
  closeModal:                    () => closeModal(),
  modalAdjust:                   (e) => { var el = e.target.closest('[data-type]'); if (!el) return; modalAdjust(el.dataset.type, Number(el.dataset.delta)); },
  setModalMatchType:             (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setModalMatchType(el.dataset.matchType); },
  saveEditedMatch:               () => saveEditedMatch(),
  deleteMatch:                   () => deleteMatch(),
  cancelDeleteMatch:             () => cancelDeleteMatch(),
  confirmDeleteMatch:            () => confirmDeleteMatch(),
  switchStatsView:               (e) => { var el = e.target.closest('[data-view]'); if (!el) return; switchStatsView(el.dataset.view); },
  setSeason:                     (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setSeason(el.dataset.season); },
  setTeamFilter:                 (e) => { var el = e.target.closest('[data-team]'); if (!el) return; setTeamFilter(el.dataset.team); },
  setTournamentFilter:           (e) => { var el = e.target.closest('[data-tournament]'); if (!el) return; setTournamentFilter(el.dataset.tournament); },
  setMatchPage:                  (e) => { var el = e.target.closest('[data-page]'); if (!el) return; setMatchPage(Number(el.dataset.page)); },
  setOpponentSearch:             (e) => setOpponentSearch(e.target.value),
  clearOpponentSearch:           () => { var i = document.getElementById('opponent-search-input'); if (i) i.value = ''; setOpponentSearch(''); },
  exportCSV:                     () => exportCSV(),
  exportPDF:                     () => exportPDF(),
  addSeason:                     () => addSeason(),
  setSport:                      (e) => { var el = e.target.closest('[data-sport]'); if (!el) return; setSport(el.dataset.sport); },
  setSeasonFormat:               (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setSeasonFormat(el.dataset.format); },
  setDateFormat:                 (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setDateFormat(el.dataset.format); },
  setActiveSeason:               (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setActiveSeason(el.dataset.season); },
  showProToast:                  () => showToast('Coming soon – Stripe i Fase 4 🚀', 'success'),
  closeAssessmentSheet:          () => closeAssessmentSheet(),
  saveAssessment:                () => saveAssessment(),
  setRating:                     (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value), el.dataset.context); },
  triggerAvatarUpload:           () => { var i = document.getElementById('avatar-upload'); if (i) i.click(); },
  dismissProfilePrompt:          () => dismissProfilePrompt(),
  openSharePanel:   function() {
    if (!isAuthenticated()) {
      document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
      return;
    }
    openSharePanel();
  },
  closeSharePanel:  function() { closeSharePanel(); },
  createShareToken: function() { createShareToken(); },
  deleteShareToken: function(e) { var el = e.target.closest('[data-id]'); if (!el) return; removeShareToken(el.dataset.id); },
  copyShareLink:    function(e) { var el = e.target.closest('[data-url]'); if (!el) return; copyShareLink(el.dataset.url); },
  logout:              () => logout(),
  openAuthOverlay:     () => openAuthOverlay('login'),
  dismissDemoBanner:   () => dismissDemoBanner(),
  authToggleView:      () => toggleAuthView(),
  authLogin:           () => handleAuthLogin(),
  authSignup:          () => handleAuthSignup(),
};
