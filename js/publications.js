document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('pub-search');
    if (!search) return;
    const filters = [...document.querySelectorAll('.pub-filter')];
    const items = Array.from(document.querySelectorAll('.pub'));
    const years = [...document.querySelectorAll('.pub-year')];
    const jumpLinks = new Map([...document.querySelectorAll('.pub-jump a')].map(link => [link.hash.slice(1), link]));
    const count = document.querySelector('.pub-count');
    const clear = document.getElementById('pub-clear');
    const empty = document.querySelector('.pub-empty');
    const texts = items.map(li => li.textContent.toLowerCase());
    let category = null;

    function apply() {
        const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const active = Boolean(category || terms.length);
        let shown = 0;
        items.forEach((li, i) => {
            const visible = (!category || li.dataset.cat === category) &&
                terms.every(t => texts[i].includes(t));
            li.hidden = !visible;
            shown += visible;
        });
        years.forEach(section => {
            const visible = Boolean(section.querySelector('.pub:not([hidden])'));
            section.hidden = !visible;
            const link = jumpLinks.get(section.id);
            if (link) link.hidden = !visible;
        });
        count.textContent = active ? `${shown} of ${items.length} publications` : '';
        clear.hidden = !active;
        empty.hidden = shown !== 0;
    }

    search.addEventListener('input', apply);
    filters.forEach(button => {
        button.addEventListener('click', () => {
            category = category === button.dataset.cat ? null : button.dataset.cat;
            filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === category)));
            apply();
        });
    });
    clear.addEventListener('click', () => {
        category = null;
        search.value = '';
        filters.forEach(button => button.setAttribute('aria-pressed', 'false'));
        apply();
        search.focus();
    });
});
