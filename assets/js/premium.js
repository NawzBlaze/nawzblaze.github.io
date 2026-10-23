(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A one-pixel reading indicator gives long pages a little orientation.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);

  let scrollQueued = false;
  const updateProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.transform = 'scaleX(' + amount + ')';
    scrollQueued = false;
  };
  const queueProgress = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateProgress);
  };
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  updateProgress();

  // Extend the original reveal system to the work and story sections.
  const revealSelectors = [
    '.hero-art', '.hero-foot', '.work-heading', '.project-copy',
    '.project-visual', '.work-endnote', '.belief-top', '.belief h2',
    '.belief-bottom', '.about-label', '.about-copy', '.contact-orbit', '.contact-copy'
  ];
  const revealTargets = [];
  revealSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.hasAttribute('data-reveal')) element.setAttribute('data-reveal', 'premium');
      element.style.setProperty('--reveal-delay', element.matches('.project-visual, .hero-art, .contact-orbit') ? '100ms' : '0ms');
      if (!revealTargets.includes(element)) revealTargets.push(element);
    });
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.05 });
    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  if (reducedMotion) return;

  // Pointer-responsive lighting in the hero and restrained 3D depth on product previews.
  const setSpot = (element, event) => {
    const bounds = element.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    element.style.setProperty('--spot-x', x.toFixed(2) + '%');
    element.style.setProperty('--spot-y', y.toFixed(2) + '%');
  };

  const heroArt = document.querySelector('.hero-art');
  if (heroArt && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    heroArt.addEventListener('pointermove', (event) => setSpot(heroArt, event), { passive: true });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--spot-x', '68%');
      heroArt.style.setProperty('--spot-y', '30%');
    });
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.project-visual').forEach((visual) => {
    const scene = visual.querySelector('.toolkit-scene, .scam-scene, .moment-scene');
    if (!scene) return;

    visual.addEventListener('pointermove', (event) => {
      setSpot(visual, event);
      const bounds = visual.getBoundingClientRect();
      const nx = ((event.clientX - bounds.left) / bounds.width) - 0.5;
      const ny = ((event.clientY - bounds.top) / bounds.height) - 0.5;
      scene.style.setProperty('--tilt-x', (-ny * 3.2).toFixed(2) + 'deg');
      scene.style.setProperty('--tilt-y', (nx * 3.2).toFixed(2) + 'deg');
      scene.style.setProperty('--move-x', (nx * 4).toFixed(2) + 'px');
      scene.style.setProperty('--move-y', (ny * 3).toFixed(2) + 'px');
    }, { passive: true });

    visual.addEventListener('pointerleave', () => {
      scene.style.setProperty('--tilt-x', '0deg');
      scene.style.setProperty('--tilt-y', '0deg');
      scene.style.setProperty('--move-x', '0px');
      scene.style.setProperty('--move-y', '0px');
      visual.style.setProperty('--spot-x', '65%');
      visual.style.setProperty('--spot-y', '30%');
    });
  });
})();