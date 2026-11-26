/* Hover cards for the Projects table.
   On wide screens with a mouse, hovering (or tabbing to) a project shows a card in the
   right margin with its design system and stack. Card content lives in <template id="card-…">.
   Phones and narrow windows never see it: the table stays as it is. */
(function () {
  var wide = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1080px)');
  var table = document.querySelector('.proj-table');
  if (!table) return;
  var card = document.createElement('aside');
  card.className = 'pcard';
  card.setAttribute('aria-hidden', 'true');
  document.body.appendChild(card);
  var current = null, hideTimer = null;

  function place() {
    if (!current) return;
    var main = document.querySelector('main').getBoundingClientRect();
    var row = current.getBoundingClientRect();
    var h = card.offsetHeight;
    var top = Math.min(Math.max(16, row.top - 10), window.innerHeight - h - 16);
    card.style.left = Math.round(main.right + 24) + 'px';
    card.style.top = Math.round(top) + 'px';
  }
  function show(row) {
    clearTimeout(hideTimer);
    if (!wide.matches) { close(); return; }
    var t = document.getElementById('card-' + row.getAttribute('data-card'));
    if (!t) return;
    if (current !== row) {
      if (current) current.classList.remove('is-active');
      card.innerHTML = '';
      var title = document.createElement('p');
      title.className = 'pc-title';
      title.textContent = row.querySelector('a').textContent;
      card.appendChild(title);
      card.appendChild(t.content.cloneNode(true));
      current = row;
      row.classList.add('is-active');
    }
    place();
    card.classList.add('is-open');
  }
  function close() {
    card.classList.remove('is-open');
    if (current) current.classList.remove('is-active');
    current = null;
  }
  function hide() { hideTimer = setTimeout(close, 120); }

  Array.prototype.forEach.call(table.querySelectorAll('tr[data-card]'), function (row) {
    row.addEventListener('mouseenter', function () { show(row); });
    row.addEventListener('mouseleave', hide);
    var a = row.querySelector('a');
    a.addEventListener('focus', function () { show(row); });
    a.addEventListener('blur', hide);
  });
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', function () { if (!wide.matches) close(); else place(); });
})();
