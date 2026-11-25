(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body, root = document.documentElement;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var vh = window.innerHeight;

  /* ---------- opening animation ---------- */
  var intro = $('#intro');
  if (intro && !reduce) {
    body.classList.add('lock');
    var introN = document.getElementById('introN'), t0i = performance.now();
    (function tickN(now) {
      var p = clamp((now - t0i - 700) / 1500, 0, 1), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (introN) introN.textContent = ('00' + Math.round(e * 100)).slice(-3);
      if (p < 1) requestAnimationFrame(tickN);
    })(t0i);
    setTimeout(function () { body.classList.add('ready'); }, 2600);
    setTimeout(function () { intro.remove(); body.classList.remove('lock'); }, 3500);
  } else { if (intro) intro.remove(); body.classList.add('ready'); }

  /* ---------- clean URL: no #hash, no index.html ---------- */
  function cleanUrl() {
    var p = location.pathname.replace(/index\.html?$/i, '').replace(/\.html?$/i, '');
    if (p !== location.pathname || location.hash) { try { history.replaceState(null, '', p + location.search); } catch (e) {} }
  }
  cleanUrl();

  /* ---------- smooth scrolling (inertia for mouse wheels) ---------- */
  var target = window.scrollY, cur = target, gliding = false;
  var maxScroll = function () { return Math.max(0, root.scrollHeight - window.innerHeight); };
  function smoothTo(y) {
    y = clamp(y, 0, maxScroll());
    if (reduce) { window.scrollTo(0, y); return; }
    target = y; gliding = true;
  }
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      // trackpads already have their own inertia: leave small, fine-grained deltas alone
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 50) return;
      e.preventDefault();
      var d = e.deltaY * (e.deltaMode === 1 ? 34 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!gliding) { cur = window.scrollY; target = cur; }
      target = clamp(target + d, 0, maxScroll()); gliding = true;
    }, { passive: false });
  }
  window.addEventListener('scroll', function () { if (!gliding) { cur = target = window.scrollY; } }, { passive: true });

  function go(id) {
    var el = document.getElementById(id); if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (id === 'study') y += 2;
    smoothTo(y); cleanUrl();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]'); if (!a) return;
    e.preventDefault(); go(a.getAttribute('data-go'));
  });
  if (location.hash) { var hh = location.hash.slice(1); setTimeout(function () { go(hh); }, 60); }

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menuBtn'), mnav = $('#mnav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    mnav.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    body.classList.toggle('menu-open', open);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });
  }

  /* ---------- reveal ---------- */
  ['.sec-h', '.why-h', '.ten li', '.steps li', '.verify', '.help', '.ph', '.amen li', '.dist', '.glance', '.map', '.form', '.fc'].forEach(function (s) {
    $$(s).forEach(function (el, i) { el.classList.add('rv'); el.style.transitionDelay = ((i % 5) * 70) + 'ms'; });
  });
  function count(el) {
    var to = +el.dataset.count, t0 = null;
    if (reduce) { el.textContent = to; return; }
    (function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1800, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vis');
        $$('[data-count]', e.target).forEach(count);
        io.unobserve(e.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv,#state,.hero-s').forEach(function (el) { io.observe(el); });
  } else { body.classList.add('nojs'); $$('.state').forEach(function (e) { e.classList.add('vis'); }); $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count; }); }

  /* ---------- cached geometry (no layout reads while scrolling) ---------- */
  var featw = $('#featw'), featwEl = featw, study = $('#study'), foot = $('.foot'), stateEl = $('#state');
  var nav = $('#nav'), sky = $('#sky'), phs = $$('.ph[data-sp]');
  var spin = $('.spin'), spin2 = $('.state-pin'), portal = $('#portal'), tri = $('.state .tri'), bigEl = $('.state .big'), subEl = $('.state .c');
  var pimg = portal ? $('img', portal) : null, pblur = portal ? $('img.pb', portal) : null, sr = null;
  var G = {}, stW = 0, stH = 0;
  function box(el) { var r = el.getBoundingClientRect(); return { t: r.top + window.scrollY, h: r.height }; }
  var phC = [];
  function measure() {
    vh = window.innerHeight; stW = spin2 ? spin2.clientWidth : window.innerWidth; stH = spin2 ? spin2.clientHeight : vh;
    G.feat = box(featw); G.study = box(study); G.foot = box(foot); G.state = box(stateEl);
    phC = phs.map(function (el) { var old = el.style.transform; el.style.transform = ''; var b = box(el); el.style.transform = old; return b.t + b.h / 2; });
    sr = null;
  }
  var mT = 0;
  function remeasure() { cancelAnimationFrame(mT); mT = requestAnimationFrame(function () { measure(); dirty = true; }); }
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(body);
  function prog(g, y) { return clamp((y - g.t) / (g.h - vh), 0, 1); }

  /* ---------- features: cards change one by one ---------- */
  var fcs = $$('.fc'), gis = $$('.gi'), fcur = -1;
  function fset(i) {
    if (i === fcur) return; fcur = i;
    fcs.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    var d = fcs[i].dataset;
    gis.forEach(function (g) {
      var on = g.dataset.k === d.img; g.classList.toggle('on', on);
      if (on) { g.style.setProperty('--pos', d.pos); g.style.setProperty('--sc', d.s); g.style.objectPosition = d.pos; }
    });
  }
  fcs.forEach(function (c, i) {
    c.addEventListener('click', function () { smoothTo(G.feat.t + (i + .5) / fcs.length * (G.feat.h - vh)); });
  });

  /* ---------- zoom into the triangle ---------- */
  var stateInv = false;
  function measureTri() {
    bigEl.style.transform = 'none';
    tri.style.transition = 'none'; tri.style.transform = 'none'; void tri.offsetWidth;
    var a = tri.getBoundingClientRect(), b = spin2.getBoundingClientRect(), g = bigEl.getBoundingClientRect();
    tri.style.transform = ''; tri.style.transition = '';
    sr = { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height, ox: a.left + a.width / 2 - g.left, oy: a.top + a.height / 2 - g.top };
    bigEl.style.transformOrigin = sr.ox + 'px ' + sr.oy + 'px';
  }
  /* the triangle opens with the photo, then the photo simply fades out and the next section fades in */
  function stateUpdate(p, y0) {
    if (!portal) return;
    var z = clamp((p - .08) / .62, 0, 1), f = sstep(.58, .97, p);
    if (featwEl) { featwEl.style.opacity = f.toFixed(3); featwEl.style.setProperty('--fy', ((1 - f) * 40).toFixed(1) + 'px'); }
    if (z > 0 && (!sr || sr.w < 2)) measureTri();
    if (z <= 0) { sr = null; portal.style.opacity = 0; tri.style.visibility = 'visible'; bigEl.style.transform = ''; bigEl.style.opacity = ''; subEl.style.opacity = ''; stateInv = false; return; }
    var e = z * z * (3 - 2 * z), W = stW, H = stH;
    var x = sr.x * (1 - e), y = sr.y * (1 - e), w = sr.w * (1 - e) + W * e, h = sr.h * (1 - e) + H * e;
    var rad = (w / 2) * (1 - e);
    portal.style.clipPath = 'inset(' + y.toFixed(1) + 'px ' + (W - x - w).toFixed(1) + 'px ' + (H - y - h).toFixed(1) + 'px ' + x.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px ' + rad.toFixed(1) + 'px 0 0)';
    var po = 1 - sstep(.22, .74, z);
    portal.style.opacity = po.toFixed(3);
    if (pimg) {
      var sc = Math.max(w / W, h / H) * (1.3 - .3 * e);
      pimg.style.opacity = 1;
      pimg.style.transform = 'translate3d(' + (x + w / 2 - W / 2).toFixed(1) + 'px,' + (y + h / 2 - H / 2).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
    }
    tri.style.visibility = 'hidden';
    bigEl.style.transform = 'scale(' + (1 + e * 1.4).toFixed(3) + ')';
    bigEl.style.opacity = Math.max(0, 1 - e * 2).toFixed(3);
    subEl.style.opacity = Math.max(0, 1 - e * 4).toFixed(3);
    stateInv = e > .5 && po > .55;
  }

  /* ---------- DRAWN -> BUILT -> HOME: the building is built in code (three.js) ---------- */
  var sp = 0, wds = $$('.wd'), lastWi = -1, lastNight = null, ctrl = null, loading = false, gl3d = $('#gl3d');
  function loadScript(src, cb) {
    var el = document.createElement('script'); el.src = src; el.async = true; el.onload = cb;
    el.onerror = function () { loading = false; };
    document.head.appendChild(el);
  }
  function loadBuilding() {
    if (ctrl || loading || !gl3d) return;
    loading = true;
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', function () {
      loadScript('building.js', function () {
        try { ctrl = window.GadreBuilding(gl3d); ctrl.update(sp); } catch (e) { ctrl = null; }
        loading = false;
      });
    });
  }
  if ('IntersectionObserver' in window && study) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) loadBuilding(); }, { rootMargin: '120% 0px' }).observe(study);
  }
  window.addEventListener('resize', function () { if (ctrl) { ctrl.resize(); ctrl.update(sp); } });
  function studyUpdate() {
    var nm = 0;
    spin.style.backgroundColor = 'var(--bg)';
    spin.style.setProperty('--glow', sstep(.8, .97, sp).toFixed(3));
    var wi = sp < .31 ? 0 : sp < .5 ? 1 : 2;
    if (wi !== lastWi) { lastWi = wi; wds.forEach(function (w, kk) { w.classList.toggle('on', kk === wi); }); }
    var night = nm > .5;
    if (night !== lastNight) { lastNight = night; spin.classList.toggle('night', night); }
    if (ctrl) ctrl.update(sp);
  }

  /* ---------- one animation loop for everything ---------- */
  var sm = { state: 0, study: 0 }, lastY = -1, dirty = true, lastT = performance.now(), pIdx = -1;
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(64, now - lastT); lastT = now;

    // glide the page towards the wheel target
    if (gliding) {
      cur += (target - cur) * (1 - Math.exp(-dt / 105));
      if (Math.abs(target - cur) < .5) { cur = target; gliding = false; }
      window.scrollTo(0, cur);
    }
    var y = gliding ? cur : window.scrollY;
    if (document.hidden || !G.feat) return;

    var tState = prog(G.state, y), tStudy = prog(G.study, y);
    var k = 1 - Math.exp(-dt / 70);
    var moving = y !== lastY || Math.abs(tState - sm.state) > .0005 || Math.abs(tStudy - sm.study) > .0005 || dirty;
    if (!moving) return;
    sm.state += (tState - sm.state) * k; sm.study += (tStudy - sm.study) * k;
    if (Math.abs(tState - sm.state) < .0003) sm.state = tState;
    if (Math.abs(tStudy - sm.study) < .0003) sm.study = tStudy;

    if (moving) {
      lastY = y; dirty = false;
      // features
      fset(Math.min(fcs.length - 1, Math.floor(prog(G.feat, y) * fcs.length)));
      // zoom into the triangle
      stateUpdate(sm.state, y);
      // hero sky panel rises faster than the building
      if (sky && y < vh * 1.4 && !reduce) sky.style.setProperty('--sk', (y * .4).toFixed(1) + 'px');
      // staggered images drift
      for (var i = 0; i < phs.length; i++) {
        var off = phC[i] - y - vh / 2;
        if (off > -vh && off < vh) phs[i].style.transform = 'translate3d(0,' + (off * parseFloat(phs[i].dataset.sp)).toFixed(1) + 'px,0)';
      }
      // sun study
      sp = sm.study; studyUpdate();
      // nav
      var inStudyNight = spin.classList.contains('night') && y >= G.study.t - 30 && y < G.study.t + G.study.h - 60;
      var inv = inStudyNight || y >= G.foot.t - 40 || stateInv;
      nav.classList.toggle('inv', inv);
      nav.classList.toggle('solid', y > 40 && !inv);
    }
  }
  measure();
  requestAnimationFrame(loop);

  /* ---------- enquiry -> WhatsApp ---------- */
  var form = $('#enqForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var msg = 'Hello, I am ' + f.get('n') + ' (' + f.get('p') + '). I am interested in a ' + f.get('t') + ' at Gadre Empire, Sakharpa.' + (f.get('m') ? '\n' + f.get('m') : '');
    window.open('https://wa.me/918830786262?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
})();
