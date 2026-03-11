export function showToast(msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function() { el.textContent = ''; }, 350);
  }, 3000);
}
