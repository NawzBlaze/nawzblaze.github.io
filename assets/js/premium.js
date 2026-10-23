(() => {
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Tiny progress indicator; update it at most once per animation frame.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.prepend(progress);

  let scrollQueued = false;
  let lastScrollY = window.scrollY;
  const updateScrollUI = () => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0) + ')';
    body.classList.toggle('has-scrolled', window.scrollY > 18);
    lastScrollY = window.scrollY;
    scrollQueued = false;
  };
  const queueScrollUI = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollUI);
  };
  window.addEventListener('scroll', queueScrollUI, { passive: true });
  window.addEventListener('resize', queueScrollUI, { passive: true });
  updateScrollUI();

  // Only animate meaningful regions, not every nested element.
  const revealSelectors = [
    '.hero-art', '.hero-foot', '.work-heading', '.project-copy',
    '.project-visual', '.work-endnote', '.belief-top', '.belief h2',
    '.belief-bottom', '.about-label', '.about-copy', '.contact-orbit', '.contact-copy'
  ];
  const revealTargets = [];
  revealSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (!element.hasAttribute('data-reveal')) element.setAttribute('data-reveal', 'premium');
      element.style.setProperty('--reveal-delay',
        element.matches('.project-visual, .hero-art, .contact-orbit') ? '120ms' : '0ms');
      if (!revealTargets.includes(element)) revealTargets.push(element);
    });
  });

  const projectCopies = [...document.querySelectorAll('.project-copy')];
  projectCopies.forEach((copy) => {
    copy.classList.add('motion-children');
    [...copy.children].forEach((child, index) => {
      child.style.setProperty('--child-delay', Math.min(index * 48, 300) + 'ms');
    });
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  // A small right-side index appears only when a desktop has room for it.
  const railData = [
    { href: '#work', label: 'WORK', number: '01', target: document.querySelector('#work') },
    { href: '#about', label: 'ABOUT', number: '02', target: document.querySelector('#about') },
    { href: '#contact', label: 'CONTACT', number: '03', target: document.querySelector('#contact') }
  ].filter((item) => item.target);
  const rail = document.createElement('nav');
  rail.className = 'scene-rail';
  rail.setAttribute('aria-label', 'Section navigation');
  railData.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.setAttribute('aria-label', item.label);
    link.dataset.section = item.href.slice(1);
    const number = document.createElement('span');
    number.textContent = item.label;
    number.setAttribute('aria-hidden', 'true');
    link.append(document.createTextNode(item.number), number);
    rail.append(link);
  });
  body.append(rail);

  if ('IntersectionObserver' in window && railData.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        rail.querySelectorAll('a').forEach((link) => {
          if (link.dataset.section === entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
    railData.forEach((item) => sectionObserver.observe(item.target));
  }

  if (reducedMotion) return;

  // All continuous-looking cursor movement stops as soon as the pointer stops.
  if (finePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-orbit';
    cursor.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('div');
    inner.className = 'cursor-orbit__inner';
    const label = document.createElement('span');
    label.className = 'cursor-orbit__label';
    label.textContent = 'VIEW';
    inner.append(label);
    cursor.append(inner);
    body.append(cursor);

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let cursorFrame = 0;
    const renderCursor = () => {
      currentX += (targetX - currentX) * .24;
      currentY += (targetY - currentY) * .24;
      cursor.style.transform = 'translate3d(' + currentX.toFixed(2) + 'px,' + currentY.toFixed(2) + 'px,0)';
      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > .25) {
        cursorFrame = window.requestAnimationFrame(renderCursor);
      } else {
        cursorFrame = 0;
      }
    };
    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('is-ready');
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(renderCursor);
    }, { passive: true });
    window.addEventListener('pointerleave', () => cursor.classList.remove('is-ready'));
    window.addEventListener('pointerenter', () => cursor.classList.add('is-ready'));

    const activeTargets = 'a,button,[role="button"],.project-visual';
    document.querySelectorAll(activeTargets).forEach((element) => {
      element.addEventListener('pointerenter', () => {
        cursor.classList.add('is-active');
        label.textContent = element.classList.contains('project-visual') ? 'EXPLORE' : '↗';
      });
      element.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
    });

    // Magnetic buttons use the independent CSS translate property, so hover
    // transforms remain composable and no layout is recalculated during scroll.
    const magnets = document.querySelectorAll('.header-cta,.hero-link,.project-button,.contact-button,.desktop-nav a,.contact-socials a');
    magnets.forEach((element) => {
      element.classList.add('magnetic-target');
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - .5;
        const ny = (event.clientY - rect.top) / rect.height - .5;
        const strength = element.matches('.project-button,.contact-button,.header-cta') ? 5 : 3.5;
        element.style.setProperty('--mag-x', (nx * strength * 2).toFixed(2) + 'px');
        element.style.setProperty('--mag-y', (ny * strength * 1.5).toFixed(2) + 'px');
      }, { passive: true });
      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--mag-x', '0px');
        element.style.setProperty('--mag-y', '0px');
      });
    });
  }

  // Cursor-following light and small, bounded parallax on the three art scenes.
  const setSpot = (element, event) => {
    const bounds = element.getBoundingClientRect();
    const nx = (event.clientX - bounds.left) / bounds.width;
    const ny = (event.clientY - bounds.top) / bounds.height;
    element.style.setProperty('--spot-x', (nx * 100).toFixed(2) + '%');
    element.style.setProperty('--spot-y', (ny * 100).toFixed(2) + '%');
    return { nx: nx - .5, ny: ny - .5 };
  };

  const heroArt = document.querySelector('.hero-art');
  if (heroArt && finePointer) {
    heroArt.addEventListener('pointermove', (event) => {
      const pos = setSpot(heroArt, event);
      heroArt.style.setProperty('--parallax-x', (pos.nx * 15).toFixed(2) + 'px');
      heroArt.style.setProperty('--parallax-y', (pos.ny * 15).toFixed(2) + 'px');
    }, { passive: true });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--spot-x', '68%');
      heroArt.style.setProperty('--spot-y', '30%');
      heroArt.style.setProperty('--parallax-x', '0px');
      heroArt.style.setProperty('--parallax-y', '0px');
    });
  }

  if (finePointer) {
    document.querySelectorAll('.project-visual').forEach((visual) => {
      const scene = visual.querySelector('.toolkit-scene, .scam-scene, .moment-scene');
      if (!scene) return;
      visual.addEventListener('pointermove', (event) => {
        const pos = setSpot(visual, event);
        scene.style.setProperty('--tilt-x', (-pos.ny * 7).toFixed(2) + 'deg');
        scene.style.setProperty('--tilt-y', (pos.nx * 7).toFixed(2) + 'deg');
        scene.style.setProperty('--move-x', (pos.nx * 7).toFixed(2) + 'px');
        scene.style.setProperty('--move-y', (pos.ny * 5).toFixed(2) + 'px');
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
  }

  // Return to the lightweight path when a user changes their OS preference.
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (event) => {
    if (event.matches) window.location.reload();
  });
})();