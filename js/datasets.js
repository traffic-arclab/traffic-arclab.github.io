/* Datasets: every download asks for a few details first (see scripts/build_datasets.py). */

// Prompt explorer: the tabs choose which app's answers are shown (without JS every answer is shown).
document.querySelectorAll('[data-prompt-explorer]').forEach(explorer => {
  const tabs = explorer.querySelector('.prompt-tabs');
  const buttons = [...tabs.querySelectorAll('[data-prompt-app]')];
  const show = app => {
    explorer.dataset.app = app;
    buttons.forEach(b => b.setAttribute('aria-selected', String(b.dataset.promptApp === app)));
    explorer.querySelectorAll('.prompt-answer').forEach(a => a.classList.toggle('is-shown', a.dataset.app === app));
  };
  buttons.forEach(b => b.addEventListener('click', () => {
    show(b.dataset.promptApp);
    // the answers are inside the prompts: open the first one if all are closed, so the change is visible
    if (!explorer.querySelector('.prompt-item[open]')) explorer.querySelector('.prompt-item')?.setAttribute('open', '');
  }));
  tabs.hidden = false;
  if (buttons.length) show(buttons[0].dataset.promptApp);
});

// The bands of "GenAI in numbers" one at a time: every 5 seconds, with back, pause/play, next and one dot per app.
// Hovering or focusing the card pauses it; with reduced motion it starts paused.
function carousel(box, bands) {
  const DELAY = 5000;
  const card = box.closest('.genai-stats') || box.parentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0, timer = null, paused = still, held = false;
  box.classList.add('is-carousel');
  box.setAttribute('aria-roledescription', 'carousel');
  const bar = document.createElement('div');
  bar.className = 'stat-controls';
  bar.innerHTML = '<button type="button" class="stat-ctl" data-go="-1" aria-label="Previous app">◀</button>'
    + '<button type="button" class="stat-ctl stat-play"></button>'
    + '<button type="button" class="stat-ctl" data-go="1" aria-label="Next app">▶</button>'
    + '<span class="stat-dots"></span>';
  const dots = bands.map((band, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'stat-dot-btn';
    dot.setAttribute('aria-label', band.querySelector('.stat-app')?.textContent.trim() || `App ${i + 1}`);
    dot.addEventListener('click', () => { show(i); restart(); });
    bar.querySelector('.stat-dots').append(dot);
    return dot;
  });
  box.after(bar);
  const play = bar.querySelector('.stat-play');

  function show(i) {
    current = (i + bands.length) % bands.length;
    bands.forEach((band, j) => {
      const on = j === current;
      band.classList.toggle('is-active', on);
      band.setAttribute('aria-hidden', String(!on));
      band.querySelectorAll('a, [tabindex]').forEach(el => { el.tabIndex = on ? 0 : -1; });
      if (on) { band.classList.remove('is-drawn'); void band.offsetWidth; band.classList.add('is-drawn'); }   // draw it again
    });
    dots.forEach((dot, j) => dot.setAttribute('aria-current', String(j === current)));
  }
  function restart() {
    clearInterval(timer);
    timer = paused || held ? null : setInterval(() => show(current + 1), DELAY);
    play.textContent = paused ? '▶' : '❚❚';
    play.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    card.classList.toggle('is-paused', paused);
  }
  bar.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { show(current + Number(b.dataset.go)); restart(); }));
  play.addEventListener('click', () => { paused = !paused; restart(); });
  const hold = on => { held = on; restart(); };
  card.addEventListener('mouseenter', () => hold(true));
  card.addEventListener('mouseleave', () => hold(false));
  card.addEventListener('focusin', () => hold(true));
  card.addEventListener('focusout', () => { if (!card.contains(document.activeElement)) hold(false); });
  show(0);
  restart();
}

// Growth charts: drawn when they come into view; the value of a point on hover or keyboard focus
document.querySelectorAll('.stat-bands').forEach(box => {
  const bands = box.querySelectorAll('.stat-band');
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      seen.unobserve(entry.target);
    }), { threshold: 0.4 });
    bands.forEach(band => seen.observe(band));
  } else {
    bands.forEach(band => band.classList.add('is-drawn'));
  }
  if (bands.length > 1) carousel(box, [...bands]);
  const tip = document.createElement('div');
  tip.className = 'stat-tip';
  tip.hidden = true;
  box.style.position = 'relative';
  box.append(tip);
  const show = point => {
    const dot = point.querySelector('.stat-dot').getBoundingClientRect(), area = box.getBoundingClientRect();
    tip.textContent = point.dataset.tip;
    tip.style.left = `${dot.left + dot.width / 2 - area.left}px`;
    tip.style.top = `${dot.top - area.top}px`;
    tip.hidden = false;
  };
  box.querySelectorAll('.stat-pt').forEach(point => {
    point.addEventListener('mouseenter', () => show(point));
    point.addEventListener('focus', () => show(point));
    point.addEventListener('mouseleave', () => { tip.hidden = true; });
    point.addEventListener('blur', () => { tip.hidden = true; });
  });
});

