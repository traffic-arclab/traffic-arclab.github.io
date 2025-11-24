document.addEventListener('DOMContentLoaded', () => {
    // Function to handle the toggle action for any submenu
    function handleSubmenuToggle(event) {
        // Find the toggle element that was clicked
        const toggle = event.currentTarget;
        const targetId = toggle.getAttribute('data-target');
        const submenu = document.getElementById(targetId);

        if (submenu) {
            // Check current state (expanded or collapsed)
            const isExpanded = submenu.classList.contains('expanded');
            
            // Toggle the 'expanded' class on both the toggle element and the submenu
            submenu.classList.toggle('expanded', !isExpanded);
            toggle.classList.toggle('expanded', !isExpanded);
        }
    }

    // Attach event listeners to all main submenu toggles
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', handleSubmenuToggle);
    });

    // Attach event listeners to all second-level submenu toggles
    document.querySelectorAll('.submenu-toggle-level-2').forEach(toggle => {
        toggle.addEventListener('click', handleSubmenuToggle);
    });
});