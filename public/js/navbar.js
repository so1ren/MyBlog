(() => {
  const STORAGE_KEY = 'pref-theme';
  const checkbox = document.getElementById('checkbox');

  function detectTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    if (checkbox) checkbox.checked = isDark;
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(detectTheme());
  });

  if (checkbox) {
    checkbox.addEventListener('change', () => {
      const isDark = checkbox.checked;
      applyTheme(isDark);
      try {
        localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      } catch (e) {}
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches);
    }
  });
})();
