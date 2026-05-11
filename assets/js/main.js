/* ============================================
   REVIS STUDIO — interactions
   ============================================ */

(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Arm reveals as soon as JS runs. If anything goes wrong below, a safety
  // timer will reveal everything in 1.6s so content is never permanently hidden.
  if (!reduceMotion) document.documentElement.classList.add('js-on');
  const safety = setTimeout(() => {
    $$('.reveal, .stagger').forEach(el => el.classList.add('is-in'));
  }, 1600);

  /* ----- Header shrink on scroll ----- */
  const header = $('#siteHeader');
  if (header) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 12);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----- Mobile menu ----- */
  const btn = $('#menuBtn');
  const nav = $('#primaryNav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  }

  /* ----- Mark current nav item ----- */
  const here = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  $$('.nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\.html$/, '');
    if (href === here || (here === '/' && href === '/')) a.setAttribute('aria-current', 'page');
  });

  /* ----- Reveal on scroll ----- */
  const revealEls = $$('.reveal, .stagger');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('is-in'));
    clearTimeout(safety);
  } else if ('IntersectionObserver' in window) {
    // Mark currently-in-viewport elements immediately so above-the-fold content
    // is visible without waiting for the observer's first callback.
    const viewportTrigger = (rect) => rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    revealEls.forEach(el => { if (viewportTrigger(el.getBoundingClientRect())) el.classList.add('is-in'); });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => { if (!el.classList.contains('is-in')) io.observe(el); });
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
    clearTimeout(safety);
  }

  /* ----- Custom cursor (subtle dot, magnetic to interactive) ----- */
  const cursor = $('.cursor');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let cx = x, cy = y;
    const lerp = (a, b, n) => a + (b - a) * n;
    window.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const tick = () => {
      cx = lerp(cx, x, 0.22);
      cy = lerp(cy, y, 0.22);
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();
    const grow = 'a, button, summary, .work__item, .voice, .cta-card, [data-cursor]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(grow)) document.body.classList.add('cursor-grow');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(grow)) document.body.classList.remove('cursor-grow');
    });
  }

  /* ----- Marquee duplication safety: pause when off-screen ----- */
  const marqueeEls = $$('.marquee');
  if ('IntersectionObserver' in window) {
    const mio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const track = $('.marquee__track', e.target);
        if (!track) return;
        track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 });
    marqueeEls.forEach(el => mio.observe(el));
  }

  /* ----- Form (no-op, prevents reload; replace with backend endpoint) ----- */
  const form = $('#inquiryForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = $('#formStatus', form);
      const btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      const data = Object.fromEntries(new FormData(form).entries());
      // In production, POST to /api/inquiry or a service like Formspree.
      setTimeout(() => {
        if (status) {
          status.hidden = false;
          status.textContent = `Thank you, ${data.name || 'friend'} — your note has reached the studio. We will write back within one business day.`;
        }
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = 'Send to the studio →'; }
      }, 700);
    });
  }

  /* ----- FAQ: open one at a time within a group (native via name=) ----- */
  // Native <details name="..."> handles this. Nothing to do.

  /* ----- Year in footer if needed ----- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ----- Smooth-scroll for in-page links (respect prefers-reduced-motion) ----- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

})();
