/* Gadre Empire — the shop building, built entirely in code with three.js.
   One model, four looks: line drawing -> clay model -> colour render -> night. */
(function () {
  'use strict';
  var T = window.THREE;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  window.GadreBuilding = function (canvas) {
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(22, 1, 1, 500);

    /* ---------- lights ---------- */
    var amb = new T.AmbientLight(0xffffff, 1);
    var hemi = new T.HemisphereLight(0xd8e8ff, 0xe9e1d3, 0);
    var sun = new T.DirectionalLight(0xfff3e2, 0);
    sun.position.set(-34, 52, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -42; sun.shadow.camera.right = 42; sun.shadow.camera.top = 42; sun.shadow.camera.bottom = -42;
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 160;
    sun.shadow.bias = -0.0006;
    var moon = new T.DirectionalLight(0x8fa6ff, 0);
    moon.position.set(30, 40, 30);
    scene.add(amb, hemi, sun, moon);

    /* ---------- materials ---------- */
    var WHITE = new T.Color(0xfafafa);
    var defs = {
      white:  { clay: 0xe5e5e7, color: 0xf3f0ea, r: .9, m: 0 },
      stone:  { clay: 0xdcdcdf, color: 0xcfc8bb, r: .95, m: 0 },
      glass:  { clay: 0xb9bdc3, color: 0x7ea3c0, r: .18, m: .25 },
      shop:   { clay: 0xc6c6ca, color: 0xe9a748, r: .6, m: 0, em: 0xff8f2e },
      timber: { clay: 0xd9d9dc, color: 0x7a4829, r: .8, m: 0 },
      ceil:   { clay: 0xdcdcde, color: 0xb9814a, r: .7, m: 0, em: 0xffa24a },
      red:    { clay: 0xdedee0, color: 0xc5211b, r: .55, m: 0 },
      rail:   { clay: 0xd4d7db, color: 0x8fc0dc, r: .1, m: .2 },
      frame:  { clay: 0xc4c5c9, color: 0x2d3034, r: .5, m: .2 },
      green:  { clay: 0xd6d6d9, color: 0x3f7f3a, r: .95, m: 0 }
    };
    var mats = {};
    Object.keys(defs).forEach(function (k) {
      mats[k] = new T.MeshStandardMaterial({ color: WHITE, roughness: defs[k].r, metalness: defs[k].m, emissive: 0x000000 });
    });

    /* ---------- model ---------- */
    var group = new T.Group();
    scene.add(group);
    var meshes = [];
    function B(x0, x1, y0, y1, z0, z1, key) {
      var g = new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
      var m = new T.Mesh(g, mats[key]);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m); meshes.push(m); return m;
    }
    function C(x, z, r, y0, y1, key) {
      var g = new T.CylinderGeometry(r, r, y1 - y0, 20);
      var m = new T.Mesh(g, mats[key]);
      m.position.set(x, (y0 + y1) / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m); meshes.push(m); return m;
    }
    function S(x, y, z, r, key) {
      var m = new T.Mesh(new T.SphereGeometry(r, 18, 12), mats[key]);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      group.add(m); meshes.push(m); return m;
    }

    var G0 = 0.25, F0 = 0.25, F1 = 3.5, F2 = 6.9, F3 = 10.3;   // floor lines
    // three shop levels: solid back volume + storefront glass + mullions
    var levels = [[G0 + 0.0, 3.25], [3.75, 6.65], [7.15, 10.05]];
    levels.forEach(function (lv, i) {
      B(-10, 10, lv[0], lv[1], -6, 1.6, 'white');                       // hall behind the shops
      B(-10, 10, lv[0], lv[1], 1.6, 1.8, i === 0 ? 'shop' : 'shop');    // lit storefront
      for (var x = -10; x <= 10.01; x += 2.0) B(x - 0.07, x + 0.07, lv[0], lv[1], 1.7, 1.95, 'frame');
      B(-10, 10, (lv[0] + lv[1]) / 2 - 0.06, (lv[0] + lv[1]) / 2 + 0.06, 1.7, 1.95, 'frame');
    });
    // deep balcony slabs
    [[3.25, 3.75], [6.65, 7.15], [10.05, 10.6]].forEach(function (s, i) {
      B(-10.6, 10.6, s[0], s[1], -6, 6.6, 'white');
      B(-10.6, 10.6, s[0] - 0.02, s[0] + 0.08, 2.0, 6.6, 'ceil');          // warm soffit lights
    });
    // glass railings on the two lower slabs
    [[3.75, 4.85], [7.15, 8.25]].forEach(function (r) {
      B(-10.4, 10.4, r[0], r[1], 6.35, 6.45, 'rail');
      B(-10.5, 10.5, r[1] - 0.05, r[1] + 0.05, 6.3, 6.5, 'frame');
    });
    // big round columns, front row + a slimmer rear row
    [-6.2, -0.4, 5.6].forEach(function (x) { C(x, 5.6, 0.72, 0, 10.6, 'white'); });
    [-6.2, -0.4, 5.6].forEach(function (x) { C(x, -1.2, 0.5, 0, 10.6, 'white'); });
    // upper level — pergola terrace (centre-left) with red louvres and a deep timber roof
    for (var lx = -8.2; lx <= 2.6; lx += 0.62) B(lx, lx + 0.28, 13.2, 13.4, -3.5, 6.2, 'red');
    B(-9.4, 3.8, 13.9, 14.5, -6, 7.2, 'timber');
    B(-9.5, 3.9, 14.45, 14.75, -6.1, 7.3, 'white');
    C(-7.8, 5.9, 0.34, 10.6, 13.9, 'white'); C(2.6, 5.9, 0.34, 10.6, 13.9, 'white');
    B(-8.6, 3.2, 10.6, 11.7, 6.35, 6.45, 'rail');
    B(-8.7, 3.3, 11.65, 11.75, 6.3, 6.5, 'frame');
    B(-9, 3.4, 10.6, 13.9, -6, -5.7, 'white');                             // back wall of the terrace
    // upper right: timber box with a glass-fronted lounge + red fins
    B(3.6, 11.4, 10.6, 13.9, -5.4, 4.6, 'timber');
    B(4.2, 10.8, 11.4, 13.1, 4.6, 4.75, 'rail');
    B(4.2, 10.8, 10.6, 11.5, 4.5, 4.7, 'rail');
    B(4.1, 10.9, 11.45, 11.55, 4.45, 4.8, 'frame');
    B(3.2, 11.9, 13.9, 14.45, -5.8, 5.4, 'white');
    for (var fx = 10.35; fx <= 11.3; fx += 0.34) B(fx, fx + 0.16, 10.6, 13.9, 4.6, 4.95, 'red');
    // left: stepped timber boxes with red fins
    B(-14.2, -9.6, 7.15, 10.2, -4.2, 3.9, 'timber');
    B(-14.5, -9.3, 10.2, 10.5, -4.4, 4.1, 'white');
    for (var ax = -13.2; ax <= -11.0; ax += 0.38) B(ax, ax + 0.18, 7.15, 10.2, 3.9, 4.3, 'red');
    B(-17.4, -13.6, 3.75, 6.7, -3.4, 3.4, 'timber');
    B(-17.7, -13.4, 6.7, 7.0, -3.6, 3.6, 'white');
    for (var bx = -16.6; bx <= -14.4; bx += 0.38) B(bx, bx + 0.18, 3.75, 6.7, 3.4, 3.8, 'red');
    B(-17.4, -13.6, F0, 3.25, -3.4, 3.4, 'white');
    // right: full-height glass block with grid frame
    B(7.4, 12.6, 3.75, 10.6, -4.5, 4.4, 'glass');
    for (var gx = 7.4; gx <= 12.61; gx += 1.3) B(gx - 0.06, gx + 0.06, 3.75, 10.6, 4.3, 4.55, 'frame');
    for (var gy = 3.75; gy <= 10.61; gy += 1.14) B(7.4, 12.6, gy - 0.06, gy + 0.06, 4.3, 4.55, 'frame');
    B(12.6, 13.0, 3.25, 10.6, -4.5, 4.55, 'white');
    B(7.2, 7.4, 3.25, 10.6, -4.5, 4.55, 'white');
    B(7.4, 12.6, F0, 3.25, -4.5, 4.4, 'white');
    // open staircase: leaves the first-floor balcony at the right and comes down towards the front
    var steps = 12, rise = (3.75 - F0) / steps, run = 0.52;
    for (var si = 0; si < steps; si++) {
      var zt = 6.6 + si * run;
      B(8.2, 10.6, F0, 3.75 - rise * si - 0.02, zt, zt + run, 'white');
    }
    B(8.2, 10.6, 3.25, 3.75, 6.6, 7.4, 'white');                         // landing at the top
    // railings follow the slope of the stairs: a glass panel above every step plus a sloped handrail
    for (var ri = 0; ri < steps; ri++) {
      var top = 3.75 - rise * ri, z0 = 6.6 + ri * run;
      B(8.15, 8.27, top, top + 0.95, z0, z0 + run, 'rail');
      B(10.53, 10.65, top, top + 0.95, z0, z0 + run, 'rail');
    }
    var drop = 3.75 - F0 - rise, len = Math.sqrt(Math.pow(steps * run, 2) + drop * drop), ang = Math.atan2(drop, steps * run);
    [8.13, 10.51].forEach(function (hx) {
      var hr = new T.Mesh(new T.BoxGeometry(0.16, 0.08, len), mats.frame);
      hr.position.set(hx + 0.08, (3.75 + 0.95 + (F0 + rise + 0.95)) / 2, 6.6 + steps * run / 2);
      hr.rotation.x = ang; hr.castShadow = true;
      group.add(hr); meshes.push(hr);
    });
    B(8.1, 8.3, 3.75, 4.75, 6.5, 6.7, 'frame');
    B(10.5, 10.7, 3.75, 4.75, 6.5, 6.7, 'frame');
    // low planter wall and bushes in front
    B(-19, 9, 0, 0.9, 11.2, 12, 'stone');
    [[-16, 10.2, 1.4], [-11.5, 10.4, 1.15], [-6.5, 10.2, 1.3], [-2, 10.4, 1.1], [14, 9.8, 1.4], [16.5, 9, 1.1]].forEach(function (b) { S(b[0], b[2] * .7, b[1], b[2], 'green'); });
    // ground: only the shadows show, plus a faint grid
    var ground = new T.Mesh(new T.PlaneGeometry(240, 240), new T.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    var grid = new T.GridHelper(220, 44, 0x000000, 0x000000);
    grid.material.transparent = true; grid.material.opacity = 0.07; grid.position.y = 0.01; scene.add(grid);

    /* ---------- the line drawing: every edge of the model, ordered left to right ---------- */
    var segs = [];
    group.updateMatrixWorld(true);
    meshes.forEach(function (m) {
      if (m.geometry.type === 'SphereGeometry') return;
      var e = new T.EdgesGeometry(m.geometry, 28), p = e.attributes.position, v = new T.Vector3(), w = new T.Vector3();
      for (var i = 0; i < p.count; i += 2) {
        v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
        w.fromBufferAttribute(p, i + 1).applyMatrix4(m.matrixWorld);
        segs.push({ a: v.clone(), b: w.clone(), k: (v.x + w.x) / 2 + (v.y + w.y) * 0.15 });
      }
      e.dispose();
    });
    segs.sort(function (p, q) { return p.k - q.k; });
    var pos = new Float32Array(segs.length * 6);
    segs.forEach(function (s, i) { pos.set([s.a.x, s.a.y, s.a.z, s.b.x, s.b.y, s.b.z], i * 6); });
    var lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var lineMat = new T.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 1 });
    var lines = new T.LineSegments(lg, lineMat);
    scene.add(lines);
    var totalVerts = segs.length * 2;

    // keep faces behind lines so hidden lines disappear
    Object.keys(mats).forEach(function (k) { mats[k].polygonOffset = true; mats[k].polygonOffsetFactor = 1; mats[k].polygonOffsetUnits = 1; });

    /* ---------- camera ---------- */
    var target = new T.Vector3(-1, 5.6, 3), W = 1, H = 1;
    function placeCamera(az) {
      var asp = W / H, a = az * Math.PI / 180;
      // landscape: fixed distance. portrait: pull in until the building fills the screen width
      var dist = asp >= 1.6 ? 72 : (asp < 1 ? 88 / asp : 72 * (1.6 / asp) * 0.92);
      camera.position.set(target.x + Math.sin(a) * dist, 25 + (dist - 72) * 0.28, target.z + Math.cos(a) * dist);
      camera.lookAt(target);
    }
    function resize() {
      var r = canvas.parentNode.getBoundingClientRect();
      W = Math.max(2, r.width); H = Math.max(2, r.height);
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
    }
    resize();

    /* ---------- update from scroll progress ---------- */
    var tmp = new T.Color(), cWhite = new T.Color(0xfafafa), cA = new T.Color(), cB = new T.Color();
    function update(sp) {
      var q = clamp(sp / .28, 0, 1);
      var t1 = sstep(.3, .46, sp), t2 = .55 * sstep(.46, .7, sp), nm = 0;
      Object.keys(defs).forEach(function (k) {
        var d = defs[k], m = mats[k];
        cA.set(d.clay); cB.set(d.color);
        tmp.copy(cWhite).lerp(cA, t1).lerp(cB, t2);
        m.color.copy(tmp);
        if (d.em) { m.emissive.set(d.em); m.emissiveIntensity = t2 * (0.12 + 0.62 * nm); }
      });
      mats.rail.transparent = true; mats.rail.opacity = 1 - .6 * t1; mats.rail.depthWrite = t1 < .2;
      mats.glass.emissive.set(0xffa04a); mats.glass.emissiveIntensity = nm * 0.4;
      var ai = (1 - .5 * t1 - .05 * t2);
      amb.intensity = lerp(ai, .2, nm);
      sun.intensity = lerp(.9 * t1 + .1 * t2, 0, nm);
      hemi.intensity = lerp(.25 * t2, .06, nm);
      moon.intensity = .55 * nm;
      lineMat.opacity = 1 - .72 * t1 - .28 * t2;
      lines.visible = lineMat.opacity > .01;
      lg.setDrawRange(0, Math.ceil(q * totalVerts / 2) * 2);
      grid.material.opacity = lerp(.07, .05, nm);
      ground.material.opacity = lerp(.2 * t1, .35, nm * t1);
      placeCamera(30 - sp * 20);
      renderer.render(scene, camera);
    }
    placeCamera(30);
    // the model never moves, so the shadow map only needs to be drawn once
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    return { update: update, resize: resize, renderer: renderer };
  };
})();
