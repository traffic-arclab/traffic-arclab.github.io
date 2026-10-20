/* Cybersecurity Observatory (observatory/index.html, built by scripts/build_observatory.py):
   search and filters of the catalogue, family grouping, record details and the submission form.
   With an AI web app (data-ai on the search form) the bar of the page title asks a Llama model,
   which ranks the catalogue and says why, and a chat suggests datasets of the catalogue.
   Without JS every record is shown and the form is not sent. */
(() => {
  const list = document.getElementById('obs-list');
  if (!list) return;
  const data = JSON.parse(document.getElementById('obs-data').textContent);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = Object.fromEntries(data.records.map(r => [r.id, r]));
  const rows = [...list.children];
  rows.forEach((row, i) => {
    row._facets = new Set(row.dataset.facets.split(' '));
    row._order = i;
  });
  const heroInput = document.getElementById('obs-q');
  const searchForm = document.getElementById('obs-search-form');
  const aiUrl = searchForm.dataset.ai || '';
  const grouped = document.getElementById('obs-group');
  const sort = document.getElementById('obs-sort');
  const count = document.getElementById('obs-count');
  const empty = document.getElementById('obs-empty');
  const clear = document.getElementById('obs-clear');
  const activeBox = document.getElementById('obs-active');
  const panel = document.getElementById('obs-facets');
  const panelToggle = document.getElementById('obs-facets-toggle');
  const panelN = document.getElementById('obs-facets-n');
  const boxes = [...panel.querySelectorAll('input[type=checkbox]')];
  const groups = [...new Set(boxes.map(b => b.name))];
  const label = box => box.closest('label').querySelector('.obs-facet-label').textContent;
  const expanded = new Set();

  // ------------------------------------------------------------ search and facets
  function state() {
    const chosen = {};
    boxes.filter(b => b.checked).forEach(b => (chosen[b.name] = chosen[b.name] || []).push(b.value));
    const words = barInput.value.toLowerCase().split(/\s+/).filter(Boolean);
    return { chosen, words };
  }

  // Within a group the values are alternatives; different groups and the search words must all match.
  function passes(row, chosen, words, skip) {
    for (const [group, values] of Object.entries(chosen)) {
      if (group !== skip && !values.some(v => row._facets.has(`${group}:${v}`))) return false;
    }
    return words.every(w => row.dataset.search.includes(w));
  }

  function order(list) {
    const key = sort.value;
    if (key === 'catalogue') return list.sort((a, b) => a._order - b._order);
    const value = row => row.querySelector('.obs-name').textContent.toLowerCase();
    const cmp = (a, b) => value(a).localeCompare(value(b));
    // family members stay right after their head row
    const heads = list.filter(r => r.dataset.head === 'true').sort(cmp);
    const members = list.filter(r => r.dataset.head !== 'true');
    return heads.flatMap(h => [h, ...members.filter(m => m.dataset.family === h.dataset.family)]);
  }

  function update(push = true) {
    const { chosen, words } = state();
    const filtering = words.length > 0 || Object.keys(chosen).length > 0;
    let shown = 0, hits = 0;
    const families = new Set();
    order(rows.slice()).forEach(row => list.appendChild(row));
    rows.forEach(row => {
      const hit = passes(row, chosen, words);
      // while grouping, family members are folded under the head row unless the family is open;
      // a search or a filter shows every matching record
      const folded = grouped.checked && !filtering && row.dataset.head === 'false' && !expanded.has(row.dataset.family);
      row.hidden = !hit || folded;
      row.classList.toggle('is-member', grouped.checked && row.dataset.head === 'false' && !row.hidden);
      if (hit) { hits++; families.add(row.dataset.family); }
      if (!row.hidden) shown++;
    });
    document.querySelectorAll('.obs-family').forEach(b => { b.hidden = filtering || !grouped.checked; });

    // facet counts: how many records each value would give with the other filters unchanged;
    // the bar under each value is its share of the largest value of the group
    const counts = new Map(boxes.map(box => [box,
      rows.filter(r => r._facets.has(`${box.name}:${box.value}`) && passes(r, chosen, words, box.name)).length]));
    const top = {};
    counts.forEach((n, box) => { top[box.name] = Math.max(top[box.name] || 0, n); });
    counts.forEach((n, box) => {
      const option = box.closest('label');
      option.querySelector('.obs-facet-count').textContent = n;
      option.classList.toggle('is-empty', n === 0 && !box.checked);
      option.style.setProperty('--share', top[box.name] ? (n / top[box.name]).toFixed(3) : 0);
    });
    groups.forEach(g => {
      const n = (chosen[g] || []).length;
      const badge = panel.querySelector(`[data-active-count="${g}"]`);
      badge.textContent = n;
      badge.hidden = n === 0;
    });
    const nFilters = Object.values(chosen).flat().length;
    panelN.textContent = nFilters ? ` (${nFilters})` : '';

    // active filters, each removable
    const chips = [];
    if (words.length) chips.push(`<button type="button" class="obs-chip" data-remove="q">“${esc(barInput.value.trim())}” <span aria-hidden="true">×</span><span class="visually-hidden">Remove the search</span></button>`);
    boxes.filter(b => b.checked).forEach(b => chips.push(
      `<button type="button" class="obs-chip" data-remove="${esc(b.name)}:${esc(b.value)}">${esc(label(b))} <span aria-hidden="true">×</span><span class="visually-hidden">Remove this filter</span></button>`));
    activeBox.innerHTML = chips.join('');
    activeBox.hidden = chips.length === 0;

    count.innerHTML = filtering
      ? `<strong>${hits}</strong> of ${rows.length} records match, from ${families.size} families`
      : grouped.checked ? `<strong>${families.size}</strong> families · ${rows.length} records` : `<strong>${rows.length}</strong> records`;
    empty.hidden = shown > 0;
    clear.hidden = !filtering;
    if (push) saveUrl(chosen);
  }

  // Cards or table: the same records, laid out by css; the choice is remembered in this browser.
  const wrap = document.querySelector('.obs-list-wrap');
  const views = [...document.querySelectorAll('[data-view]')];
  function setView(view) {
    wrap.classList.toggle('is-table', view === 'table');
    views.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    try { localStorage.setItem('obs-view', view); } catch (e) { /* not kept */ }
  }
  views.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
  try { if (localStorage.getItem('obs-view') === 'table') setView('table'); } catch (e) { /* cards */ }

  // Long filter groups show their first values; "Show all" opens the rest.
  panel.querySelectorAll('.obs-facet-more').forEach(b => {
    b.dataset.label = b.textContent;
    b.addEventListener('click', () => {
      const open = b.parentElement.classList.toggle('is-expanded');
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? 'Show fewer' : b.dataset.label;
    });
  });

  // The search is kept in the address, so a search can be shared or bookmarked.
  function saveUrl(chosen) {
    const params = new URLSearchParams();
    if (barInput.value.trim()) params.set('q', barInput.value.trim());
    Object.entries(chosen).forEach(([g, values]) => params.set(g, values.join(',')));
    if (sort.value !== 'catalogue') params.set('sort', sort.value);
    if (!grouped.checked) params.set('group', '0');
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}${location.hash}` : location.pathname + location.hash);
  }

  function loadUrl() {
    const params = new URLSearchParams(location.search);
    heroInput.value = barInput.value = params.get('q') || '';
    boxes.forEach(b => { b.checked = (params.get(b.name) || '').split(',').includes(b.value); });
    if (params.get('sort') && [...sort.options].some(o => o.value === params.get('sort'))) sort.value = params.get('sort');
    if (params.get('group') === '0') grouped.checked = false;
    boxes.filter(b => b.checked).forEach(b => b.closest('details').open = true);
    return params.toString() !== '';
  }

  function toResults() {
    document.getElementById('catalogue').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // The search bar of the page title and the one above the results are the same search.
  const barInput = document.getElementById('obs-q2');
  let typing;
  // With the assistant, the title bar is sent on submit only and the table keeps its own keyword search.
  [heroInput, barInput].forEach(input => input.addEventListener('input', () => {
    if (aiUrl && input === heroInput) return;
    (input === heroInput ? barInput : heroInput).value = input.value;
    clearTimeout(typing);
    typing = setTimeout(update, 120);
  }));
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    if (aiUrl && heroInput.value.trim()) return aiSearch(heroInput.value.trim());
    barInput.value = heroInput.value;
    update();
    toResults();
  });
  boxes.forEach(b => b.addEventListener('change', () => update()));
  grouped.addEventListener('change', () => update());
  sort.addEventListener('change', () => update());
  activeBox.addEventListener('click', e => {
    const chip = e.target.closest('[data-remove]');
    if (!chip) return;
    if (chip.dataset.remove === 'q') heroInput.value = barInput.value = '';
    else {
      const [g, v] = chip.dataset.remove.split(':');
      boxes.find(b => b.name === g && b.value === v).checked = false;
    }
    update();
  });
  clear.addEventListener('click', () => {
    heroInput.value = barInput.value = '';
    boxes.forEach(b => { b.checked = false; });
    update();
  });
  panelToggle.addEventListener('click', () => {
    const open = panel.classList.toggle('is-open');
    panelToggle.setAttribute('aria-expanded', String(open));
  });
  // "/" puts the cursor in the search bar, as in most search engines.
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) { e.preventDefault(); heroInput.focus(); }
  });
  document.querySelectorAll('.obs-family').forEach(b => { b.dataset.label = b.textContent; });
  document.querySelectorAll('.obs-family').forEach(b => b.addEventListener('click', () => {
    const family = b.dataset.expand;
    const open = !expanded.has(family);
    open ? expanded.add(family) : expanded.delete(family);
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Hide the other records' : b.dataset.label;
    update(false);
  }));
  // A shared link with a search opens on the results; a reload starts again from the top
  // (the search kept in the address stays applied, but neither it nor a #section moves the page).
  const nav = performance.getEntriesByType('navigation')[0];
  const reload = nav ? nav.type === 'reload' : false;
  if (reload) {
    history.scrollRestoration = 'manual';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    scrollTo(0, 0);
  }
  const fromUrl = loadUrl();
  update(false);
  if (fromUrl && !location.hash && !reload) toResults();

  // ------------------------------------------------------------ record details
  const dialog = document.getElementById('obs-dialog');
  const body = dialog.querySelector('[data-dialog-body]');
  const item = (label, value) => value ? `<dt>${label}</dt><dd>${value}</dd>` : '';

  function details(r) {
    const paper = r.paper ? esc(r.paper.cite) + (r.paper.doi
      ? ` · <a href="https://doi.org/${esc(r.paper.doi)}" target="_blank" rel="noopener">doi:${esc(r.paper.doi)}</a>`
      : r.paper.url ? ` · <a href="${esc(r.paper.url)}" target="_blank" rel="noopener">Read the paper</a>` : '') : '';
    const source = r.ours ? `<a href="${esc(r.url)}">Dataset page on this site, with the download</a>`
      : r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>`
      + (r.index ? `<br><small>This link is a secondary index (${esc(r.index)}), not the official release page.</small>` : '') : '';
    const cautions = [
      r.mixed && 'Part of the distributed data is not network traffic: only the traffic component is eligible, and it must be identified at file level.',
      r.size > 1 && `This record belongs to the ${esc(r.family || r.name)} family (${r.size} records): captures and derivatives of one family are not independent datasets.`,
      r.derived_from && `Derived from ${esc(r.derived_from)}: not an independent acquisition.`,
    ].filter(Boolean).map(t => `<li>${t}</li>`).join('');
    body.innerHTML = `
      <p class="card-kicker">${esc(r.domainGroup)}</p>
      <h2 id="obs-dialog-title" class="gate-title">${esc(r.name)}</h2>
      <dl class="obs-dl">
        ${item('Security task', esc(r.task))}
        ${item('Domain', esc(r.domain))}
        ${item('Traffic data', esc((r.data || []).join(', ')))}
        ${item('Access', r.access === 'request' ? 'On request' : 'Not restricted, as far as documented')}
        ${item('Source', source)}
        ${item('Original publication', paper)}
        ${item('Audit notes', esc(r.notes))}
      </dl>
      ${cautions ? `<ul class="obs-cautions">${cautions}</ul>` : ''}
      <div class="gate-actions">
        <a class="btn btn-ghost" href="#submit" data-report="${esc(r.name)}">Report a correction</a>
      </div>`;
    body.querySelector('[data-report]').addEventListener('click', e => {
      dialog.close();
      prefill(e.currentTarget.dataset.report, r.url);
    });
    dialog.showModal();
  }

  list.addEventListener('click', e => {
    const button = e.target.closest('[data-open]');
    if (button) details(byId[button.dataset.open]);
  });
  dialog.querySelectorAll('[data-dialog-close]').forEach(b => b.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  // ------------------------------------------------------------ AI-assisted search and chat
  const aiPanel = document.getElementById('obs-ai');
  const paragraphs = text => String(text || '').split(/\n+/).filter(t => t.trim()).map(t => `<p>${esc(t)}</p>`).join('');

  // One suggested dataset with the reason given by the model; the name opens the record details.
  function pick(r, why, rank) {
    const tags = [r.ours && '<span class="tag tag-accent">Traffic group</span>',
      r.size > 1 && `<span class="tag">Family · ${r.size} records</span>`,
      r.access === 'request' && '<span class="tag">On request</span>'].filter(Boolean).join('');
    return `<li class="obs-pick">
      <span class="obs-pick-rank" aria-hidden="true">${rank}</span>
      <div class="obs-pick-body">
        <div class="obs-pick-head"><button type="button" class="obs-pick-name" data-open="${esc(r.id)}">${esc(r.name)}</button>${tags}</div>
        <p class="obs-pick-meta">${esc(r.domain)} · ${esc(r.task)}</p>
        ${why ? `<p class="obs-pick-why"><strong>Why</strong> ${esc(why)}</p>` : ''}
      </div>
    </li>`;
  }
  const picks = results => {
    const list = (results || []).filter(x => byId[x.id]);
    return list.length ? `<ol class="obs-picks">${list.map((x, i) => pick(byId[x.id], x.why, i + 1)).join('')}</ol>` : '';
  };

  async function ask(payload) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 60000);
    try {
      // text/plain keeps the request simple for the Apps Script web app (no CORS preflight); its answer is readable.
      const res = await fetch(aiUrl, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: abort.signal,
        body: JSON.stringify({ action: 'observatory_ai', ...payload }),
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'The assistant is not available right now.');
      return out;
    } catch (err) {
      throw new Error(err.name === 'AbortError' || err instanceof SyntaxError || err instanceof TypeError
        ? 'The assistant is not available right now.' : err.message);
    } finally {
      clearTimeout(timer);
    }
  }

  const aiNote = '<p class="obs-ai-note">Ranked by a Llama model from the catalogue records only. Check the source before using a dataset.</p>';
  let searching = 0;
  async function aiSearch(query) {
    const ticket = ++searching;
    aiPanel.hidden = false;
    aiPanel.innerHTML = `<div class="obs-ai-head"><p class="obs-ai-title"><span class="obs-ai-spark" aria-hidden="true">✦</span> Looking for “${esc(query)}” in the catalogue…</p></div>
      <div class="obs-ai-wait" aria-hidden="true"><span></span><span></span><span></span></div>`;
    toResults();
    try {
      const out = await ask({ mode: 'search', query });
      if (ticket !== searching) return;
      const list = picks(out.results);
      aiPanel.innerHTML = `<div class="obs-ai-head">
          <p class="obs-ai-title"><span class="obs-ai-spark" aria-hidden="true">✦</span> Best matches for “${esc(query)}”</p>
          <button type="button" class="pub-clear" data-ai-close>Close</button>
        </div>
        ${out.answer ? `<div class="obs-ai-answer">${paragraphs(out.answer)}</div>` : ''}
        ${list || '<p class="obs-ai-answer">No dataset of the catalogue fits this request. Try other words, or use the filters below.</p>'}
        ${aiNote}
        <p class="obs-ai-more">The full catalogue, with filters, is below. <button type="button" class="pub-clear" data-ai-chat>Ask a follow-up in the chat</button></p>`;
      aiPanel.dataset.query = query;
      aiPanel.dataset.answer = JSON.stringify(out);
    } catch (err) {
      if (ticket !== searching) return;
      // Without the assistant the request becomes a keyword search of the table.
      barInput.value = query;
      update();
      aiPanel.innerHTML = `<div class="obs-ai-head"><p class="obs-ai-title">${esc(err.message)}</p><button type="button" class="pub-clear" data-ai-close>Close</button></div>
        <p class="obs-ai-answer">Showing the keyword matches of “${esc(query)}” instead.</p>`;
    }
  }

  if (aiUrl) {
    aiPanel.addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) return details(byId[open.dataset.open]);
      if (e.target.closest('[data-ai-close]')) { aiPanel.hidden = true; searching++; }
      if (e.target.closest('[data-ai-chat]')) {
        const out = JSON.parse(aiPanel.dataset.answer || '{}');
        chat.push({ role: 'user', content: aiPanel.dataset.query }, { role: 'assistant', content: out.answer || '', results: out.results || [] });
        saveChat();
        renderChat();
        setMode('chat');
        document.querySelector('.obs-engine').scrollIntoView({ behavior: 'smooth' });
        chatInput.focus();
      }
    });
  }

  // The chat: the conversation is kept for the browser tab only.
  const chatBox = document.getElementById('obs-chat');
  const chatLog = document.getElementById('obs-chat-log');
  const chatForm = document.getElementById('obs-chat-form');
  const chatInput = document.getElementById('obs-chat-q');
  const modes = [...document.querySelectorAll('.obs-mode')];
  const greeting = chatLog ? chatLog.innerHTML : '';
  let chat = [];
  try { chat = JSON.parse(sessionStorage.getItem('obs-chat') || '[]'); } catch (e) { chat = []; }
  function saveChat() { try { sessionStorage.setItem('obs-chat', JSON.stringify(chat.slice(-20))); } catch (e) { /* not kept */ } }

  const bubble = m => m.role === 'user'
    ? `<div class="obs-msg obs-msg-user">${paragraphs(m.content)}</div>`
    : `<div class="obs-msg obs-msg-bot${m.error ? ' is-error' : ''}">${paragraphs(m.content)}${picks(m.results)}</div>`;
  function renderChat(waiting) {
    chatLog.innerHTML = greeting + chat.map(bubble).join('')
      + (waiting ? '<div class="obs-msg obs-msg-bot"><div class="obs-ai-wait" aria-label="The assistant is writing"><span></span><span></span><span></span></div></div>' : '');
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setMode(mode) {
    modes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    searchForm.hidden = mode === 'chat';
    chatBox.hidden = mode !== 'chat';
    if (mode === 'chat') { renderChat(); chatInput.focus(); } else heroInput.focus();
  }

  if (aiUrl && chatBox) {
    modes.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    chatLog.addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) details(byId[open.dataset.open]);
    });
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); chatForm.requestSubmit(); }
    });
    chatForm.addEventListener('submit', async e => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || chatForm.classList.contains('is-busy')) return;
      chat.push({ role: 'user', content: text });
      chatInput.value = '';
      chatForm.classList.add('is-busy');
      renderChat(true);
      // The model sees its earlier suggestions by name and id, so that a follow-up can refer to them.
      const messages = chat.filter(m => !m.error).map(m => ({
        role: m.role,
        content: m.content + (m.results && m.results.length
          ? '\nSuggested: ' + m.results.map(x => `${byId[x.id] ? byId[x.id].name : x.id} (${x.id})`).join(', ') : ''),
      }));
      try {
        const out = await ask({ mode: 'chat', messages });
        chat.push({ role: 'assistant', content: out.answer || '', results: out.results || [] });
      } catch (err) {
        chat.push({ role: 'assistant', content: err.message + ' You can still search the catalogue with the filters.', error: true });
      }
      saveChat();
      chatForm.classList.remove('is-busy');
      renderChat();
    });
    document.getElementById('obs-chat-new').addEventListener('click', () => {
      chat = [];
      saveChat();
      renderChat();
      chatInput.focus();
    });
  }

  // ------------------------------------------------------------ submission form
  const form = document.getElementById('obs-form');
  const error = form.querySelector('.gate-error');
  const done = form.querySelector('.obs-done');

  function prefill(name, url) {
    form.elements.dataset.value = name;
    if (url && !form.elements.url.value) form.elements.url.value = url;
    form.elements.description.placeholder = 'What should be corrected or added for this dataset?';
    setTimeout(() => form.elements.description.focus(), 300);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    done.hidden = true;
    if (!form.checkValidity()) {
      const invalid = form.querySelector(':invalid');
      error.textContent = invalid.type === 'checkbox' ? 'Please accept the storage of your details to continue.'
        : invalid.type === 'email' ? 'Please enter a valid email address.'
        : invalid.type === 'url' ? 'Please enter a full address, starting with https://'
        : 'Please fill in all the required fields.';
      error.hidden = false;
      invalid.focus();
      return;
    }
    error.hidden = true;
    const fields = ['dataset', 'url', 'paper', 'domain', 'access', 'task', 'description', 'name', 'organization', 'email', 'role'];
    const entry = Object.fromEntries(fields.map(n => [n, form.elements[n].value.trim()]));
    entry.data = [...form.querySelectorAll('[name=data]:checked')].map(b => b.value).join(', ');
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      // No web app configured yet: the submission is sent by email instead.
      const text = Object.entries(entry).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
      const cc = form.dataset.cc ? `cc=${encodeURIComponent(form.dataset.cc)}&` : '';
      window.location.href = `mailto:${form.dataset.contact}?${cc}subject=${encodeURIComponent('Observatory dataset submission: ' + entry.dataset)}&body=${encodeURIComponent(text)}`;
      done.textContent = 'Your email app should now open with the submission ready: send it to complete.';
      done.hidden = false;
      return;
    }
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    // Google Apps Script web app: a text/plain POST avoids the CORS preflight (the answer is not readable).
    fetch(endpoint, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'observatory_submission', ...entry, page: location.pathname }),
    }).then(() => {
      form.reset();
      done.textContent = `Thank you: “${entry.dataset}” has been submitted and will be reviewed by the Observatory team.`;
      done.hidden = false;
    }).catch(() => {
      error.textContent = 'The submission could not be sent. Please try again, or write to ' + form.dataset.contact + '.';
      error.hidden = false;
    }).finally(() => { button.disabled = false; });
  });
})();
