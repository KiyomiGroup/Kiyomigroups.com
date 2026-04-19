/* ============================================================
   KIYOMI GROUP — Animation Runtime  (kiyomi-animations.js)
   Drop-in, zero-dependency. Works with the CSS file.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. SCROLL PROGRESS BAR ──────────────────────────────── */
  const bar = document.createElement('div');
  bar.id = 'ki-progress';
  document.body.prepend(bar);

  function updateBar() {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }
  window.addEventListener('scroll', updateBar, { passive: true });

  /* ── 2. CURSOR GLOW (desktop) ────────────────────────────── */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.id = 'ki-cursor-glow';
    document.body.appendChild(glow);

    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

    function tickGlow() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tickGlow);
    }
    tickGlow();

    // hide when mouse leaves
    document.addEventListener('mouseleave', () => glow.style.opacity = '0');
    document.addEventListener('mouseenter', () => glow.style.opacity = '1');
  }

  /* ── 3. SCROLL REVEAL ────────────────────────────────────── */
  const revealSelectors = '.ki-reveal, .ki-reveal-left, .ki-reveal-right, .ki-reveal-scale';
  const revealEls = document.querySelectorAll(revealSelectors);

  const revObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ki-in');
        revObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.09, rootMargin: '0px 0px -32px 0px' });

  revealEls.forEach(el => revObs.observe(el));

  /* ── 4. STAGGER CHILDREN ─────────────────────────────────── */
  // Any element with data-ki-stagger will get ki-reveal + delay applied
  // to each direct child automatically.
  document.querySelectorAll('[data-ki-stagger]').forEach(parent => {
    const step = parseFloat(parent.dataset.kiStagger) || 0.08;
    Array.from(parent.children).forEach((child, i) => {
      child.classList.add('ki-reveal');
      child.style.transitionDelay = (i * step) + 's';
      revObs.observe(child);
    });
  });

  /* ── 5. RIPPLE ON BUTTONS ────────────────────────────────── */
  document.querySelectorAll('.ki-ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ink  = document.createElement('span');
      ink.className = 'ki-ink';
      ink.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY  - rect.top  - size/2}px;
      `;
      btn.appendChild(ink);
      ink.addEventListener('animationend', () => ink.remove());
    });
  });

  /* ── 6. COUNTER ANIMATION ────────────────────────────────── */
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.kiCount) || 0;
    const suffix  = el.dataset.kiSuffix  || '';
    const prefix  = el.dataset.kiPrefix  || '';
    const dur     = parseFloat(el.dataset.kiDur) || 1400;
    const isFloat = !Number.isInteger(target);
    const start   = performance.now();

    function tick(now) {
      const t       = Math.min((now - start) / dur, 1);
      const eased   = 1 - Math.pow(1 - t, 3);          // ease-out-cubic
      const current = target * eased;
      el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-ki-count]').forEach(el => counterObs.observe(el));

  /* ── 7. SMOOTH NAV INDICATOR ─────────────────────────────── */
  // Highlights the correct nav link based on scroll position.
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('[data-ki-nav]');

  if (sections.length && navLinks.length) {
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('ki-nav-active'));
          const link = document.querySelector(`[data-ki-nav="${entry.target.id}"]`);
          if (link) link.classList.add('ki-nav-active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => sectionObs.observe(s));
  }

  /* ── 8. PAGE ENTER FADE ──────────────────────────────────── */
  document.documentElement.classList.add('ki-page-enter');

  /* ── 9. HOVER TILT on cards (subtle 3d) ─────────────────── */
  document.querySelectorAll('.ki-tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${cx * 6}deg) rotateX(${-cy * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

})();
