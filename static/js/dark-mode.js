(() => {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const htmlElement = document.documentElement;
  const icon = themeToggle.querySelector('i');

  // 1. Check Local Storage on load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
    icon.classList.replace('fa-moon', 'fa-sun');
  }

  // 2. Handle Click
  themeToggle.addEventListener('click', () => {
    const isDark = htmlElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
      // Switch to Light
      htmlElement.removeAttribute('data-theme');
      icon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
    } else {
      // Switch to Dark
      htmlElement.setAttribute('data-theme', 'dark');
      icon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
    }
  });
})();