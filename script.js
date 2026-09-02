gsap.registerPlugin(ScrollTrigger);

/* ---------------- boot intro: matrix rain + gate ---------------- */
const CHAR_POOLS = [
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789',
  'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴァィゥェォャュョッ',
  'アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲン'
];
const RAIN_WORDS = [
  'SAMBRAM SANGALAD', 'CODING', 'MERN', 'AI', 'ML', 'REACT', 'NODE.JS',
  'PYTHON', 'OPENCV', 'YOLO', 'FULL-STACK', 'DEEP LEARNING', 'MONGODB', 'JAVASCRIPT'
];
function randomGlyph() {
  const pool = CHAR_POOLS[Math.floor(Math.random() * CHAR_POOLS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}
function buildColumnText(targetLen) {
  let out = '';
  while (out.length < targetLen) {
    if (Math.random() < 0.09) {
      out += RAIN_WORDS[Math.floor(Math.random() * RAIN_WORDS.length)] + ' ';
    } else {
      out += randomGlyph();
    }
  }
  return out;
}
function buildMatrixRain() {
  const container = document.getElementById('matrixRain');
  if (!container) return;
  container.innerHTML = '';
  const colWidth = 26;
  const count = Math.ceil(window.innerWidth / colWidth) + 2;
  for (let i = 0; i < count; i++) {
    const col = document.createElement('div');
    col.className = 'matrix-column';
    col.style.left = (i * colWidth) + 'px';
    col.style.animationDuration = (5.5 + Math.random() * 4.5).toFixed(2) + 's';
    col.style.animationDelay = '-' + (Math.random() * 6).toFixed(2) + 's';
    col.textContent = buildColumnText(60);
    container.appendChild(col);
  }
}
buildMatrixRain();
window.addEventListener('resize', () => {
  clearTimeout(window.__matrixResizeT);
  window.__matrixResizeT = setTimeout(buildMatrixRain, 300);
});

const introEl = document.getElementById('intro');
let introDismissed = false;

const introTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
introTl
  .to('.intro-log p', { opacity: 1, y: 0, duration: .5, stagger: .35 }, .3)
  .to('.intro-name', { opacity: 1, duration: .7 }, '+=.2')
  .to('.intro-enter', { opacity: 1, duration: .6 }, '-=.3')
  .to('.intro-hint', { opacity: 1, duration: .6 }, '-=.2');

function dismissIntro() {
  if (introDismissed) return;
  introDismissed = true;
  introEl.classList.add('is-leaving');
  document.body.classList.remove('locked');
  playHeroIntro();
  setTimeout(() => { introEl.style.display = 'none'; }, 750);
}

document.getElementById('introEnter').addEventListener('click', e => {
  e.stopPropagation();
  dismissIntro();
});
introEl.addEventListener('click', dismissIntro);
window.addEventListener('keydown', e => {
  if (!introDismissed && (e.key === 'Enter' || e.key === ' ')) dismissIntro();
});

/* ---------------- ambient background: pulsing katakana field ---------------- */
const KANA_POOL = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ';
const BG_WORDS = ['SAMBRAM SANGALAD', 'CODING', 'MERN', 'AI', 'ML', 'REACT', 'PYTHON'];

const JP_HOLD_MS = 900; // how long a character stays enlarged/shiny after the mouse moves off it, before fading back
const jpRevertTimers = new WeakMap();
let jpGridSpans = [];
let jpGridCols = 0;
let jpGridCell = 44;
let jpCurrentIdx = -1;

function jpActivate(span) {
  const pending = jpRevertTimers.get(span);
  if (pending) {
    clearTimeout(pending);
    jpRevertTimers.delete(span);
  }
  span.classList.add('hot');
}

function jpScheduleRevert(span) {
  const t = setTimeout(() => {
    span.classList.remove('hot');
    jpRevertTimers.delete(span);
  }, JP_HOLD_MS);
  jpRevertTimers.set(span, t);
}

function buildJpMatrixBg() {
  const el = document.getElementById('jpMatrixBg');
  if (!el) return;
  el.innerHTML = '';
  const cell = window.innerWidth <= 640 ? 34 : 44;
  const cols = Math.ceil((window.innerWidth * 1.12) / cell);
  const rows = Math.ceil((window.innerHeight * 1.12) / cell);
  const total = Math.min(cols * rows, 1400);
  const frag = document.createDocumentFragment();
  jpGridSpans = [];
  jpGridCols = cols;
  jpGridCell = cell;
  for (let i = 0; i < total; i++) {
    const span = document.createElement('span');
    const roll = Math.random();
    if (roll < 0.015) {
      span.textContent = BG_WORDS[Math.floor(Math.random() * BG_WORDS.length)];
      span.className = 'word';
    } else {
      span.textContent = KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
    }
    if (Math.random() < 0.1) {
      span.classList.add('pulse');
      span.style.setProperty('--dur', (2.6 + Math.random() * 3.4).toFixed(2) + 's');
      span.style.setProperty('--delay', (Math.random() * 4).toFixed(2) + 's');
    }
    frag.appendChild(span);
    jpGridSpans.push(span);
  }
  el.appendChild(frag);
  jpCurrentIdx = -1;
}
buildJpMatrixBg();
window.addEventListener('resize', () => {
  clearTimeout(window.__jpBgResizeT);
  window.__jpBgResizeT = setTimeout(buildJpMatrixBg, 300);
});

/* Work out which grid cell sits under the cursor directly from coordinates
   (not document.elementFromPoint) — the foreground content sections legitimately
   stack above this background layer, so a real hit-test would rarely reach it. */
function jpHandleMove(clientX, clientY) {
  const el = document.getElementById('jpMatrixBg');
  if (!el || !jpGridSpans.length) return;
  const rect = el.getBoundingClientRect();
  const col = Math.floor((clientX - rect.left) / jpGridCell);
  const row = Math.floor((clientY - rect.top) / jpGridCell);
  const idx = row * jpGridCols + col;
  const valid = col >= 0 && col < jpGridCols && idx >= 0 && idx < jpGridSpans.length;
  const newIdx = valid ? idx : -1;

  if (newIdx === jpCurrentIdx) return;
  if (jpCurrentIdx !== -1) {
    const prevSpan = jpGridSpans[jpCurrentIdx];
    if (prevSpan) jpScheduleRevert(prevSpan);
  }
  jpCurrentIdx = newIdx;
  if (newIdx !== -1) jpActivate(jpGridSpans[newIdx]);
}

let jpMovePending = false;
let jpLastX = -9999, jpLastY = -9999;
window.addEventListener('mousemove', e => {
  jpLastX = e.clientX;
  jpLastY = e.clientY;
  if (!jpMovePending) {
    jpMovePending = true;
    requestAnimationFrame(() => {
      jpHandleMove(jpLastX, jpLastY);
      jpMovePending = false;
    });
  }
});
document.addEventListener('mouseleave', () => {
  if (jpCurrentIdx !== -1) {
    const prevSpan = jpGridSpans[jpCurrentIdx];
    if (prevSpan) jpScheduleRevert(prevSpan);
    jpCurrentIdx = -1;
  }
});

/* ---------------- crosshair cursor ---------------- */
const cross = document.getElementById('cross');
let curX = 0, curY = 0, tX = 0, tY = 0;
window.addEventListener('mousemove', e => {
  tX = e.clientX; tY = e.clientY;
  cross.classList.add('on');
});
document.addEventListener('mouseleave', () => cross.classList.remove('on'));
gsap.ticker.add(() => {
  curX += (tX - curX) * 0.25;
  curY += (tY - curY) * 0.25;
  cross.style.left = curX + 'px';
  cross.style.top = curY + 'px';
});
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => cross.classList.add('big'));
  el.addEventListener('mouseleave', () => cross.classList.remove('big'));
});

