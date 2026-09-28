/* Apply the saved or system theme before the stylesheet is painted. */
(() => {
  let preference;
  try {
    preference = localStorage.getItem('traffic-theme');
  } catch (_) {
    // Browsing without storage still follows the system preference.
  }

  const dark = preference === 'dark' ||
    (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = dark ? 'dark' : 'light';
  document.documentElement.classList.add('js');
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#0e1824' : '#fcfcfd';
})();
