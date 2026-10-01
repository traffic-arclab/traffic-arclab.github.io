/* Shared interaction layer for the static TRAFFIC pages. */
(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const headerInner = document.querySelector('.header-inner');
  const nav = document.getElementById('primary-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const dropdowns = [...document.querySelectorAll('.has-dropdown')];
  const desktop = window.matchMedia('(min-width: 1181px)');
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function savedTheme() {
    try { return localStorage.getItem('traffic-theme'); } catch (_) { return null; }
  }

  function setTheme(theme, save = false) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0e1824' : '#fcfcfd';
    if (save) {
      try { localStorage.setItem('traffic-theme', theme); } catch (_) { /* storage is optional */ }
    }
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      const dark = theme === 'dark';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.querySelector('.theme-toggle-label').textContent = dark ? 'Dark' : 'Light';
    }
  }

  if (headerInner) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-toggle';
    toggle.innerHTML = `
      <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.8A8.5 8.5 0 0 1 9.2 3.5 8.5 8.5 0 1 0 20.5 14.8Z"/></svg>
      <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <span class="theme-toggle-label"></span>`;
    headerInner.append(toggle);
    setTheme(root.dataset.theme || (systemDark.matches ? 'dark' : 'light'));
    toggle.addEventListener('click', () => {
      root.classList.add('theme-changing');
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme, true);
      if (!reducedMotion.matches) {
        toggle.querySelector(nextTheme === 'dark' ? '.theme-icon-moon' : '.theme-icon-sun')?.animate?.(
          [{ opacity: .45, transform: 'scale(.85) rotate(-15deg)' }, { opacity: 1, transform: 'none' }],
          { duration: 240, easing: 'cubic-bezier(.2, .65, .25, 1)' }
        );
      }
      window.setTimeout(() => root.classList.remove('theme-changing'), 280);
    });
    systemDark.addEventListener('change', event => {
      if (savedTheme() !== 'dark' && savedTheme() !== 'light') setTheme(event.matches ? 'dark' : 'light');
    });
  }

  function setMenu(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function setDropdown(item, open) {
    item.classList.toggle('open', open);
    item.querySelector('.dropdown-toggle').setAttribute('aria-expanded', String(open));
  }

  function closeDropdowns(except = null) {
    dropdowns.forEach(item => { if (item !== except) setDropdown(item, false); });
  }

  if (nav && navToggle) {
    setMenu(false);
    navToggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      if (!open) closeDropdowns();
      setMenu(open);
    });

    dropdowns.forEach((item, index) => {
      const button = item.querySelector('.dropdown-toggle');
      const menu = item.querySelector('.dropdown');
      if (!button || !menu) return;
      menu.id ||= `nav-submenu-${index + 1}`;
      button.setAttribute('aria-controls', menu.id);
      let closeTimer;
      let openedByHover = false;

      button.addEventListener('click', () => {
        const open = openedByHover || !item.classList.contains('open');
        openedByHover = false;
        closeDropdowns(item);
        setDropdown(item, open);
      });
      button.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        closeDropdowns(item);
        setDropdown(item, true);
        requestAnimationFrame(() => menu.querySelector('a')?.focus());
      });
      item.addEventListener('mouseenter', () => {
        if (!desktop.matches || !hover.matches) return;
        clearTimeout(closeTimer);
        closeDropdowns(item);
        if (!item.classList.contains('open')) {
          setDropdown(item, true);
          openedByHover = true;
        }
      });
      item.addEventListener('mouseleave', () => {
        if (!desktop.matches || !hover.matches) return;
        openedByHover = false;
        closeTimer = setTimeout(() => setDropdown(item, false), 160);
      });
      item.addEventListener('focusout', () => {
        setTimeout(() => {
          if (!item.contains(document.activeElement)) setDropdown(item, false);
        }, 0);
      });
    });

    nav.addEventListener('click', event => {
      if (event.target.closest('a') && !desktop.matches) {
        closeDropdowns();
        setMenu(false);
      }
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.has-dropdown')) closeDropdowns();
      if (!event.target.closest('.site-header') && !desktop.matches) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const openDropdown = dropdowns.find(item => item.classList.contains('open'));
      closeDropdowns();
      if (openDropdown) openDropdown.querySelector('.dropdown-toggle').focus();
      else if (nav.classList.contains('open')) navToggle.focus();
      if (!desktop.matches) setMenu(false);
    });
    desktop.addEventListener('change', () => {
      closeDropdowns();
      setMenu(false);
    });
  }

  if (header) {
    // Sticky offsets (sub-navigation, year index, anchors) follow the real header height.
    const syncHeaderHeight = () => root.style.setProperty('--header-h', `${header.offsetHeight}px`);
    syncHeaderHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);
    else window.addEventListener('resize', syncHeaderHeight);

    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', () => {
      updateHeader();
      closeDropdowns();
      if (!desktop.matches) setMenu(false);
    }, { passive: true });
  }

  // Publications: mark the year currently being read in the sticky year index.
  const jump = document.querySelector('.pub-jump');
  if (jump && 'IntersectionObserver' in window) {
    const links = new Map([...jump.querySelectorAll('a[href^="#"]')].map(link => [link.hash.slice(1), link]));
    const visible = new Set();
    let active = null;
    const setActive = id => {
      const link = links.get(id);
      if (!link || link === active) return;
      active?.classList.remove('is-active');
      active?.removeAttribute('aria-current');
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'location');
      active = link;
      const left = link.offsetLeft - (jump.clientWidth - link.offsetWidth) / 2;
      jump.scrollTo({ left: Math.max(0, left), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    };
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
      const first = [...visible].filter(section => !section.hidden)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      if (first) setActive(first.id);
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.pub-year[id]').forEach(section => spy.observe(section));
  }

  // People: the whole card opens the person's homepage, or Scholar when there is none.
  document.querySelectorAll('.person').forEach(card => {
    const target = card.querySelector('.person-link:not([href=""])');
    if (!target) return;
    card.classList.add('is-linked');
    card.addEventListener('click', event => {
      if (event.target.closest('a') || String(window.getSelection())) return;
      if (event.metaKey || event.ctrlKey) window.open(target.href, '_blank', 'noopener');
      else window.location.href = target.href;
    });
    card.addEventListener('auxclick', event => {
      if (event.button === 1 && !event.target.closest('a')) window.open(target.href, '_blank', 'noopener');
    });
  });

  // Home highlights: add the latest news entries as slides and fade through them every 8 seconds.
  const rotator = document.querySelector('.rotator');
  if (rotator) setupRotator(rotator);

  async function setupRotator(container) {
    const slidesBox = container.querySelector('.rotator-slides');
    const source = container.dataset.newsSource;
    const count = Number(container.dataset.newsCount) || 5;
    if (source) {
      try {
        const res = await fetch(source);
        if (res.ok) {
          const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
          const base = new URL(source, location.href);
          const items = [];
          for (const entry of doc.querySelectorAll('.news-entry')) {
            const year = entry.closest('.news-year')?.querySelector('.news-year-title')?.textContent.trim() || '';
            const month = entry.querySelector('.news-month')?.textContent.trim() || '';
            for (const item of entry.querySelectorAll('.news-items > li')) {
              items.push({ item, date: `${month} ${year}`.trim(), anchor: entry.closest('.news-year')?.id });
              if (items.length === count) break;
            }
            if (items.length === count) break;
          }
          for (const { item, date, anchor } of items) slidesBox.appendChild(newsSlide(item, date, anchor, base));
        }
      } catch (_) { /* without the news the feature card stays on its own */ }
    }

    const slides = [...slidesBox.querySelectorAll('.rotator-slide')];
    if (slides.length < 2) return;

    const controls = document.createElement('div');
    controls.className = 'rotator-dots';
    const dots = slides.map((slide, index) => {
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rotator-dot';
      dot.setAttribute('aria-label', `Show highlight ${index + 1}`);
      dot.addEventListener('click', () => { show(index); restart(); });
      controls.appendChild(dot);
      return dot;
    });
    // Auto-rotation needs a way to stop it (WCAG 2.2.2): a pause/play toggle next to the dots.
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'rotator-toggle';
    toggle.addEventListener('click', () => { userPaused = !userPaused; restart(); });
    controls.appendChild(toggle);
    container.appendChild(controls);

    let current = 0, timer = null, userPaused = false, focusPaused = false;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.inert = !active;   // hidden slides keep their links out of the tab order
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    }
    function restart() {
      clearInterval(timer);
      toggle.setAttribute('aria-label', userPaused ? 'Play highlights' : 'Pause highlights');
      toggle.classList.toggle('is-paused', userPaused);
      if (!userPaused && !focusPaused && !document.hidden) timer = setInterval(() => show(current + 1), 8000);
    }
    // Keyboard users reading a slide are not interrupted; the mouse does not pause it.
    slidesBox.addEventListener('focusin', () => { focusPaused = true; restart(); });
    slidesBox.addEventListener('focusout', event => {
      if (!slidesBox.contains(event.relatedTarget)) { focusPaused = false; restart(); }
    });
    document.addEventListener('visibilitychange', restart);
    show(0);
    restart();
  }

  function newsSlide(item, date, anchor, base) {
    const slide = document.createElement('article');
    slide.className = 'card card-feature rotator-slide';
    const text = item.cloneNode(true);
    // Links in news.html are relative to that page.
    text.querySelectorAll('a[href]').forEach(a => { a.href = new URL(a.getAttribute('href'), base).href; });
    const first = text.querySelector('a[href]');
    const more = first ? first.href : new URL(anchor ? `#${anchor}` : '', base).href;
    slide.innerHTML = `
      <div class="card-tags"><span class="tag tag-accent">Latest news</span><span class="tag"></span></div>
      <p class="news-slide-text"></p>
      <a class="card-link">${first ? 'Read more' : 'See the news'} →</a>`;
    slide.querySelector('.tag:not(.tag-accent)').textContent = date;
    slide.querySelector('.news-slide-text').append(...text.childNodes);
    const link = slide.querySelector('.card-link');
    link.href = more;
    if (first && first.target) { link.target = first.target; link.rel = 'noopener'; }
    return slide;
  }

  // Animation is an enhancement; no content is hidden while waiting for scroll.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const candidates = document.querySelectorAll('.section-head, .area, .rotator, .highlights-side .card, .latest-pubs > li, .person, .collab, .news-year');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 48px 0px' });
    candidates.forEach(element => {
      if (element.getBoundingClientRect().top <= window.innerHeight + 32) return;
      observer.observe(element);
    });
  }
})();