/* ---------------- scroll % readout ---------------- */
const scrollYEl = document.getElementById('scrollY');
window.addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
  if (scrollYEl) scrollYEl.textContent = String(pct).padStart(3, '0');
}, { passive: true });

/* ---------------- ambient background parallax ---------------- */
const jpMatrixBg = document.querySelector('.jp-matrix-bg');
gsap.to(jpMatrixBg, {
  yPercent: 10,
  ease: 'none',
  scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
});

/* ---------------- hero entrance sequence (runs after intro is dismissed) ---------------- */
function playHeroIntro() {
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .to('#scanline', { opacity: 1, duration: .3 })
    .to('#scanline', { top: '60%', duration: 1.1, ease: 'power2.inOut' }, 0)
    .to('#scanline', { opacity: 0, duration: .4 }, 1.0)
    .to('.hero-tag', { opacity: 1, duration: .5 }, .2)
    .to('.hero h1 .line span', { y: '0%', rotateX: 0, duration: 1, stagger: .12, ease: 'power4.out' }, .3)
    .to('.hero-box', { opacity: 1, duration: .6 }, .85)
    .to('.hero-meta', { opacity: 1, duration: .6 }, 1.05)
    .to('.hero-floor', { opacity: 1, duration: 1, ease: 'power2.out' }, .5)
    .to('.hero-cta', { opacity: 1, duration: .6 }, 1.2)
    .to('.scroll-cue', { opacity: 1, duration: .6 }, 1.25);
}

/* hero floor + heading drift with scroll for a depth-of-field feel */
gsap.to('.hero-floor', {
  yPercent: -20,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
});
gsap.to('.hero-inner', {
  z: -220,
  rotateX: 6,
  opacity: 0.2,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
});

/* ---------------- generic fade/rise reveal ---------------- */
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

/* ---------------- 3D scroll-scrubbed tilt reveal ---------------- */
gsap.utils.toArray('.tilt-el').forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, z: -140, rotateX: 10, y: 40 },
    {
      opacity: 1, z: 0, rotateX: 0, y: 0, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 55%', scrub: 0.8 }
    }
  );
});

