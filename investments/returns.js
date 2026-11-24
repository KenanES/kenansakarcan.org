/* Live return since publishing, in US dollars.
   Any element with data-symbol gets filled in from prices.json (updated daily by a GitHub Action).
   data-pub-price: closing price on the publication date, in the stock's own currency
   data-pub-fx:    won per dollar on that date (only for Korean stocks)
   data-format:    "line" (pitch pages) or "row" (the Investments table) */
(function () {
  var nodes = document.querySelectorAll('[data-symbol]');
  if (!nodes.length || !window.fetch) return;
  var src = document.currentScript && document.currentScript.src.replace(/returns\.js.*$/, 'prices.json');
  function usd(n) { return '$' + n.toFixed(2); }
  function pct(r) { return (r >= 0 ? '+' : '−') + Math.abs(r * 100).toFixed(1) + '%'; }
  function day(iso) {
    var d = new Date(iso + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  fetch(src, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (data) {
    var p = data.prices || {};
    Array.prototype.forEach.call(nodes, function (el) {
      var q = p[el.getAttribute('data-symbol')];
      if (!q) return;
      var pub = parseFloat(el.getAttribute('data-pub-price'));
      var pubFx = parseFloat(el.getAttribute('data-pub-fx'));
      var nowUsd = q.price, pubUsd = pub;
      if (pubFx) {
        var fx = p['KRW=X'];
        if (!fx) return;
        nowUsd = q.price / fx.price;
        pubUsd = pub / pubFx;
      }
      var r = nowUsd / pubUsd - 1;
      var cls = r >= 0 ? 'up' : 'down';
      if (el.getAttribute('data-format') === 'row') {
        el.querySelector('.at-pub').textContent = usd(pubUsd);
        el.querySelector('.now').textContent = usd(nowUsd);
        var c = el.querySelector('.ret');
        c.textContent = pct(r); c.className = 'num ret ' + cls;
      } else {
        el.innerHTML = 'Since publishing: ' + usd(pubUsd) + ' &rarr; ' + usd(nowUsd) +
          ' <span class="' + cls + '">' + pct(r) + '</span> &middot; as of ' + day(q.date) + ' close';
      }
    });
  }).catch(function () {});
})();
