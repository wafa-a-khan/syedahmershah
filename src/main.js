import Lenis from 'lenis';
import { animate, createTimeline, stagger } from 'animejs';
import { createScene } from './scene.js';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

const NAMES = ['About', 'Education', 'Projects', 'Experience', 'Credentials', 'Profiles', 'Support', 'Data notice'];

/* Camera / pyramid pose per section: hero, then the eight stops. The pyramid sits opposite the text column. */
const POSES_DESKTOP = [
  { x: 3.9, ry: 0.5, cz: 18.5, cy: 4.2, s: 1, z: 0, y: 0 },
  { x: -4.3, ry: -0.4, cz: 15, cy: 3.4, s: 1, z: 0, y: 0 },
  { x: 4.3, ry: 0.9, cz: 15, cy: 3.4, s: 1, z: 0, y: 0 },
  { x: 0, ry: 1.4, cz: 22, cy: 5.4, s: 0.9, z: -7, y: 0 },
  { x: -4.3, ry: 0.2, cz: 15, cy: 3.4, s: 1, z: 0, y: 0 },
  { x: 4.3, ry: -0.7, cz: 15, cy: 3.4, s: 1, z: 0, y: 0 },
  { x: 0, ry: 0.9, cz: 23, cy: 5.6, s: 0.85, z: -8, y: 0 },
  { x: -4.3, ry: -0.3, cz: 15, cy: 3.4, s: 1, z: 0, y: 0 },
  { x: -4.3, ry: 0.4, cz: 14, cy: 3.2, s: 1, z: 0, y: 0 },
];
const POSES_MOBILE = POSES_DESKTOP.map((p, i) => ({ x: 0, ry: p.ry + i * 0.2, cz: 27, cy: 6.4, s: 0.85, z: -2, y: 1.2 }));

const sections = $$('[data-pose]');
const ladderLinks = $$('.ladder a');
const navLinks = $$('.nav ul a');
const bar = $('.progress');
const tip = $('#tip');
const cursor = $('#cursor');
const canvas = $('#scene');

let tops = [], bottoms = [], centers = [];
function measure() {
  const sy = window.scrollY;
  tops = sections.map((s) => s.getBoundingClientRect().top + sy);
  bottoms = sections.map((s) => s.getBoundingClientRect().bottom + sy);
  centers = tops.map((t, i) => (t + bottoms[i]) / 2);
}

/* ---------- scene ---------- */
const mobileQ = () => window.innerWidth <= 900;
const scene = createScene(canvas, { mobile: mobileQ() || coarse, reduced });
if (!scene) root.classList.add('no-webgl');