/* ---------------- status rows: fly in from depth, staggered ---------------- */
gsap.utils.toArray('.status-row').forEach((row, i) => {
  gsap.to(row, {
    opacity: 1, z: 0, x: 0, duration: .8, delay: i * 0.05, ease: 'power3.out',
    scrollTrigger: { trigger: row, start: 'top 88%' }
  });
  const pct = row.getAttribute('data-pct');
  ScrollTrigger.create({
    trigger: row, start: 'top 85%',
    onEnter: () => row.querySelector('.bar i').style.width = pct + '%'
  });
});

/* ---------------- project cards: 3D scroll-driven settle + corner draw ---------------- */
function initProjAnimations(scopeEl) {
  /* scopeEl must be a DOM element (GSAP does not accept selector strings as scope) */
  const el = typeof scopeEl === 'string' ? document.querySelector(scopeEl) : scopeEl;
  if (!el) return;
  gsap.utils.toArray('.proj', el).forEach((proj, i) => {
    gsap.fromTo(proj,
      { rotateX: 8, rotateY: i % 2 === 0 ? -4 : 4, z: -160, opacity: 0, y: 60 },
      {
        rotateX: 0, rotateY: 0, z: 0, opacity: 1, y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: proj, start: 'top 92%', end: 'top 50%', scrub: 0.9 }
      }
    );
    const corners = proj.querySelectorAll('.corner');
    gsap.to(corners, {
      opacity: 1, duration: .4, stagger: .08,
      scrollTrigger: { trigger: proj, start: 'top 70%' }
    });
  });
}
initProjAnimations(document.getElementById('projects-visible'));

/* ---------------- Show More / Show Less toggle (horizontal slide) ---------------- */
(function () {
  const btn        = document.getElementById('projShowMoreBtn');
  const track      = document.getElementById('projects-track');
  const extraEl    = document.getElementById('projects-extra');
  const label      = btn.querySelector('.btn-label');
  const countLabel = document.getElementById('proj-count-label');
  const projSec    = document.getElementById('projects');
  let isOpen       = false;
  let extraInited  = false;
  let animating    = false;

  /* Lazily init animations + interactivity for extra cards (runs once) */
  function initExtra() {
    if (extraInited) return;
    extraInited = true;
    initProjAnimations(extraEl);   /* pass DOM element, not selector string */
    extraEl.querySelectorAll('.proj .frame').forEach(frame => {
      const strength = 10;
      frame.addEventListener('mousemove', e => {
        const r  = frame.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        gsap.to(frame, { rotateY: px * strength, rotateX: -py * strength, duration: .5, ease: 'power2.out', transformPerspective: 700 });
      });
      frame.addEventListener('mouseleave', () => {
        gsap.to(frame, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' });
      });
    });
    extraEl.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cross.classList.add('big'));
      el.addEventListener('mouseleave', () => cross.classList.remove('big'));
    });
    ScrollTrigger.refresh();
  }

  btn.addEventListener('click', () => {
    if (animating) return;
    animating = true;

    /* Always scroll to the top of the projects section first */
    projSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Short delay so the scroll settles before the slide fires */
    setTimeout(() => {
      if (!isOpen) {
        /* ---- SLIDE LEFT: show extra projects ---- */
        isOpen = true;
        btn.setAttribute('aria-expanded', 'true');
        label.textContent = 'Show less';
        countLabel.textContent = '003 / DETECTED OBJECTS (6)';
        extraEl.style.pointerEvents = 'auto';   // enable interaction on extra panel

        gsap.to(track, {
          xPercent: -50,
          duration: 0.75,
          ease: 'power3.inOut',
          onComplete: () => {
            initExtra();
            animating = false;
          }
        });

      } else {
        /* ---- SLIDE RIGHT: back to first 3 ---- */
        isOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        label.textContent = 'Show more — 3 more objects detected';
        countLabel.textContent = '003 / DETECTED OBJECTS (3)';
        extraEl.style.pointerEvents = 'none';   // block extra panel pointer events again

        gsap.to(track, {
          xPercent: 0,
          duration: 0.75,
          ease: 'power3.inOut',
          onComplete: () => { animating = false; }
        });
      }
    }, 400); /* wait for smooth-scroll to start before sliding */
  });
})();



/* ---------------- mouse-driven 3D tilt on project frames ---------------- */
document.querySelectorAll('.proj .frame').forEach(frame => {
  const strength = 10; // deg
  frame.addEventListener('mousemove', e => {
    const r = frame.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(frame, {
      rotateY: px * strength,
      rotateX: -py * strength,
      duration: .5,
      ease: 'power2.out',
      transformPerspective: 700
    });
  });
  frame.addEventListener('mouseleave', () => {
    gsap.to(frame, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' });
  });
});

/* ---------------- about photo + split panels: depth pop-in ---------------- */
gsap.utils.toArray('.about-photo-wrap, .split').forEach(el => {
  gsap.fromTo(el,
    { z: -100, opacity: 0, y: 30 },
    {
      z: 0, opacity: 1, y: 0, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 60%', scrub: 0.8 }
    }
  );
});
