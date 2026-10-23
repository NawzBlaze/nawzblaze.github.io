(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const year = document.querySelector('[data-year]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastFocus = null;

  if (year) year.textContent = String(new Date().getFullYear());

  const isOpen = () => toggle instanceof HTMLButtonElement &&
    toggle.getAttribute('aria-expanded') === 'true';

  const closeMenu = (restoreFocus = false) => {
    if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    menu.hidden = true;
    document.body.classList.remove('menu-open');
    if (restoreFocus) toggle.focus();
    else if (lastFocus instanceof HTMLElement && document.activeElement === menu) lastFocus.focus();
  };

  const openMenu = () => {
    if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menu.querySelector('a')?.focus();
  };

  if (toggle instanceof HTMLButtonElement && menu instanceof HTMLElement) {
    toggle.addEventListener('click', () => {
      if (isOpen()) closeMenu(true);
      else openMenu();
    });

    menu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => closeMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) closeMenu(true);
    });

    const desktopQuery = window.matchMedia('(min-width: 761px)');
    desktopQuery.addEventListener('change', (event) => {
      if (event.matches && isOpen()) closeMenu(false);
    });
  }

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.documentElement.dataset.motion = 'ready';
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        activeObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }
})();