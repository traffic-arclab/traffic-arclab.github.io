/* Cookie consent and Google Analytics 4.

   Nothing is sent to Google until the visitor accepts: the gtag.js library is loaded only after
   "Accept", and the choice is kept in localStorage ("traffic-consent": "granted" | "denied").
   A "Cookie settings" link (in the footer, or at the end of the page) opens the banner again,
   and withdrawing consent removes the _ga cookies.

   With an empty GA_ID the script does nothing: no banner, no link. */
(() => {
  const GA_ID = 'G-GWQY34PV2E';            // GA4 measurement ID, e.g. 'G-XXXXXXXXXX'
  const KEY = 'traffic-consent';
  if (!GA_ID) return;

  const read = () => { try { return localStorage.getItem(KEY); } catch (_) { return null; } };
  const save = value => { try { localStorage.setItem(KEY, value); } catch (_) { /* session only */ } };

  let loaded = false;
  const loadAnalytics = () => {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  };

  const clearCookies = () => {
    const host = location.hostname;
    const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').map(c => c.split('=')[0].trim())
      .filter(name => name === '_ga' || name.startsWith('_ga_') || name === '_gid')
      .forEach(name => domains.forEach(d => {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      }));
  };

  const css = `
.tcc{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:640px;margin:0 auto;
  padding:18px 20px;border-radius:10px;font:15px/1.5 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;
  background:#fff;color:#1d2733;border:1px solid #d5dbe2;box-shadow:0 10px 30px rgba(10,20,35,.18)}
.tcc p{margin:0 0 12px}
.tcc a{color:#0b5cad}
.tcc details{margin:0 0 14px;font-size:14px;color:#4a5765}
.tcc summary{cursor:pointer;color:#0b5cad}
.tcc details p{margin:8px 0 0}
.tcc__actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
.tcc button{font:inherit;font-weight:600;padding:8px 18px;border-radius:6px;cursor:pointer;border:1px solid #0b5cad}
.tcc__reject{background:transparent;color:#0b5cad}
.tcc__accept{background:#0b5cad;color:#fff}
.tcc button:focus-visible,.tcc summary:focus-visible{outline:2px solid #0b5cad;outline-offset:2px}
.tcc-link{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer}
.tcc-legacy{text-align:center;font:13px/1.5 system-ui,sans-serif;padding:12px 16px}
:root[data-theme="dark"] .tcc{background:#132131;color:#e3e9f0;border-color:#2a3b4f}
:root[data-theme="dark"] .tcc details{color:#a9b6c4}
:root[data-theme="dark"] .tcc a,:root[data-theme="dark"] .tcc summary{color:#7cb7ff}
:root[data-theme="dark"] .tcc button{border-color:#7cb7ff}
:root[data-theme="dark"] .tcc__reject{color:#7cb7ff}
:root[data-theme="dark"] .tcc__accept{background:#7cb7ff;color:#0e1824}
@media print{.tcc,.tcc-link,.tcc-legacy{display:none!important}}`;

  let banner = null;
  const closeBanner = () => { banner?.remove(); banner = null; };

  const choose = value => {
    save(value);
    closeBanner();
    if (value === 'granted') loadAnalytics();
    else if (loaded) { clearCookies(); location.reload(); }
    else clearCookies();
  };

  const openBanner = () => {
    if (banner) { banner.querySelector('.tcc__accept').focus(); return; }
    banner = document.createElement('div');
    banner.className = 'tcc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
<p>We use Google Analytics cookies to count visits and see which pages are read and from which countries.
They are set only if you accept; the site works the same either way.</p>
<details><summary>What is collected</summary>
<p>With your consent, Google Analytics 4 (Google Ireland Ltd.) records the pages visited, the referring site,
an approximate location (country, city), device and browser. IP addresses are not stored by Google Analytics 4.
The data are used only in aggregate, to understand how the site is used, and are kept for 14 months.
The cookies are <code>_ga</code> and <code>_ga_*</code>. You can change your choice at any time from
"Cookie settings" at the bottom of every page. See also
<a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses data from sites that use its services</a>.</p>
</details>
<div class="tcc__actions">
  <button type="button" class="tcc__reject">Reject</button>
  <button type="button" class="tcc__accept">Accept</button>
</div>`;
    banner.querySelector('.tcc__reject').addEventListener('click', () => choose('denied'));
    banner.querySelector('.tcc__accept').addEventListener('click', () => choose('granted'));
    document.body.appendChild(banner);
  };

  const addSettingsLink = () => {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'tcc-link';
    link.textContent = 'Cookie settings';
    link.addEventListener('click', openBanner);
    const footer = document.querySelector('.site-footer');
    const holder = document.createElement('p');
    if (footer) {
      holder.className = 'container';
      holder.style.cssText = 'margin-top:28px;margin-bottom:0;font-size:.88rem';
      holder.appendChild(link);
      footer.appendChild(holder);
    } else {
      holder.className = 'tcc-legacy';
      holder.appendChild(link);
      document.body.appendChild(holder);
    }
  };

  const start = () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    addSettingsLink();
    const choice = read();
    if (choice === 'granted') loadAnalytics();
    else if (choice !== 'denied') openBanner();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
