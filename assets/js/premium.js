(() => {
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Tiny progress indicator; update it at most once per animation frame.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.prepend(progress);

  let scrollQueued = false;
  const updateScrollUI = () => {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0) + ')';
    body.classList.toggle('has-scrolled', window.scrollY > 18);
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
  const updateRailVisibility = () => {
    rail.classList.toggle('is-visible', window.scrollY > Math.min(420, window.innerHeight * .48));
  };
  window.addEventListener('scroll', updateRailVisibility, { passive: true });
  updateRailVisibility();

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
  // Interactive canvas constellation. Only runs while the hero art is on screen,
  // pauses in background tabs, caps pixel density, and uses no external libraries.
  if (heroArt && 'getContext' in document.createElement('canvas')) {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (context) {
      heroArt.prepend(canvas);
      let particles = [];
      let canvasWidth = 0;
      let canvasHeight = 0;
      let particleFrame = 0;
      let visible = false;
      let pointerX = -1000;
      let pointerY = -1000;
      let previousTime = 0;

      const resizeCanvas = () => {
        const rect = heroArt.getBoundingClientRect();
        const dpr = Math.min(1.4, window.devicePixelRatio || 1);
        canvasWidth = Math.max(1, rect.width);
        canvasHeight = Math.max(1, rect.height);
        canvas.width = Math.round(canvasWidth * dpr);
        canvas.height = Math.round(canvasHeight * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.max(20, Math.min(48, Math.round(canvasWidth * canvasHeight / 7600)));
        particles = Array.from({ length: count }, (_, index) => ({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          vx: (Math.random() - .5) * .012,
          vy: (Math.random() - .5) * .012,
          radius: index % 7 === 0 ? 1.8 : .75 + Math.random() * .65,
          tone: index % 6 === 0 ? 1 : 0
        }));
        if (visible) scheduleParticles();
      };

      const drawParticles = (time) => {
        particleFrame = 0;
        if (!visible || document.hidden || !context) return;
        const dt = previousTime ? Math.min(32, time - previousTime) : 16;
        previousTime = time;
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        const points = [];

        particles.forEach((particle) => {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          if (particle.x < -8) particle.x = canvasWidth + 8;
          if (particle.x > canvasWidth + 8) particle.x = -8;
          if (particle.y < -8) particle.y = canvasHeight + 8;
          if (particle.y > canvasHeight + 8) particle.y = -8;

          let x = particle.x;
          let y = particle.y;
          const dx = x - pointerX;
          const dy = y - pointerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 115 && dist > 0.1) {
            const push = (1 - dist / 115) * 10;
            x += (dx / dist) * push;
            y += (dy / dist) * push;
          }
          points.push({ x, y, particle });
        });

        for (let i = 0; i < points.length; i++) {
          const a = points[i];
          for (let j = i + 1; j < points.length; j++) {
            const b = points[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 92) continue;
            const alpha = (1 - dist / 92) * .22;
            context.strokeStyle = a.particle.tone || b.particle.tone
              ? 'rgba(183,196,255,' + alpha.toFixed(3) + ')'
              : 'rgba(213,255,104,' + alpha.toFixed(3) + ')';
            context.lineWidth = .65;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }

        points.forEach(({ x, y, particle }) => {
          context.beginPath();
          context.arc(x, y, particle.radius, 0, Math.PI * 2);
          context.fillStyle = particle.tone ? 'rgba(183,196,255,.8)' : 'rgba(213,255,104,.78)';
          context.fill();
        });

        scheduleParticles();
      };

      const scheduleParticles = () => {
        if (!particleFrame && visible && !document.hidden) {
          particleFrame = window.requestAnimationFrame(drawParticles);
        }
      };
      const stopParticles = () => {
        if (particleFrame) window.cancelAnimationFrame(particleFrame);
        particleFrame = 0;
        previousTime = 0;
      };
      const visibilityObserver = new IntersectionObserver((entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (visible) scheduleParticles();
        else stopParticles();
      }, { threshold: 0.02 });
      visibilityObserver.observe(heroArt);

      if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(heroArt);
      else window.addEventListener('resize', resizeCanvas, { passive: true });
      if (finePointer) {
        heroArt.addEventListener('pointermove', (event) => {
          const rect = heroArt.getBoundingClientRect();
          pointerX = event.clientX - rect.left;
          pointerY = event.clientY - rect.top;
        }, { passive: true });
        heroArt.addEventListener('pointerleave', () => {
          pointerX = -1000;
          pointerY = -1000;
        });
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopParticles();
        else scheduleParticles();
      });
      resizeCanvas();
    }
  }

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

  // Low-amplitude scroll parallax: four elements, one scheduled frame, transform-only.
  const scrollScenes = [...document.querySelectorAll('.project-visual')].map((visual) => ({
    visual,
    scene: visual.querySelector('.live-preview-frame, .toolkit-scene, .scam-scene, .moment-scene')
  })).filter((item) => item.scene);
  let parallaxFrame = 0;
  const updateParallax = () => {
    parallaxFrame = 0;
    if (document.hidden) return;
    if (heroArt) {
      const rect = heroArt.getBoundingClientRect();
      const offset = rect.bottom < -40 || rect.top > window.innerHeight + 40
        ? 0
        : Math.max(-22, Math.min(26, -rect.top * .035));
      heroArt.style.setProperty('--scroll-y', offset.toFixed(2) + 'px');
    }
    scrollScenes.forEach(({ visual, scene }) => {
      const rect = visual.getBoundingClientRect();
      if (rect.bottom < -60 || rect.top > window.innerHeight + 60) {
        scene.style.setProperty('--scroll-y', '0px');
        return;
      }
      const centre = rect.top + rect.height * .5;
      const offset = Math.max(-9, Math.min(9, (window.innerHeight * .56 - centre) * .018));
      scene.style.setProperty('--scroll-y', offset.toFixed(2) + 'px');
    });
  };
  const queueParallax = () => {
    if (parallaxFrame) return;
    parallaxFrame = window.requestAnimationFrame(updateParallax);
  };
  window.addEventListener('scroll', queueParallax, { passive: true });
  window.addEventListener('resize', queueParallax, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) queueParallax();
  });
  queueParallax();

  if (finePointer) {
    document.querySelectorAll('.project-visual').forEach((visual) => {
      const scene = visual.querySelector('.live-preview-frame, .toolkit-scene, .scam-scene, .moment-scene');
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