let activeSection = -1;
function onScroll() {
  const sy = window.scrollY;
  const max = root.scrollHeight - window.innerHeight;
  bar.style.setProperty('--p', (max > 0 ? clamp(sy / max) : 0).toFixed(4));

  const y = sy + window.innerHeight * 0.5;
  let i = 0;
  for (let k = 0; k < centers.length; k++) if (y >= centers[k]) i = k;
  const n = Math.min(i + 1, centers.length - 1);
  const span = centers[n] - centers[i] || 1;
  const t = smooth(clamp((y - centers[i]) / span));
  const P = mobileQ() ? POSES_MOBILE : POSES_DESKTOP;
  const a = P[i], b = P[n];
  const pose = {};
  for (const k of Object.keys(a)) pose[k] = a[k] + (b[k] - a[k]) * t;
  if (scene) scene.setPose(pose);

  let act = 0;
  for (let k = 0; k < sections.length; k++) if (y >= tops[k] && y < bottoms[k]) act = k;
  if (act !== activeSection) {
    activeSection = act;
    if (scene) scene.setActive(act);
    ladderLinks.forEach((l) => { if (+l.dataset.i === act) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
    const id = sections[act].id;
    navLinks.forEach((l) => { if (l.getAttribute('href') === '#' + id) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
  }
  if (reduced && scene) requestAnimationFrame((t2) => scene.update(t2));
}

/* ---------- smooth scroll (Lenis) ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', onScroll);
} else {
  window.addEventListener('scroll', onScroll, { passive: true });
}
function goTo(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.8 });
  else el.scrollIntoView({ behavior: 'auto', block: 'start' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id ? document.getElementById(id) : document.body;
  if (!el) return;
  e.preventDefault();
  goTo(id === 'top' ? document.body : el);
  history.replaceState(null, '', id && id !== 'top' ? '#' + id : location.pathname + location.search);
  $('.nav').classList.remove('open');
  const mb = $('.menu-btn'); if (mb) mb.setAttribute('aria-expanded', 'false');
});

/* ---------- scene <-> page wiring ---------- */
if (scene) {
  scene.handlers.onHover = (idx, x, y) => {
    if (idx < 0) { tip.classList.remove('on'); canvas.style.cursor = ''; return; }
    tip.textContent = NAMES[idx];
    tip.style.transform = `translate(${x + 18}px, ${y + 14}px)`;
    tip.classList.add('on');
    canvas.style.cursor = 'pointer';
  };
  scene.handlers.onPick = (idx) => {
    scene.burst(1);
    goTo(sections[idx + 1]);
  };
  ladderLinks.forEach((l) => {
    const i = +l.dataset.i - 1;
    l.addEventListener('pointerenter', () => scene.setExternalHover(i));
    l.addEventListener('pointerleave', () => scene.setExternalHover(-1));
    l.addEventListener('focus', () => scene.setExternalHover(i));
    l.addEventListener('blur', () => scene.setExternalHover(-1));
  });
}

/* ---------- text splitting helpers ---------- */
function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const w = document.createElement('span');
  w.className = 'word'; w.setAttribute('aria-hidden', 'true');
  for (const c of text) {
    const s = document.createElement('span');
    s.className = 'ch'; s.textContent = c;
    w.appendChild(s);
  }
  el.appendChild(w);
}
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', words.join(' '));
  el.textContent = '';
  words.forEach((word, i) => {
    const o = document.createElement('span'); o.className = 'hw'; o.setAttribute('aria-hidden', 'true');
    const n = document.createElement('span'); n.textContent = word;
    o.appendChild(n); el.appendChild(o);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
}

if (!reduced) {
  $$('.hero h1 .ln').forEach(splitChars);
  $$('h2').forEach(splitWords);
}

/* ---------- hero sequence (anime.js) ---------- */
function heroIn() {
  if (reduced) return;
  const tl = createTimeline({ defaults: { ease: 'outExpo' } });
  tl.add('.hero h1 .ch', { opacity: [0, 1], translateY: ['70%', '0%'], rotateX: [-85, 0], duration: 1500, delay: stagger(42) }, 250)
    .add('.hero .strap', { opacity: [0, 1], translateY: [24, 0], duration: 1000 }, 1150)
    .add('.hero .intro', { opacity: [0, 1], translateY: [24, 0], duration: 1000 }, 1300)
    .add('.hero .cta-row > *', { opacity: [0, 1], scale: [0.88, 1], duration: 900, delay: stagger(120) }, 1450)
    .add('.hero .plate, .hero .hint', { opacity: [0, 1], translateY: [16, 0], duration: 900, delay: stagger(120) }, 1700);
}

/* ---------- reveal on enter ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
  es.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    io.unobserve(el);
    if (el.matches('h2')) {
      animate($$('.hw > span', el), { translateY: ['108%', '0%'], duration: 1100, delay: stagger(80), ease: 'outExpo' });
    } else if (el.hasAttribute('data-count')) {
      const to = parseInt(el.getAttribute('data-count'), 10);
      const st = { v: 0 };
      animate(st, { v: to, duration: 1600, ease: 'outCubic', onUpdate: () => { el.textContent = Math.round(st.v); } });
    } else if (el.classList.contains('road')) {
      animate($('.road-line', el), { scaleY: [0, 1], duration: 2000, ease: 'outExpo' });
      animate($$('.mk', el), { scale: [0, 1], opacity: [0, 1], duration: 700, delay: stagger(260), ease: 'outBack' });
    } else if (el.classList.contains('stairs')) {
      animate($$('li', el), { opacity: [0, 1], translateY: [30, 0], duration: 900, delay: stagger(110), ease: 'outExpo' });
    }
  });
}, { threshold: 0.35 }) : null;
if (io && !reduced) {
  $$('h2, [data-count], .road, .stairs').forEach((el) => io.observe(el));
  root.classList.add('anim');
}

/* ---------- tilt cards + magnetic buttons ---------- */
if (!coarse && !reduced) {
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg)`;
      el.style.setProperty('--gx', px * 100 + '%');
      el.style.setProperty('--gy', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('[data-magnet]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.18}px, ${(e.clientY - (r.top + r.height / 2)) * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- cursor ring ---------- */
let cx = -100, cy = -100, tx = -100, ty = -100;
if (!coarse && cursor) {
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('on');
    cursor.classList.toggle('hot', !!(e.target.closest && e.target.closest('a,button,[data-tilt]')) || canvas.style.cursor === 'pointer');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
}

/* ---------- mobile menu ---------- */
const nav = $('.nav'), mb = $('.menu-btn');
if (mb) mb.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  mb.setAttribute('aria-expanded', String(open));
});

/* ---------- boot ---------- */
function frame(t) {
  if (lenis) lenis.raf(t);
  if (scene && !reduced) scene.update(t);
  if (cursor && !coarse) {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
  }
  requestAnimationFrame(frame);
}

function boot() {
  measure();
  onScroll();
  if (scene) {
    scene.update(performance.now());
    root.classList.add('scene-ready');
  }
  heroIn();
  requestAnimationFrame(frame);
  if (location.hash && location.hash.length > 1) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(() => goTo(el), 300);
  }
}

window.addEventListener('resize', () => { measure(); onScroll(); });
window.addEventListener('load', () => { measure(); onScroll(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); onScroll(); });
boot();
