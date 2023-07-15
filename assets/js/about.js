const overlay = document.querySelector('.overlay');
const settingsWindow = document.getElementById('settings-window');

function showSettingsWindow() {
    settingsWindow.style.display = 'block';
    overlay.style.display = 'block';
    const closeButton = settingsWindow.querySelector('.close-icon');
    closeButton.addEventListener('click', hideSettingsWindow);
    overlay.addEventListener('click', hideSettingsWindow);
}

function hideSettingsWindow() {
    overlay.style.display = 'none';
    settingsWindow.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const toggleIcon = document.querySelector('.toggle-icon');
    const toggleLabel = document.querySelector('.toggle-label');
    const bigCardToggle = document.getElementById('big-card-toggle');
    toggleLabel.addEventListener('click', function () {
        bigCardToggle.checked = !bigCardToggle.checked;
        toggleIcon.src = bigCardToggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
        localStorage.setItem('bigCardToggle', bigCardToggle.checked);
    });
    const initialBigCardValue = localStorage.getItem('bigCardToggle');
    if (initialBigCardValue) {
        bigCardToggle.checked = initialBigCardValue === 'true';
    }
    toggleIcon.src = bigCardToggle.checked ? '/assets/images/toggle_on.svg' : '/assets/images/toggle_off.svg';
});