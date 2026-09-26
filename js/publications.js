document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('pub-search');
    const filters = document.querySelectorAll('.pub-filter');
    const items = Array.from(document.querySelectorAll('.pub'));
    const years = document.querySelectorAll('.pub-year');
    const count = document.querySelector('.pub-count');
    const texts = items.map(li => li.textContent.toLowerCase());
    let category = null;

    function apply() {
        const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        let shown = 0;
        items.forEach((li, i) => {
            const visible = (!category || li.dataset.cat === category) &&
                terms.every(t => texts[i].includes(t));
            li.hidden = !visible;
            shown += visible;
        });
        years.forEach(section => {
            section.hidden = !section.querySelector('.pub:not([hidden])');
        });
        count.textContent = shown === items.length ? '' : `${shown} of ${items.length} publications`;
    }

    search.addEventListener('input', apply);
    filters.forEach(button => {
        button.addEventListener('click', () => {
            category = category === button.dataset.cat ? null : button.dataset.cat;
            filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === category)));
            apply();
        });
    });
});
