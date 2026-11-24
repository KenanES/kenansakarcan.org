/* Light / dark mode.
   Automatic: dark between sunset and sunrise where the visitor is, worked out from
   their time zone (no location permission needed). Re-checked every few minutes,
   so the page changes on its own at dusk and dawn.
   Manual: the sun/moon switch overrides the automatic choice for 12 hours.
   Loaded in <head> so the right colors apply before the page paints. */
(function () {
  var root = document.documentElement;
  var KEY = 'theme', KEY_AT = 'theme-set-at', HOLD = 12 * 3600 * 1000;

  /* Rough coordinates for common time zones; anywhere else falls back to the UTC offset */
  var ZONES = {
    'America/Los_Angeles': [34.05, -118.24], 'America/Vancouver': [49.28, -123.12], 'America/Denver': [39.74, -104.99],
    'America/Phoenix': [33.45, -112.07], 'America/Chicago': [41.88, -87.63], 'America/New_York': [40.71, -74.01],
    'America/Toronto': [43.65, -79.38], 'America/Halifax': [44.65, -63.57], 'America/Anchorage': [61.22, -149.9],
    'Pacific/Honolulu': [21.31, -157.86], 'America/Mexico_City': [19.43, -99.13], 'America/Bogota': [4.71, -74.07],
    'America/Lima': [-12.05, -77.04], 'America/Santiago': [-33.45, -70.67], 'America/Sao_Paulo': [-23.55, -46.63],
    'America/Argentina/Buenos_Aires': [-34.6, -58.38], 'Europe/London': [51.51, -0.13], 'Europe/Dublin': [53.35, -6.26],
    'Europe/Lisbon': [38.72, -9.14], 'Europe/Madrid': [40.42, -3.7], 'Europe/Paris': [48.86, 2.35],
    'Europe/Amsterdam': [52.37, 4.9], 'Europe/Berlin': [52.52, 13.4], 'Europe/Rome': [41.9, 12.5],
    'Europe/Zurich': [47.38, 8.54], 'Europe/Stockholm': [59.33, 18.07], 'Europe/Oslo': [59.91, 10.75],
    'Europe/Helsinki': [60.17, 24.94], 'Europe/Athens': [37.98, 23.73], 'Europe/Istanbul': [41.01, 28.98],
    'Europe/Moscow': [55.76, 37.62], 'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38],
    'Africa/Nairobi': [-1.29, 36.82], 'Africa/Johannesburg': [-26.2, 28.05], 'Asia/Dubai': [25.2, 55.27],
    'Asia/Karachi': [24.86, 67.0], 'Asia/Kolkata': [22.57, 88.36], 'Asia/Calcutta': [22.57, 88.36],
    'Asia/Dhaka': [23.81, 90.41], 'Asia/Bangkok': [13.76, 100.5], 'Asia/Singapore': [1.35, 103.82],
    'Asia/Jakarta': [-6.2, 106.85], 'Asia/Shanghai': [31.23, 121.47], 'Asia/Hong_Kong': [22.32, 114.17],
    'Asia/Taipei': [25.03, 121.57], 'Asia/Manila': [14.6, 120.98], 'Asia/Seoul': [37.57, 126.98],
    'Asia/Tokyo': [35.68, 139.69], 'Australia/Perth': [-31.95, 115.86], 'Australia/Adelaide': [-34.93, 138.6],
    'Australia/Brisbane': [-27.47, 153.03], 'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
    'Pacific/Auckland': [-36.85, 174.76]
  };

  function place(tz, when) {
    if (ZONES[tz]) return ZONES[tz];
    return [40, -when.getTimezoneOffset() / 4];   /* 15 degrees of longitude per hour of offset */
  }

  /* Standard sunrise equation; returns true if the sun is below the horizon */
  function isDark(when, lat, lon) {
    var rad = Math.PI / 180;
    var J = when.getTime() / 86400000 + 2440587.5;
    var n = Math.round(J - 2451545.0 + 0.0008 + lon / 360);   /* the solar day nearest now at this longitude */
    var Js = n - lon / 360;
    var M = (357.5291 + 0.98560028 * Js) % 360;
    var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var L = (M + C + 180 + 102.9372) % 360;
    var Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    var dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
    var cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    if (cosW > 1) return true;    /* polar night */
    if (cosW < -1) return false;  /* midnight sun */
    var w = Math.acos(cosW) / rad / 360;
    return J < Jt - w || J > Jt + w;
  }

  function zone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; }
  }
  function auto(when) {
    when = when || new Date();
    var p = place(zone(), when);
    return isDark(when, p[0], p[1]) ? 'dark' : 'light';
  }
  function manual() {
    try {
      var v = localStorage.getItem(KEY), at = +localStorage.getItem(KEY_AT);
      if ((v === 'dark' || v === 'light') && at && Date.now() - at < HOLD) return v;
    } catch (e) {}
    return null;
  }
  function apply() { root.setAttribute('data-theme', manual() || auto()); }
  apply();

  var MOON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.9"/><path d="M8 1.4v1.5M8 13.1v1.5M1.4 8h1.5M13.1 8h1.5M3.3 3.3l1.1 1.1M11.6 11.6l1.1 1.1M3.3 12.7l1.1-1.1M11.6 4.4l1.1-1.1"/></svg>';

  function render(btn) {
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = dark ? 'Light mode' : 'Dark mode';
  }

  function mount() {
    if (document.querySelector('.theme-btn')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    var host = document.querySelector('[data-theme-host]');
    if (host) host.appendChild(btn);
    else {
      var header = document.querySelector('main header') || document.querySelector('header');
      if (!header) return;
      header.classList.add('has-theme-btn');
      header.appendChild(btn);
    }
    render(btn);
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        if (next === auto()) { localStorage.removeItem(KEY); localStorage.removeItem(KEY_AT); }   /* back to automatic */
        else { localStorage.setItem(KEY, next); localStorage.setItem(KEY_AT, String(Date.now())); }
      } catch (e) {}
      root.setAttribute('data-theme', next);
      render(btn);
    });
    /* Follow dusk and dawn while the page stays open */
    setInterval(function () { apply(); render(btn); }, 5 * 60 * 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.siteTheme = { isDark: isDark, place: place, auto: auto };   /* for testing */
})();
