var _toastTimer = null;

export function showToast(msg, type) {
  var el = document.getElementById('toast');
  if (!el) return;
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  el.textContent = msg;
  el.className = 'toast ' + (['success','error','info'].includes(type) ? type : 'info') + ' show';
  _toastTimer = setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function() { el.textContent = ''; }, 350);
    _toastTimer = null;
  }, 3000);
}
