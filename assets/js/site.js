(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const year = document.querySelector('[data-year]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (year) year.textContent = String(new Date().getFullYear());

  const setMenu = (open) => {
    if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a')?.focus();
    else toggle.focus();
  };

  if (toggle instanceof HTMLButtonElement && menu instanceof HTMLElement) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
      if (event.matches && toggle.getAttribute('aria-expanded') === 'true') {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
        document.body.classList.remove('menu-open');
      }
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.dataset.motion = 'ready';
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }
})();