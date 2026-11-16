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
.tcc{--tcc-bg:var(--color-raised,#fff);--tcc-ink:var(--color-ink,#1b2531);--tcc-muted:var(--color-muted,#4b5968);
  --tcc-title:var(--color-title,#0b2545);--tcc-line:var(--color-line,#dce3eb);--tcc-accent:var(--color-accent,#2a6cab);
  --tcc-link:var(--color-link,#1b5b93);--tcc-deep:var(--color-deep,#0b2545);--tcc-deep-hover:var(--color-deep-hover,#173e6b);
  --tcc-tint:var(--color-accent-soft,#eaf2fa);--tcc-gold:var(--color-gold,#a5842c);
  position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:430px;box-sizing:border-box;
  padding:22px 22px 20px;border-radius:12px;background:var(--tcc-bg);color:var(--tcc-ink);
  border:1px solid var(--tcc-line);border-top:3px solid var(--tcc-gold);
  box-shadow:var(--shadow-float,0 22px 48px -18px rgba(11,37,69,.32),0 2px 6px rgba(11,37,69,.06));
  font:15px/1.55 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;
  animation:tcc-in .32s cubic-bezier(.2,.8,.2,1) both}
@keyframes tcc-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.tcc{animation:none}}
.tcc *{box-sizing:border-box}
.tcc__head{display:flex;align-items:center;gap:12px;margin:0 0 10px}
.tcc__icon{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;
  background:var(--tcc-tint);color:var(--tcc-accent)}
.tcc__title{margin:0;font:600 1.12rem/1.25 "Source Serif 4",Georgia,serif;color:var(--tcc-title)}
.tcc__text{margin:0 0 12px;color:var(--tcc-muted)}
.tcc a{color:var(--tcc-link);text-underline-offset:2px}
.tcc details{margin:0 0 16px;font-size:14px;color:var(--tcc-muted)}
.tcc summary{display:inline-flex;align-items:center;gap:6px;cursor:pointer;list-style:none;
  color:var(--tcc-link);font-weight:600;border-radius:4px}
.tcc summary::-webkit-details-marker{display:none}
.tcc summary svg{transition:transform .2s}
.tcc details[open] summary svg{transform:rotate(90deg)}
.tcc__more{margin:10px 0 0;padding:12px 14px;border-radius:8px;background:var(--color-surface-alt,#f4f6f9);
  max-height:38vh;overflow:auto}
.tcc__more p{margin:0 0 8px}.tcc__more p:last-child{margin:0}
.tcc code{font-size:.9em;padding:1px 4px;border-radius:3px;background:var(--color-code,#eef2f6)}
.tcc__actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tcc button{font:inherit;font-weight:600;min-height:42px;padding:9px 16px;border-radius:var(--radius-md,6px);cursor:pointer;
  transition:background-color .15s,border-color .15s,color .15s}
.tcc__reject{background:transparent;color:var(--tcc-title);border:1px solid var(--color-strong-line,#c3cedb)}
.tcc__reject:hover{border-color:var(--tcc-title)}
.tcc__accept{background:var(--tcc-deep);color:#fff;border:1px solid var(--tcc-deep)}
.tcc__accept:hover{background:var(--tcc-deep-hover);border-color:var(--tcc-deep-hover)}
.tcc button:focus-visible,.tcc summary:focus-visible,.tcc a:focus-visible{outline:2px solid var(--color-focus,#2a6cab);outline-offset:2px}
.tcc-link{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;
  text-decoration-color:rgba(127,127,127,.5);text-underline-offset:3px;cursor:pointer}
.tcc-link:hover{text-decoration-color:currentColor}
.tcc-legacy{text-align:center;font:13px/1.5 system-ui,sans-serif;padding:12px 16px}
@media (min-width:640px){.tcc{left:24px;right:auto;bottom:24px}}
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
    banner.setAttribute('aria-labelledby', 'tcc-title');
    banner.innerHTML = `
<div class="tcc__head">
  <span class="tcc__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></span>
  <p class="tcc__title" id="tcc-title">Help us understand our visitors</p>
</div>
<p class="tcc__text">With your consent, Google Analytics counts visits and shows which pages are read and from which countries.
Nothing is collected unless you accept, and the site works the same either way.</p>
<details>
  <summary><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5"/></svg>What is collected</summary>
  <div class="tcc__more">
    <p>Google Analytics 4 (Google Ireland Ltd.) records the pages visited, the referring site, an approximate location
    (country, city), device and browser. IP addresses are not stored.</p>
    <p>The data are used only in aggregate and kept for 14 months, in the cookies <code>_ga</code> and <code>_ga_*</code>.
    You can change your choice at any time from "Cookie settings" at the bottom of every page.</p>
    <p><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">How Google uses this data</a></p>
  </div>
</details>
<div class="tcc__actions">
  <button type="button" class="tcc__reject">Decline</button>
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