// "Data and sources": on wide screens the table opens in the left column, in place of the text next to the card
document.querySelectorAll('details.stat-data[data-swap]').forEach(details => {
  const column = document.getElementById(details.dataset.swap);
  const text = column && column.querySelector('.why-text');
  const table = details.querySelector('table');
  if (!text || !table) return;
  const panel = document.createElement('div');
  panel.className = 'why-data';
  panel.id = `${column.id}-data`;
  panel.hidden = true;
  panel.innerHTML = '<h2 class="section-title">Data and sources</h2><div class="table-wrap"></div><button type="button" class="why-back"></button>';
  panel.querySelector('.why-back').textContent = `← ${details.dataset.back || 'Back'}`;
  column.append(panel);
  const summary = details.querySelector('summary');
  summary.setAttribute('aria-controls', panel.id);
  summary.setAttribute('aria-expanded', 'false');
  const wide = window.matchMedia('(min-width: 901px)');
  const swap = open => {
    if (open) panel.querySelector('.table-wrap').append(table); else details.append(table);
    panel.hidden = !open;
    text.hidden = open;
    details.classList.toggle('is-swapped', open);
    summary.setAttribute('aria-expanded', String(open));
  };
  summary.addEventListener('click', event => {
    if (!wide.matches) return;   // narrow screens: the table opens in the card, as without JS
    event.preventDefault();
    details.open = false;
    swap(panel.hidden);
    if (!panel.hidden) panel.querySelector('.why-back').focus({ preventScroll: true });
  });
  panel.querySelector('.why-back').addEventListener('click', () => { swap(false); summary.focus(); });
  wide.addEventListener('change', () => { if (!wide.matches && !panel.hidden) swap(false); });
});

// "Copy" next to a citation
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'Copied';
    } catch (_) {
      button.textContent = 'Select and copy the text';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  });
});

(() => {
  const gate = document.getElementById('download-gate');
  if (!gate) return;
  const form = gate.querySelector('form');
  const error = gate.querySelector('.gate-error');
  const endpoint = gate.dataset.endpoint;
  const STORE = 'traffic-dataset-requester';
  const FIELDS = ['first_name', 'last_name', 'organization', 'nationality', 'email'];
  let pending = null;   // { file, dataset }

  const COUNTRIES = ['Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
    'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Finland', 'France', 'Georgia',
    'Germany', 'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
    'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Libya',
    'Lithuania', 'Luxembourg', 'Malaysia', 'Malta', 'Mexico', 'Moldova', 'Monaco', 'Montenegro', 'Morocco', 'Nepal',
    'Netherlands', 'New Zealand', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama',
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'San Marino', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden',
    'Switzerland', 'Syria', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zimbabwe'];
  gate.querySelector('#gate-countries').innerHTML = COUNTRIES.map(c => `<option value="${c}">`).join('');

  function remembered() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (_) { return {}; }
  }

  function open(file, dataset) {
    pending = { file, dataset };
    gate.querySelector('[data-gate-dataset]').textContent = dataset;
    const saved = remembered();   // returning visitors find their details already filled in
    FIELDS.forEach(name => { if (!form.elements[name].value) form.elements[name].value = saved[name] || ''; });
    error.hidden = true;
    gate.showModal();
    const first = FIELDS.map(n => form.elements[n]).find(input => input.required && !input.value) || form.querySelector('[type=submit]');
    first.focus();
  }

  document.querySelectorAll('[data-download]').forEach(button => {
    button.addEventListener('click', () => open(button.dataset.download, button.dataset.dataset));
  });
  gate.querySelectorAll('[data-gate-close]').forEach(button => button.addEventListener('click', () => gate.close()));
  gate.addEventListener('click', event => { if (event.target === gate) gate.close(); });   // click on the backdrop

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      const invalid = form.querySelector(':invalid');
      error.textContent = invalid.type === 'checkbox'
        ? 'Please accept the license terms to continue.'
        : invalid.type === 'email' ? 'Please enter a valid email address, or leave it empty.' : 'Please fill in all the required fields.';
      error.hidden = false;
      invalid.focus();
      return;
    }
    const details = Object.fromEntries(FIELDS.map(name => [name, form.elements[name].value.trim()]));
    try { localStorage.setItem(STORE, JSON.stringify(details)); } catch (_) { /* nothing remembered */ }

    if (endpoint) {
      // Google Apps Script web app: a simple text/plain POST avoids the CORS preflight;
      // keepalive lets the request finish while the download starts.
      fetch(endpoint, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...details, dataset: pending.dataset, file: pending.file, page: location.pathname }),
      }).catch(() => { /* the download is never blocked by the statistics */ });
    }
    gate.close();
    window.location.href = pending.file;
  });
})();
