document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('primary-nav');
    const navToggle = document.querySelector('.nav-toggle');
    const dropdowns = document.querySelectorAll('.has-dropdown');
    const desktop = window.matchMedia('(min-width: 961px)');

    function setDropdown(item, open) {
        item.classList.toggle('open', open);
        item.querySelector('.dropdown-toggle').setAttribute('aria-expanded', String(open));
    }

    function closeAll(except) {
        dropdowns.forEach(item => { if (item !== except) setDropdown(item, false); });
    }

    // Mobile menu button
    navToggle.addEventListener('click', () => {
        const open = !nav.classList.contains('open');
        nav.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
    });

    dropdowns.forEach(item => {
        const toggle = item.querySelector('.dropdown-toggle');
        let hoverTimer;

        toggle.addEventListener('click', () => {
            const open = !item.classList.contains('open');
            closeAll(item);
            setDropdown(item, open);
        });

        // Hover opening on desktop only
        item.addEventListener('mouseenter', () => {
            if (!desktop.matches) return;
            clearTimeout(hoverTimer);
            closeAll(item);
            setDropdown(item, true);
        });
        item.addEventListener('mouseleave', () => {
            if (!desktop.matches) return;
            hoverTimer = setTimeout(() => setDropdown(item, false), 150);
        });
    });

    // Close on outside click and Escape
    document.addEventListener('click', event => {
        if (!event.target.closest('.has-dropdown')) closeAll();
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeAll();
        if (nav.classList.contains('open')) {
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.focus();
        }
    });

    // Close the mobile menu after following an in-page link
    nav.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            closeAll();
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Reset state when switching between mobile and desktop layouts
    desktop.addEventListener('change', () => {
        closeAll();
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});
