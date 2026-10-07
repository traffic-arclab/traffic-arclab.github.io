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
