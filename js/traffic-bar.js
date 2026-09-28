/* TRAFFIC global bar — progressive enhancement for the native <details> menu
   and for legacy sub-site headers that are fixed to the top of the viewport. */
(() => {
  const bar = document.querySelector('.tgb');
  if (!bar) return;
  const root = document.documentElement;
  const menu = bar.querySelector('.tgb__menu');
  const summary = menu?.querySelector('summary');
  const compact = window.matchMedia('(max-width: 1023px)');

  if (menu && summary) {
    const close = (focusSummary = false) => {
      if (!menu.open) return;
      menu.open = false;
      if (focusSummary) summary.focus();
    };
    const syncExpanded = () => summary.setAttribute('aria-expanded', String(menu.open));
    syncExpanded();
    menu.addEventListener('toggle', syncExpanded);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) close(menu.contains(document.activeElement));
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) close();
    });
    menu.addEventListener('focusout', event => {
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) close();
    });
    menu.querySelector('.tgb__panel')?.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    compact.addEventListener?.('change', () => close());
  }

  // A fixed legacy header (e.g. Bootstrap .fixed-top) starts below the bar and slides up with it.
  if (document.querySelector('.tgb ~ .fixed-top')) {
    let frame = 0;
    const update = () => {
      frame = 0;
      root.style.setProperty('--tgb-offset', `${Math.max(0, bar.getBoundingClientRect().bottom)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
})();
