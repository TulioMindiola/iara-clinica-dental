/* IARA Clínica Dental — interactions and motion */
(() => {
  const WHATSAPP = '573147752016';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ── bar: solid after the hero, hides on the way down ───────── */
  const bar = document.querySelector('[data-bar]');
  let lastY = scrollY;
  const onBar = () => {
    const y = scrollY;
    bar.classList.toggle('is-solid', y > 40);
    bar.classList.toggle('is-hidden', y > innerHeight * 0.9 && y > lastY + 2);
    if (y < lastY - 2) bar.classList.remove('is-hidden');
    lastY = y;
  };

  /* ── reveals, once ──────────────────────────────────────────── */
  // a clip-path on the target itself hides it from the observer, so round pictures are watched through their parent
  const proxy = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      (proxy.get(e.target) || e.target).classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-reveal], .foot__mark, [data-mirror], [data-films], [data-rings], [data-topics]').forEach((el) => io.observe(el));
  document.querySelectorAll('[data-iris]').forEach((el) => { proxy.set(el.parentElement, el); io.observe(el.parentElement); });

  /* ── headings: lines rise on scroll ─────────────────────────── */
  const headings = [...document.querySelectorAll('[data-lines]')];
  if (headings.length && !reduce.matches) {
    const restore = (el) => { el.textContent = el.dataset.text; el.classList.remove('is-split', 'is-in'); };
    const split = (el) => {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      el.dataset.text = text;
      el.textContent = '';
      const words = text.split(' ').map((w) => {
        const s = document.createElement('span');
        s.style.display = 'inline-block';
        s.textContent = w;
        el.append(s, ' ');
        return s;
      });
      const lines = [];
      for (const w of words) {
        const last = lines.at(-1);
        if (last && Math.abs(last.top - w.offsetTop) < 4) last.words.push(w.textContent);
        else lines.push({ top: w.offsetTop, words: [w.textContent] });
      }
      el.textContent = '';
      lines.forEach((line, i) => {
        const mask = document.createElement('span');
        const inner = document.createElement('span');
        mask.className = 'lw';
        inner.style.setProperty('--i', i);
        inner.textContent = line.words.join(' ');
        mask.append(inner);
        el.append(mask, ' ');
      });
      el.classList.add('is-split');
    };
    const hio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        hio.unobserve(e.target);
        e.target.classList.add('is-in');
        const last = e.target.querySelector('.lw:last-of-type > span');
        if (last) last.addEventListener('transitionend', () => restore(e.target), { once: true });
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    document.fonts.ready.then(() => headings.forEach((el) => { split(el); hio.observe(el); }));
    let w = innerWidth;
    addEventListener('resize', () => {
      if (innerWidth === w) return;
      w = innerWidth;
      headings.filter((el) => el.matches('.is-split:not(.is-in)')).forEach((el) => { hio.unobserve(el); restore(el); });
    });
  }

  /* ── the mirror: drag the lens, see the after ───────────────── */
  const mirror = document.querySelector('[data-mirror]');
  if (mirror) {
    const disc = mirror.querySelector('.mirror__disc');
    const before = mirror.querySelector('[data-before]');
    const after = mirror.querySelector('[data-after]');
    const fact = document.querySelector('[data-fact]');
    const fullBtn = document.querySelector('[data-full]');
    const cases = [...document.querySelectorAll('[data-case]')];
    let pos = { x: 34, y: 50 };
    let dragging = false;

    const place = (x, y) => {
      pos = { x: clamp(x, 8, 92), y: clamp(y, 8, 92) };
      mirror.style.setProperty('--x', pos.x + '%');
      mirror.style.setProperty('--y', pos.y + '%');
    };
    const fromEvent = (e) => {
      const r = disc.getBoundingClientRect();
      place(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    };
    const setFull = (on) => {
      mirror.classList.toggle('is-full', on);
      fullBtn.setAttribute('aria-pressed', String(on));
      fullBtn.textContent = on ? 'Ver el antes' : 'Ver resultado completo';
    };

    // a glide across the smile, the first time the mirror is seen
    const glide = () => {
      if (reduce.matches) return;
      mirror.classList.add('is-glide');
      place(70, 46);
      setTimeout(() => { place(40, 54); }, 1500);
      setTimeout(() => mirror.classList.remove('is-glide'), 3000);
    };
    const gio = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { gio.disconnect(); setTimeout(glide, 700); }
    }, { threshold: 0.6 });
    gio.observe(mirror);

    disc.addEventListener('pointermove', (e) => {
      if (mirror.classList.contains('is-full') || mirror.classList.contains('is-glide')) return;
      if (e.pointerType === 'mouse' || dragging) fromEvent(e);
    });
    disc.addEventListener('pointerdown', (e) => {
      if (mirror.classList.contains('is-full')) setFull(false);
      mirror.classList.remove('is-glide');
      dragging = true;
      fromEvent(e);
    });
    addEventListener('pointerup', () => { dragging = false; });
    addEventListener('pointercancel', () => { dragging = false; });
    // on touch, dragging on the lens itself should not scroll the page
    disc.addEventListener('touchmove', (e) => { if (dragging) e.preventDefault(); }, { passive: false });

    mirror.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 12 : 5;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        if (mirror.classList.contains('is-full')) setFull(false);
        place(pos.x + moves[e.key][0], pos.y + moves[e.key][1]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFull(!mirror.classList.contains('is-full'));
      }
    });
    fullBtn.addEventListener('click', () => setFull(!mirror.classList.contains('is-full')));

    const preload = (src) => { const i = new Image(); i.src = src; return i; };
    cases.forEach((btn) => {
      const id = btn.dataset.case;
      preload(`img/caso-${id}-antes.jpg`); preload(`img/caso-${id}-despues.jpg`);
      btn.addEventListener('click', () => {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        cases.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const swap = () => {
          before.src = `img/caso-${id}-antes.jpg`;
          after.src = `img/caso-${id}-despues.jpg`;
          before.alt = btn.dataset.altBefore;
          after.alt = btn.dataset.altAfter;
          fact.textContent = btn.dataset.fact;
          mirror.setAttribute('aria-label', `Caso ${btn.textContent.toLowerCase()}. Fuera del espejo se ve el antes, dentro del espejo el después. Usa las flechas para mover el espejo y Enter para ver el resultado completo.`);
          setFull(false);
          place(34, 50);
          mirror.classList.remove('is-swapping');
        };
        if (reduce.matches) { swap(); return; }
        mirror.classList.add('is-swapping');
        setTimeout(swap, 300);
      });
    });
  }

  /* ── the window: a circle opens to the whole screen ─────────── */
  const win = document.querySelector('[data-window]');
  const winPhoto = document.querySelector('[data-window-photo]');
  const winTrack = document.querySelector('[data-window-track]');
  const onWindow = () => {
    if (!win || reduce.matches) return;
    const r = winTrack.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    const e = 1 - Math.pow(1 - clamp(p / 0.82, 0, 1), 3);
    winPhoto.style.setProperty('--wr', (15 + e * 60).toFixed(2) + '%');
    winPhoto.style.setProperty('--ws', (1.14 - e * 0.14).toFixed(3));
  };

  /* ── hero: the photo turns inside the ring as you leave ─────── */
  const heroImg = document.querySelector('[data-hero-img]');
  const heroRing = document.querySelector('[data-hero-ring]');
  const onHero = () => {
    if (reduce.matches || !heroImg) return;
    const y = Math.min(scrollY, innerHeight * 1.2);
    heroImg.style.transform = `rotate(${(y / innerHeight) * 14}deg)`;
    heroRing.style.translate = `0 ${(y * 0.12).toFixed(1)}px`;
  };

  /* ── magnetic disc button ───────────────────────────────────── */
  document.querySelectorAll('[data-magnet]').forEach((btn) => {
    if (!fine.matches || reduce.matches) return;
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.translate = `${dx * 0.18}px ${dy * 0.18}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
  });
  // the ink fill of every button grows from where the pointer enters
  document.querySelectorAll('.button').forEach((btn) => {
    btn.addEventListener('pointerenter', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--px', `${e.clientX - r.left}px`);
      btn.style.setProperty('--py', `${e.clientY - r.top}px`);
    });
  });

  /* ── guided surgery: many circles into one order ────────────── */
  const svg = document.querySelector('[data-guided]');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const build = () => {
      const tall = innerWidth <= 760;
      svg.setAttribute('viewBox', tall ? '0 0 300 400' : '0 0 1200 270');
      svg.textContent = '';
      seed = 7;
      const W = tall ? 300 : 1200, H = tall ? 400 : 270;
      const r = tall ? 4.2 : 6.5;
      const pts = [];
      // disorder
      for (let i = 0; i < 54; i++) {
        const a = rnd(), b = rnd();
        pts.push(tall
          ? { x: 20 + a * (W - 40), y: 14 + b * (H * 0.3), c: i % 2 ? '#d9d1c3' : '#c4b8a3' }
          : { x: 14 + a * (W * 0.31), y: 18 + b * (H - 36), c: i % 2 ? '#d9d1c3' : '#c4b8a3' });
      }
      // compression: a ribbon three dots high
      const ribbon = 48;
      for (let i = 0; i < ribbon; i++) {
        const col = Math.floor(i / 3), row = i % 3;
        const gap = r * 2.25;
        pts.push(tall
          ? { x: W / 2 + (row - 1) * gap, y: H * 0.36 + col * gap, c: '#9c8a6e' }
          : { x: W * 0.35 + col * gap, y: H / 2 + (row - 1) * gap, c: '#9c8a6e' });
      }
      // order: even rows in the accent
      const cols = tall ? 8 : 9, rows = 5;
      for (let i = 0; i < cols * rows; i++) {
        const cx = i % cols, cy = Math.floor(i / cols);
        pts.push(tall
          ? { x: 40 + cx * ((W - 80) / (cols - 1)), y: H * 0.78 + cy * 16 - 8, c: '#b38b53' }
          : { x: W * 0.7 + cx * ((W * 0.29) / (cols - 1)), y: 40 + cy * ((H - 80) / (rows - 1)), c: '#b38b53' });
      }
      pts.forEach((p, i) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', p.x.toFixed(1));
        c.setAttribute('cy', p.y.toFixed(1));
        c.setAttribute('r', r);
        c.setAttribute('fill', p.c);
        if (!reduce.matches && !svg.classList.contains('is-in')) {
          const dx = (rnd() - 0.5) * (tall ? 160 : 520);
          const dy = (rnd() - 0.5) * (tall ? 260 : 220);
          c.style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) scale(0.3)`;
          c.style.opacity = '0';
          c.style.setProperty('--dl', `${Math.round((tall ? p.y / H : p.x / W) * 700)}ms`);
        }
        svg.append(c);
      });
    };
    build();
    const sio = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      sio.disconnect();
      svg.classList.add('is-in');
      requestAnimationFrame(() => svg.querySelectorAll('circle').forEach((c) => { c.style.transform = ''; c.style.opacity = ''; }));
    }, { threshold: 0.3 });
    sio.observe(svg);
    let tall = innerWidth <= 760;
    addEventListener('resize', () => {
      const now = innerWidth <= 760;
      if (now !== tall) { tall = now; build(); }
    });
  }

  /* ── faq: one card open at a time ───────────────────────────── */
  const faq = document.querySelector('[data-faq]');
  if (faq) {
    const cards = [...faq.querySelectorAll('.card')];
    const open = (card) => {
      cards.forEach((c) => {
        const on = c === card;
        c.classList.toggle('is-open', on);
        c.querySelector('button').setAttribute('aria-expanded', String(on));
        const a = c.querySelector('.card__a');
        a.hidden = !on;
        if (on && !reduce.matches) a.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      });
    };
    cards[0].classList.add('is-open');
    cards.forEach((c) => c.querySelector('button').addEventListener('click', () => open(c)));
  }

  /* ── coupon: the message leaves ready for WhatsApp ──────────── */
  const form = document.querySelector('[data-coupon]');
  if (form) {
    const err = form.querySelector('[data-error]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const name = (d.get('nombre') || '').trim();
      const phone = (d.get('celular') || '').trim();
      form.querySelector('#f-name').setAttribute('aria-invalid', String(!name));
      form.querySelector('#f-phone').setAttribute('aria-invalid', String(!phone));
      if (!name || !phone) { err.hidden = false; (name ? form.querySelector('#f-phone') : form.querySelector('#f-name')).focus(); return; }
      err.hidden = true;
      const treat = d.get('tratamiento');
      const when = d.get('horario');
      const what = !treat || treat === 'Valoración general' ? 'una valoración' : `una valoración para ${treat.toLowerCase()}`;
      const time = when ? `, de preferencia ${when === 'Sábado' ? 'un sábado' : `en la ${when.toLowerCase()}`}` : '';
      const msg = `Hola IARA, soy ${name}. Quiero agendar ${what}${time}. Mi celular es ${phone}.`;
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });
  }

  /* ── videos: play only while they are on screen ─────────────── */
  const clips = [...document.querySelectorAll('video[data-play]')];
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); }
        else v.pause();
      }
    }, { threshold: 0.01 });
    clips.forEach((v) => vio.observe(v));
  }

  /* ── journey: three round films trade places ────────────────── */
  const filmBox = document.querySelector('[data-films]');
  let onFilms = () => {};
  if (filmBox) {
    const films = [...filmBox.querySelectorAll('.film')];
    const steps = [...document.querySelectorAll('[data-step]')];
    const order = ['c', 'a', 'b'];
    let timer = null, stopped = false, visible = false;
    const front = () => films.find((f) => f.dataset.slot === 'front');
    const show = (id) => {
      const target = films.find((f) => f.dataset.film === id);
      const current = front();
      if (!target || target === current) return;
      current.dataset.slot = target.dataset.slot;
      target.dataset.slot = 'front';
      steps.forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.step === id)));
      const v = target.querySelector('video');
      if (v && !reduce.matches) { v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); }
    };
    const stop = () => { stopped = true; clearInterval(timer); timer = null; };
    const run = () => {
      if (stopped || reduce.matches || timer || !visible) return;
      timer = setInterval(() => show(order[(order.indexOf(front().dataset.film) + 1) % order.length]), 5600);
    };
    const pause = () => { clearInterval(timer); timer = null; };
    steps.forEach((s) => s.addEventListener('click', () => { stop(); show(s.dataset.step); }));
    films.forEach((f) => f.addEventListener('click', () => { stop(); show(f.dataset.film); }));
    filmBox.addEventListener('pointerenter', pause);
    filmBox.addEventListener('pointerleave', run);
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) run(); else pause();
    }, { threshold: 0.35 }).observe(filmBox);
    // a little depth as the section passes: each circle drifts at its own speed
    const speeds = { a: -0.07, b: 0.09, c: -0.03 };
    onFilms = () => {
      if (reduce.matches) return;
      const r = filmBox.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const mid = r.top + r.height / 2 - innerHeight / 2;
      films.forEach((f) => { f.style.translate = `0 ${(mid * speeds[f.dataset.film]).toFixed(1)}px`; });
    };
  }

  /* ── reviews: the score counts up once ──────────────────────── */
  const fmt = (n) => n.toFixed(1).replace('.', ',');
  const score = document.querySelector('[data-count-to]');
  if (score && !reduce.matches && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      cio.disconnect();
      const to = parseFloat(score.dataset.countTo);
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1300);
        score.textContent = fmt(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    score.textContent = fmt(0);
    cio.observe(score);
  }

  /* ── reviews: live from Google once the clinic connects it ──── */
  // To connect: create an API key in Google Cloud with "Places API (New)" enabled,
  // restrict it to this site's domain (HTTP referrers), and paste it here.
  const GOOGLE = { apiKey: '', placeId: 'ChIJxYn6IWOFP44RlpPleAZSnRQ', maxReviews: 4 };
  const loadReviews = async () => {
    const box = document.querySelector('[data-reviews-live]');
    if (!box || !GOOGLE.apiKey) return;
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${GOOGLE.placeId}?languageCode=es&regionCode=CO`, {
        headers: { 'X-Goog-Api-Key': GOOGLE.apiKey, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' },
      });
      if (!res.ok) return;
      const place = await res.json();
      if (place.rating) {
        score.dataset.countTo = place.rating;
        score.textContent = fmt(place.rating);
        const rings = document.querySelector('[data-rings]');
        rings.setAttribute('aria-label', `${fmt(place.rating)} de 5 estrellas`);
        rings.querySelectorAll('.ring').forEach((r, i) => r.style.setProperty('--fill', clamp(place.rating - i, 0, 1)));
      }
      if (place.userRatingCount) document.querySelector('[data-total]').textContent = `${place.userRatingCount} reseñas`;
      const list = box.querySelector('[data-reviews-list]');
      const reviews = (place.reviews || []).filter((r) => r.text && r.text.text).slice(0, GOOGLE.maxReviews);
      if (!reviews.length) return;
      for (const r of reviews) {
        const author = r.authorAttribution || {};
        const li = document.createElement('li');
        li.className = 'review';
        const pic = document.createElement('span');
        pic.className = 'review__pic';
        if (author.photoUri) {
          const img = document.createElement('img');
          img.src = author.photoUri; img.alt = ''; img.width = 56; img.height = 56; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
          pic.append(img);
        } else pic.textContent = (author.displayName || '?').charAt(0);
        const body = document.createElement('div');
        const who = document.createElement('p');
        who.className = 'review__who';
        const name = document.createElement(author.uri ? 'a' : 'span');
        name.className = 'review__name link';
        name.textContent = author.displayName || 'Paciente';
        if (author.uri) { name.href = author.uri; name.target = '_blank'; name.rel = 'noopener'; }
        const when = document.createElement('span');
        when.className = 'review__when';
        when.textContent = r.relativePublishTimeDescription || '';
        who.append(name, when);
        const stars = document.createElement('p');
        stars.className = 'review__stars';
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', `${r.rating} de 5 estrellas`);
        for (let i = 0; i < 5; i++) { const d = document.createElement('span'); if (i >= r.rating) d.className = 'off'; stars.append(d); }
        const text = document.createElement('p');
        text.className = 'review__text';
        text.textContent = r.text.text;
        body.append(who, stars, text);
        li.append(pic, body);
        list.append(li);
      }
      box.hidden = false;
    } catch (e) { /* keep the static summary */ }
  };
  loadReviews();

  /* ── one scroll loop ────────────────────────────────────────── */
  let ticking = false;
  const frame = () => { onBar(); onWindow(); onHero(); onFilms(); ticking = false; };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();
})();
