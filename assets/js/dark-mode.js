const darkModeToggle = document.getElementById('dark-mode-toggle');

function toggleDarkMode() {
  const currentIcon = darkModeToggle.textContent;
  darkModeToggle.textContent = currentIcon === 'dark_mode' ? 'light_mode' : 'dark_mode';
  document.body.classList.toggle('dark-mode', darkModeToggle.textContent === 'dark_mode');
  document.body.classList.toggle('light-mode', darkModeToggle.textContent === 'light_mode');
  localStorage.setItem('darkModeIcon', darkModeToggle.textContent);
}

document.addEventListener('DOMContentLoaded', function () {
  const savedIcon = localStorage.getItem('darkModeIcon');
  if (savedIcon) {
    darkModeToggle.textContent = savedIcon;
  }
  document.body.classList.toggle('dark-mode', darkModeToggle.textContent === 'dark_mode');
});

darkModeToggle.addEventListener('click', toggleDarkMode);