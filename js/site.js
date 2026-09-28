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
    if (meta) meta.content = theme === 'dark' ? '#101c2a' : '#fbfcfd';
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
    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', () => {
      updateHeader();
      closeDropdowns();
      if (!desktop.matches) setMenu(false);
    }, { passive: true });
  }

  // Animation is an enhancement; no content is hidden while waiting for scroll.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const candidates = document.querySelectorAll('.section-head, .area, .highlights .card, .latest-pubs > li, .person, .collab, .news-year');
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
