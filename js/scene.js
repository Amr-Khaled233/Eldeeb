/* =========================================================
   CityScene: محاكاة واقعية لبناء مبنى مع السكرول (SVG + GSAP)
   المراحل:
   1) حفر الأساسات بالحفار   2) حديد التسليح وصب الخرسانة
   3) الأعمدة واحدًا واحدًا   4) الطوابق مع السقالات
   5) الواجهة الزجاجية لوحًا لوحًا   6) فك السقالات والكرين + لاندسكيب + إضاءة ليلية
   الإحداثيات: الأرض y = 900، والمبنى في منتصف x = 0، والضوء من اليسار
   ========================================================= */
(function (global) {
  'use strict';

  var G = 900;
  var L = -150, R = 150;
  var D = 46, DY = 20;                    // عمق جانب المبنى (يمين)
  var LOBBY = 844, FH = 44, FLOORS = 8;
  var ROOF = LOBBY - FLOORS * FH;         // 492
  var COLS = [-150, -90, -30, 30, 90, 150];
  var COLH = G - ROOF;
  var MAST = -330, JIB_Y = 294, YARD = 292, TOP_Y = 330;

  // بدايات المراحل على مقياس 0..100 (تُستخدم للعناوين)
  var PHASES = [
    { key: 'intro', at: 0 }, { key: 'about', at: 31 }, { key: 'services', at: 43 },
    { key: 'projects', at: 69 }, { key: 'final', at: 85 }
  ];
  var FLOOR_START = 44, FLOOR_STEP = 3;

  function ceil(k) { return LOBBY - k * FH; }
  function frac(y) { return (G - y) / COLH; }
  function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  function r(x, y, w, h, cls, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '/>';
  }
  function p(d, cls, extra) {
    return '<path d="' + d + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '/>';
  }
  function g(id, inner, cls, extra) {
    return '<g' + (id ? ' id="' + id + '"' : '') + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '>' + inner + '</g>';
  }
  function grad(id, x2, y2, stops) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" ' + s[1] + '/>'; }).join('') + '</linearGradient>';
  }
  function side(x, y, h, cls, extra) {   // وجه جانبي متوازي أضلاع
    return p('M' + x + ' ' + y + 'l' + D + ' ' + (-DY) + 'v' + (-h) + 'l' + (-D) + ' ' + DY + 'z', cls, extra);
  }

  /* ---------------- التعريفات ---------------- */
  function defs() {
    return '<defs>' +
      '<pattern id="pWinB" width="12" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="6" height="8" class="sc-win-b"/></pattern>' +
      '<pattern id="pLitB" width="36" height="48" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="6" height="8" class="sc-litwin"/><rect x="27" y="20" width="6" height="8" class="sc-litwin"/><rect x="15" y="36" width="6" height="8" class="sc-litwin"/></pattern>' +
      '<pattern id="pHaz" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#C89D2A"/></pattern>' +
      '<pattern id="pTies" width="10" height="11" patternUnits="userSpaceOnUse"><path d="M0 1h10" class="sc-rebar-thin"/></pattern>' +
      '<pattern id="pMesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0l6 6M6 0L0 6" class="sc-mesh"/></pattern>' +
      '<pattern id="pPave" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 12h24M12 0v12" class="sc-pave-line"/></pattern>' +
      grad('gGlass', 0.35, 1, [[0, 'stop-color="#d9eaf6"'], [0.28, 'stop-color="#8fb0c9"'], [0.62, 'stop-color="#3d5d7a"'], [1, 'stop-color="#1d3349"']]) +
      grad('gGlassSide', 1, 1, [[0, 'stop-color="#5b7c97"'], [1, 'stop-color="#15263a"']]) +
      grad('gReflect', 1, 0, [[0, 'stop-color="#fff" stop-opacity="0"'], [0.3, 'stop-color="#fff" stop-opacity=".22"'], [0.42, 'stop-color="#fff" stop-opacity="0"'], [0.62, 'stop-color="#fff" stop-opacity=".14"'], [0.7, 'stop-color="#fff" stop-opacity="0"']]) +
      grad('gConcrete', 1, 0, [[0, 'stop-color="#b9bec3"'], [1, 'stop-color="#8b9197"']]) +
      grad('gConcreteV', 0, 1, [[0, 'stop-color="#a9aeb3"'], [1, 'stop-color="#6f757b"']]) +
      grad('gWall', 0, 1, [[0, 'stop-color="#7d858d"'], [1, 'stop-color="#5a6168"']]) +
      grad('gGold', 0, 1, [[0, 'stop-color="#f3d98a"'], [0.5, 'stop-color="#C89D2A"'], [1, 'stop-color="#8a6810"']]) +
      grad('gGoldH', 1, 0, [[0, 'stop-color="#8a6810"'], [0.5, 'stop-color="#f3d98a"'], [1, 'stop-color="#8a6810"']]) +
      grad('gYellow', 0, 1, [[0, 'stop-color="#ffcf3f"'], [1, 'stop-color="#e0a100"']]) +
      grad('gLobby', 0, 1, [[0, 'stop-color="#fff4d2"'], [1, 'stop-color="#e5b552"']]) +
      grad('gShadow', 1, 0, [[0, 'stop-color="#000" stop-opacity=".42"'], [1, 'stop-color="#000" stop-opacity="0"']]) +
      grad('gHaze', 0, 1, [[0, 'class="sc-haze-0"'], [1, 'class="sc-haze-1"']]) +
      grad('gStream', 0, 1, [[0, 'stop-color="#9aa0a6"'], [1, 'stop-color="#6c7277"']]) +
      '<radialGradient id="gSun"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="#ffd87a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gMoon"><stop offset="0" stop-color="#f4f1e6"/><stop offset=".6" stop-color="#e7e2cf" stop-opacity=".9"/><stop offset="1" stop-color="#e7e2cf" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gDust"><stop offset="0" stop-color="#c9b89f" stop-opacity=".85"/><stop offset="1" stop-color="#a8977e" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gUp" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      // عامل بناء (حوالي 20 وحدة = 1.75م تقريبًا مقابل طابق 44 وحدة)
      '<g id="gWorker">' + p('M-2.5 -8l-1.5 8M2.5 -8l1.5 8', 'sc-legs') + r(-3.5, -16, 7, 9, 'sc-vest', ' rx="1.5"') +
      p('M-3.5 -14l-3 5M3.5 -14l3 4', 'sc-arms') + '<circle cx="0" cy="-19" r="2.6" class="sc-skin"/>' + p('M-3.6 -19.5a3.6 3.6 0 0 1 7.2 0z', 'sc-hat') + '</g>' +
      '<g id="gPerson">' + p('M-2.2 -8l-1.3 8M2.2 -8l1.3 8', 'sc-legs') + r(-3, -16, 6, 9, 'sc-shirt', ' rx="2"') +
      '<circle cx="0" cy="-19" r="2.6" class="sc-skin"/>' + p('M-2.8 -20.5a2.8 2.4 0 0 1 5.6 0z', 'sc-hair') + '</g>' +
      '<clipPath id="cFacade"><rect x="' + L + '" y="' + ROOF + '" width="' + (R - L) + '" height="' + (LOBBY - ROOF) + '"/>' +
      '<path d="M' + R + ' ' + LOBBY + 'l' + D + ' -' + DY + 'V' + (ROOF - DY) + 'l-' + D + ' ' + DY + 'z"/></clipPath>' +
      '</defs>';
  }

  /* ---------------- السماء (أبطأ طبقة) ---------------- */
  function sky(lite) {
    var rand = rng(5), stars = '';
    for (var i = 0; i < (lite ? 50 : 110); i++) {
      stars += '<circle cx="' + Math.round(rand() * 4000 - 2000) + '" cy="' + Math.round(rand() * 1600 - 900) + '" r="' + (rand() * 1.3 + 0.4).toFixed(1) + '"' +
        (i % 4 === 0 ? ' class="twinkle" style="animation-delay:' + (rand() * 3).toFixed(1) + 's"' : '') + '/>';
    }
    var clouds = [[-700, 150, 1.8], [-150, 70, 1.2], [380, 130, 1.6], [900, 60, 1.1], [-1300, 90, 1.4], [1400, 170, 1.5], [0, -180, 1.4]].map(function (c) {
      return '<path transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')" d="M0 40a26 26 0 0 1 48-12 20 20 0 0 1 34 16h-82z"/>';
    }).join('');
    return r(-5000, -5000, 10000, 10000, 'sc-dusk', ' id="dusk"') +
      g('stars', stars, 'sc-stars') +
      '<circle id="sun" cx="-560" cy="170" r="80" fill="url(#gSun)"/>' +
      '<circle id="moon" cx="520" cy="140" r="38" fill="url(#gMoon)"/>' +
      g('clouds', clouds, 'sc-clouds');
  }

  /* ---------------- المدينة البعيدة ---------------- */
  var BACK = [[-1500, 110, 330], [-1300, 90, 260], [-1120, 120, 380], [-940, 90, 300], [-780, 110, 420], [-600, 80, 260],
    [-430, 100, 200], [430, 110, 240], [600, 90, 360], [780, 120, 280], [960, 90, 440], [1140, 110, 300], [1330, 100, 380], [1520, 120, 280]];
  function skyline() {
    return BACK.map(function (b) {
      var l = b[0] - b[1] / 2, top = G - b[2];
      return r(l, top, b[1], b[2], 'sc-tw-back') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, '', ' fill="url(#pWinB)"') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, 'sc-city-lit', ' fill="url(#pLitB)"') +
        r(l - 3, top - 4, b[1] + 6, 5, 'sc-tw-back');
    }).join('') + r(-5000, 420, 10000, G - 420, '', ' fill="url(#gHaze)"');
  }

  /* ---------------- الأرض والحفرة والأساسات ---------------- */
  function ground() {
    var dashes = '';
    for (var x = -5000; x < 5000; x += 60) dashes += 'M' + x + ' 976h30';
    return r(-5000, G, 10000, 3000, 'sc-soil') +
      r(-5000, 936, 10000, 12, 'sc-walk') +
      r(-5000, 948, 10000, 56, 'sc-road') +
      p(dashes, 'sc-lane') +
      r(-5000, 1004, 10000, 6, 'sc-walk') +
      g('plaza', r(-360, G, 720, 36, 'sc-plaza') + r(-360, G, 720, 36, '', ' fill="url(#pPave)"') +
        p('M-360 918H360M-70 900v36M70 900v36', 'sc-gold-line'));
  }

  function foundation() {
    var rebarV = '', rebarH = '', starters = '';
    for (var x = -166; x <= 166; x += 14) rebarV += 'M' + x + ' 906V932';
    for (var y = 908; y <= 930; y += 7) rebarH += 'M-168 ' + y + 'H168';
    COLS.forEach(function (c) { starters += 'M' + (c - 3) + ' 900v-18M' + (c + 3) + ' 900v-18'; });
    return g('site', r(-560, G, 1000, 36, 'sc-dirt') + p('M-560 ' + (G + 1) + 'H440', 'sc-dirt-edge')) +
      g('pit', p('M-182 900L-172 936H172L182 900Z', 'sc-pit')) +
      g('pile', p('M-420 900q30-40 60-44q40-6 70 44z', 'sc-pile') + p('M-400 900q25-26 50-28q26 2 40 28z', 'sc-pile-2')) +
      g('rebarV', p(rebarV, 'sc-rebar')) + g('rebarH', p(rebarH, 'sc-rebar')) +
      g('concrete', r(-172, 903, 344, 33, '', ' fill="url(#gConcreteV)"') + p('M-172 903H172', 'sc-concrete-top')) +
      g('podium', side(R + 20, G, 10, 'sc-slab-side') + r(L - 20, 890, R - L + 40, 10, 'sc-podium') + r(L - 20, 897, R - L + 40, 3, '', ' fill="url(#pHaz)"')) +
      g('starters', p(starters, 'sc-rebar'));
  }

  /* ---------------- المبنى ---------------- */
  function building(lite) {
    var rand = rng(21);
    var html = '';
    // الظل (يطول مع ارتفاع المبنى)
    html += r(R + D - 10, G, 240, 36, '', ' id="shadow" fill="url(#gShadow)"');
    // الجانب والعمود الخلفي
    html += g('sideWall', side(R, G, COLH, '', ' fill="url(#gWall)"') + r(R + D - 5, ROOF - DY, 8, COLH, 'sc-col-back'));
    var sideLines = '';
    for (var k = 1; k <= FLOORS; k++) sideLines += 'M' + R + ' ' + (ceil(k) + 8) + 'l' + D + ' -' + DY;
    html += g('sideGlass', side(R, LOBBY, LOBBY - ROOF, '', ' fill="url(#gGlassSide)"') + p(sideLines, 'sc-side-lines'));
    // حديد الأعمدة
    html += g('cages', COLS.map(function (c, i) {
      return r(c - 5, ROOF - 10, 10, COLH + 10, 'sc-cage', ' fill="url(#pTies)" data-i="' + i + '"');
    }).join(''));
    // الأعمدة
    html += g('columns', COLS.map(function (c, i) {
      return r(c - 6, ROOF, 12, COLH, 'sc-col', ' fill="url(#gConcrete)" data-i="' + i + '"');
    }).join(''));
    // اللوبي
    var lobbyGlass = '';
    for (var j = 0; j < COLS.length - 1; j++) lobbyGlass += r(COLS[j] + 6, LOBBY + 8, 48, G - LOBBY - 18, '', ' fill="url(#gLobby)"');
    html += g('lobby', lobbyGlass + r(-24, 862, 48, 28, 'sc-door') + p('M0 862v28', 'sc-mullion'));
    // الواجهة الزجاجية
    var panes = '', lights = '', spand = '';
    for (var f = 1; f <= FLOORS; f++) {
      var top = ceil(f) + 8, h = FH - 8;
      spand += 'M' + L + ' ' + (ceil(f) + 8) + 'H' + R;
      for (var b = 0; b < COLS.length - 1; b++) {
        var x = COLS[b] + 6;
        panes += g('', r(x, top, 48, h, 'sc-glass', ' fill="url(#gGlass)"') +
          p('M' + (x + 24) + ' ' + top + 'v' + h, 'sc-mullion') +
          p('M' + (x + 4) + ' ' + (top + h - 4) + 'L' + (x + 16) + ' ' + (top + 3), 'sc-glint'), 'pane', ' data-f="' + f + '"');
        if (rand() < 0.55) lights += r(x + 1, top + 1, 46, h - 2, 'sc-winlight');
      }
    }
    html += g('panes', panes);
    html += '<g clip-path="url(#cFacade)">' + r(-420, ROOF - 30, 340, LOBBY - ROOF + 60, '', ' id="reflect" fill="url(#gReflect)"') + '</g>';
    html += g('spandrels', p(spand, 'sc-spandrel'));
    html += g('winLights', lights);
    // الأسقف
    var slabs = '';
    for (var s = 0; s <= FLOORS; s++) {
      var sy = s === 0 ? LOBBY : ceil(s);
      slabs += g('', side(R + 6, sy + 8, 8, 'sc-slab-side') +
        p('M' + (L - 6) + ' ' + sy + 'H' + (R + 6) + 'l' + D + ' -' + DY + 'H' + (L - 6 + D) + 'z', 'sc-slab-top') +
        r(L - 6, sy, R - L + 12, 8, 'sc-slab'), 'slab', ' data-k="' + s + '"');
    }
    html += g('slabs', slabs);
    // السطح
    html += g('roof',
      g('', side(R + 6, ROOF, 12, 'sc-slab-side') + r(L - 6, ROOF - 12, R - L + 12, 12, 'sc-parapet'), 'roof-part') +
      g('', side(78, ROOF - 12, 40, 'sc-side-dark') + r(-78, ROOF - 52, 156, 40, 'sc-penthouse') +
        '<text class="sc-sign roof-sign" x="0" y="' + (ROOF - 26) + '" text-anchor="middle"></text>', 'roof-part') +
      g('', r(-84, ROOF - 58, 168, 6, '', ' fill="url(#gGoldH)"'), 'roof-part crown-glow') +
      g('', p('M0 ' + (ROOF - 58) + 'V' + (ROOF - 118), 'sc-antenna') + '<circle class="sc-beacon" cx="0" cy="' + (ROOF - 121) + '" r="3.5"/>', 'roof-part'));
    // إضاءة الواجهة ليلًا
    html += g('uplights', '<ellipse cx="-100" cy="836" rx="26" ry="70" fill="url(#gUp)" opacity=".7"/><ellipse cx="100" cy="836" rx="26" ry="70" fill="url(#gUp)" opacity=".7"/>');
    html += g('canopy', r(-64, LOBBY + 2, 128, 5, '', ' fill="url(#gGoldH)"') + p('M-56 ' + (LOBBY + 7) + 'v14M56 ' + (LOBBY + 7) + 'v14', 'sc-gold-line'));
    return html;
  }

  /* ---------------- السقالات ---------------- */
  function scaffolds() {
    var out = '';
    for (var k = 0; k <= FLOORS; k++) {
      var y1 = k === 0 ? LOBBY : ceil(k), y2 = k === 0 ? G : ceil(k - 1);
      var xs = [L - 16, -90, -30, 30, 90, R + 16];
      var poles = xs.map(function (x) { return 'M' + x + ' ' + y1 + 'V' + y2; }).join('');
      var ledgers = 'M' + (L - 16) + ' ' + (y1 + 2) + 'H' + (R + 16) + 'M' + (L - 16) + ' ' + (y1 + (y2 - y1) * 0.55) + 'H' + (R + 16);
      var braces = 'M' + (L - 16) + ' ' + y2 + 'L-90 ' + y1 + 'M' + (R + 16) + ' ' + y2 + 'L90 ' + y1;
      out += g('', r(L - 16, y1, R - L + 32, y2 - y1, '', ' fill="url(#pMesh)" opacity=".5"') +
        p(poles, 'sc-scaf') + p(ledgers, 'sc-scaf') + p(braces, 'sc-scaf-thin') +
        r(L - 20, y1 - 2, R - L + 40, 3, 'sc-plank') +
        p('M' + (R + 16) + ' ' + y1 + 'l14 -6V' + (y2 - 6) + 'l-14 6', 'sc-scaf-thin'), 'scaf', ' data-k="' + k + '"');
    }
    return g('scaffold', out);
  }

  /* ---------------- مخزن المواد ---------------- */
  function yard() {
    var blocks = '';
    for (var i = 0; i < 4; i++) for (var j = 0; j < 3 - (i % 2); j++) blocks += r(250 + j * 16 + i * 2, 888 - i * 7, 14, 6, 'sc-block');
    return g('yard', blocks +
      p('M300 896h46M300 892h46M302 888h42', 'sc-rebar-bold') +
      r(356, 866, 30, 34, 'sc-crate') + p('M356 866l30 34M386 866l-30 34', 'sc-crate-line') +
      r(392, 874, 24, 26, 'sc-crate') + p('M404 874v26', 'sc-crate-line'));
  }

  /* ---------------- الحفار ---------------- */
  function excavator() {
    return g('excavator',
      r(-66, 886, 92, 14, 'sc-track', ' rx="7"') +
      '<circle cx="-58" cy="893" r="5" class="sc-wheel-2"/><circle cx="-20" cy="893" r="5" class="sc-wheel-2"/><circle cx="18" cy="893" r="5" class="sc-wheel-2"/>' +
      r(-58, 862, 70, 24, '', ' fill="url(#gYellow)" rx="3"') + r(-66, 866, 12, 18, 'sc-counterweight', ' rx="2"') +
      r(-14, 838, 26, 26, '', ' fill="url(#gYellow)" rx="3"') + r(-9, 842, 16, 14, 'sc-cab-glass', ' rx="2"') +
      g('exBoom', p('M8 862L60 812L72 820L20 868Z', '', ' fill="url(#gYellow)"') +
        p('M24 856L58 822', 'sc-hydraulic') +
        g('exStick', p('M62 812L96 862L88 868L56 822Z', '', ' fill="url(#gYellow)"') +
          g('exBucket', p('M90 860l14 4-2 14-16 2-6-12z', 'sc-bucket') + p('M86 878l-2 5M92 879l-1 5M98 879l0 5', 'sc-teeth')))),
      '', ' transform="translate(-260 0)"');
  }

  /* ---------------- عربية الخرسانة ---------------- */
  function mixer() {
    return g('truck',
      '<g transform="translate(0 999)">' +
      r(-80, -16, 124, 8, 'sc-chassis') +
      '<ellipse class="sc-drum" cx="-22" cy="-34" rx="46" ry="22"/>' + p('M-58 -44q36 20 72 0M-60 -30q36 20 76 0', 'sc-drum-stripe') +
      p('M42 -8V-40h18l16 16v16z', 'sc-cab-truck') + p('M48 -36h10l10 10H48z', 'sc-car-win') +
      '<circle class="sc-wheel" cx="-58" cy="0" r="7"/><circle class="sc-wheel" cx="-36" cy="0" r="7"/><circle class="sc-wheel" cx="58" cy="0" r="7"/>' +
      '</g>', '', ' transform="translate(-1800 0)"') +
      g('chute', p('M234 964L150 912L140 918', 'sc-chute') + p('M140 918Q128 926 124 936', 'sc-stream'));
  }

  /* ---------------- الكرين ---------------- */
  function crane() {
    var mast = 'M' + (MAST - 8) + ' 900V' + (JIB_Y + 6) + 'M' + (MAST + 8) + ' 900V' + (JIB_Y + 6);
    for (var y = 900; y > JIB_Y + 30; y -= 24) mast += 'M' + (MAST - 8) + ' ' + y + 'L' + (MAST + 8) + ' ' + (y - 24) + 'M' + (MAST + 8) + ' ' + y + 'L' + (MAST - 8) + ' ' + (y - 24) + 'M' + (MAST - 8) + ' ' + y + 'H' + (MAST + 8);
    var jib = 'M' + MAST + ' ' + (JIB_Y - 12) + 'H420M' + MAST + ' ' + JIB_Y + 'H420M420 ' + (JIB_Y - 12) + 'V' + JIB_Y;
    for (var x = MAST; x < 410; x += 14) jib += 'M' + x + ' ' + JIB_Y + 'L' + (x + 7) + ' ' + (JIB_Y - 12) + 'L' + (x + 14) + ' ' + JIB_Y;
    var loads =
      g('loadRebar', p('M-2 12-24 26M2 12 24 26', 'sc-cable') + p('M-30 27h60M-30 30h60M-28 33h56', 'sc-rebar-bold'), 'load') +
      g('loadForm', p('M-2 12-18 24M2 12 18 24', 'sc-cable') + r(-20, 24, 40, 40, 'sc-formwork'), 'load') +
      g('loadBucket', p('M-2 12-12 22M2 12 12 22', 'sc-cable') + p('M-14 22h28l-6 26h-16z', 'sc-concrete-bucket'), 'load') +
      g('loadGlass', p('M-2 12-26 24M2 12 26 24', 'sc-cable') + r(-30, 24, 60, 32, '', ' fill="url(#gGlass)" stroke="#1d3349"'), 'load');
    return g('crane',
      r(MAST - 24, 886, 48, 14, 'sc-crane-base') +
      g('mast', p(mast, 'sc-crane-steel')) +
      g('craneTop', g('',
        p(jib, 'sc-crane-steel') +
        r(MAST - 90, JIB_Y - 12, 90, 12, 'sc-crane-body') + r(MAST - 88, JIB_Y, 26, 22, 'sc-crane-weight') +
        p('M' + (MAST - 6) + ' ' + (JIB_Y - 12) + 'L' + MAST + ' ' + (JIB_Y - 52) + 'L' + (MAST + 6) + ' ' + (JIB_Y - 12) +
          'M' + MAST + ' ' + (JIB_Y - 52) + 'L415 ' + (JIB_Y - 12) + 'M' + MAST + ' ' + (JIB_Y - 52) + 'L' + (MAST - 88) + ' ' + (JIB_Y - 12), 'sc-cable') +
        r(MAST + 10, JIB_Y + 2, 26, 20, 'sc-crane-cab', ' rx="3"') +
        '<line id="cable" class="sc-cable" x1="' + YARD + '" y1="' + (JIB_Y + 6) + '" x2="' + YARD + '" y2="' + TOP_Y + '"/>' +
        r(YARD - 9, JIB_Y, 18, 7, 'sc-crane-body', ' id="trolley"') +
        g('hook', g('', p('M0 0v8a4.5 4.5 0 1 1-4.5 4.5', 'sc-hook') + loads, 'sc-swing'), '', ' transform="translate(' + YARD + ' ' + TOP_Y + ')"'),
        'sc-sway')));
  }

  /* ---------------- العمال والناس والعربيات ---------------- */
  function people(lite) {
    function w(x, cls, delay, dist) {
      return '<g transform="translate(' + x + ' 0)"><g class="' + cls + '" style="animation-delay:-' + delay + 's;--walk:' + dist + 'px"><use href="#gWorker"/></g></g>';
    }
    var ground = w(-205, 'walker', 0, 18) + w(210, 'walker', 2, -22) + (lite ? '' : w(-330, 'walker', 1, 14));
    var slab = w(-110, 'walker', 0, 50) + w(40, 'walker', 1.5, -40) + (lite ? '' : w(120, 'walker idle', 0, 0));
    var folks = '';
    [[-250, 'p1', 60], [-40, 'p2', -30], [230, 'p3', 40], [320, 'p4', -50], [-320, 'p2', 30]].slice(0, lite ? 3 : 5).forEach(function (f, i) {
      folks += '<g transform="translate(' + f[0] + ' 935)"><g class="walker ' + f[1] + '" style="animation-delay:-' + i + 's;--walk:' + f[2] + 'px"><use href="#gPerson"/></g></g>';
    });
    var parked = [[-300, 'c2'], [260, 'c1']].map(function (c) {
      return '<g transform="translate(' + c[0] + ' 934)">' + r(-24, -11, 48, 10, 'sc-car-body ' + c[1], ' rx="4"') +
        p('M-14 -11l6 -8h16l7 8z', 'sc-car-cab ' + c[1]) + p('M-10 -12l4 -5h12l4 5z', 'sc-car-win') +
        '<circle class="sc-wheel" cx="-13" cy="0" r="3.8"/><circle class="sc-wheel" cx="13" cy="0" r="3.8"/></g>';
    }).join('');
    return g('groundCrew', '<g transform="translate(0 900)">' + ground + '</g>') +
      g('slabCrew', slab, '', ' transform="translate(0 ' + LOBBY + ')"') +
      g('folks', folks) + g('parked', parked);
  }

  function street(lite) {
    var lamps = [-560, -440, 440, 560, -900, 900].map(function (x) {
      return '<g class="sc-lamp"><ellipse class="sc-lamp-pool" cx="' + (x + 14) + '" cy="976" rx="46" ry="10"/>' +
        '<circle class="sc-lamp-glow" cx="' + (x + 14) + '" cy="874" r="30" fill="url(#gGlow)"/>' +
        p('M' + x + ' 942V872q0-6 6-6h10', 'sc-pole') + r(x + 12, 866, 12, 4, '', ' fill="url(#gGold)"') + '</g>';
    }).join('');
    var trees = [-235, -190, 205, 250].map(function (x) {
      return '<g class="sc-tree">' + p('M' + x + ' 936q-4-34 3-66', 'sc-palm-trunk') +
        p('M' + (x + 3) + ' 870q-20-12-38 4M' + (x + 3) + ' 870q20-14 38 4M' + (x + 3) + ' 870q-10-22-30-22M' + (x + 3) + ' 870q10-22 30-22M' + (x + 3) + ' 870q0-20 4-30', 'sc-palm-leaf') + '</g>';
    }).join('') + [-680, -760, 680, 760, -1040, 1040].map(function (x) {
      return '<g class="sc-tree">' + r(x - 2, 912, 4, 24, 'sc-trunk') +
        '<circle class="sc-leaf" cx="' + x + '" cy="902" r="16"/><circle class="sc-leaf-2" cx="' + (x + 6) + '" cy="896" r="9"/></g>';
    }).join('') + [-120, 120].map(function (x) {
      return '<g class="sc-tree">' + r(x - 16, 926, 32, 10, 'sc-planter') + '<ellipse cx="' + x + '" cy="924" rx="18" ry="7" class="sc-leaf"/></g>';
    }).join('');
    var colors = ['c1', 'c2', 'c3', 'c4', 'c5'];
    function car(i, dur, delay) {
      return '<g><g class="sc-car" style="animation-duration:' + dur + 's;animation-delay:-' + delay + 's">' +
        p('M22 -7l90 -12v24z', 'sc-beam-car') +
        r(-24, -11, 48, 10, 'sc-car-body ' + colors[i % 5], ' rx="4"') +
        p('M-14 -11l6 -8h16l7 8z', 'sc-car-cab ' + colors[i % 5]) + p('M-10 -12l4 -5h12l4 5z', 'sc-car-win') +
        '<circle class="sc-wheel" cx="-13" cy="0" r="3.8"/><circle class="sc-wheel" cx="13" cy="0" r="3.8"/>' +
        '<circle class="sc-headlight" cx="23" cy="-6" r="2.2"/><circle class="sc-taillight" cx="-23" cy="-6" r="2"/></g></g>';
    }
    var n = lite ? 3 : 5, laneA = '', laneB = '';
    for (var i = 0; i < n; i++) {
      laneA += car(i, 16 + (i % 3) * 3, i * 3.6);
      laneB += car(i + 2, 14 + (i % 2) * 4, i * 3.2 + 1.5);
    }
    return g('lamps', lamps) + g('trees', trees) +
      g('cars', '<g transform="translate(0 968)">' + laneA + '</g><g transform="translate(0 994) scale(-1 1)">' + laneB + '</g>');
  }

  function dust(lite) {
    var rand = rng(9), out = '';
    for (var i = 0; i < (lite ? 7 : 16); i++) {
      out += '<g transform="translate(' + Math.round(rand() * 360 - 180) + ' ' + Math.round(900 - rand() * 20) + ')">' +
        '<circle class="sc-particle" r="' + Math.round(10 + rand() * 22) + '" fill="url(#gDust)" style="animation-delay:-' + (rand() * 4).toFixed(1) + 's;animation-duration:' + (3 + rand() * 3).toFixed(1) + 's"/></g>';
    }
    return g('dust', out);
  }

  /* ---------------- المقدمة (أسرع طبقة) ---------------- */
  function fore() {
    var fence = '';
    [[-560, -350], [200, 440]].forEach(function (seg) {
      for (var x = seg[0]; x < seg[1]; x += 30) fence += r(x, 872, 28, 28, 'sc-fence') + r(x, 886, 28, 3, '', ' fill="url(#gGold)"');
    });
    fence += '<text class="sc-sign fence-sign" x="-455" y="883" text-anchor="middle"></text>';
    var board = p('M-620 900V818M-500 900V818', 'sc-pole') +
      r(-640, 772, 160, 52, 'sc-board') + r(-640, 772, 160, 4, '', ' fill="url(#gGold)"') +
      '<text class="sc-sign board-sign" x="-560" y="802" text-anchor="middle"></text>' +
      '<text class="sc-board-sub" x="-560" y="816" text-anchor="middle">CONSTRUCTION &amp; ENGINEERING</text>';
    return g('fence', fence) + g('board', board);
  }

  /* ---------------- التركيب ---------------- */
  function build(svg, opts) {
    opts = opts || {};
    var lite = !!opts.lite;
    svg.innerHTML = defs() + sky(lite) +
      g('world',
        g('layerBack', skyline()) +
        g('layerMid',
          ground() + foundation() + yard() + building(lite) + scaffolds() + mixer() + excavator() +
          people(lite) + street(lite) + dust(lite) + crane()) +
        g('layerFore', fore()));
    Array.prototype.forEach.call(svg.querySelectorAll('.sc-sign'), function (el) { el.textContent = opts.sign || ''; });
    fit(svg);
  }

  /** viewBox يملأ الشاشة ويُبقي المبنى والكرين في الكادر */
  function fit(svg) {
    var vw = svg.clientWidth || window.innerWidth;
    var vh = svg.clientHeight || window.innerHeight;
    var ar = vw / vh, w, h, y0;
    if (ar >= 0.95) {
      h = 1010; w = Math.max(h * ar, 1000);
      h = w / ar;
      y0 = 1010 - h;
    } else {
      w = 720; h = w / ar;
      y0 = 570 - h / 2;
    }
    svg.setAttribute('viewBox', [-w / 2 + 20, y0, w, h].map(function (n) { return Math.round(n * 10) / 10; }).join(' '));
  }

  /* ---------------- الخط الزمني ---------------- */
  function timeline(svg, onProgress) {
    var $ = function (s) { return svg.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(svg.querySelectorAll(s)); };
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: function () { if (onProgress) onProgress(this.progress()); } });
    function hide(targets, vars) {
      vars = vars || { opacity: 0 };
      tl.fromTo(targets, vars, Object.assign({}, vars, { duration: 0.001 }), 0);
    }

    // الكرين
    var trolley = $('#trolley'), cable = $('#cable'), hook = $('#hook');
    var cr = { x: YARD, y: TOP_Y };
    function drawCrane() {
      trolley.setAttribute('x', cr.x - 9);
      cable.setAttribute('x1', cr.x);
      cable.setAttribute('x2', cr.x);
      cable.setAttribute('y2', cr.y);
      hook.setAttribute('transform', 'translate(' + cr.x + ' ' + cr.y + ')');
    }
    function craneTo(x, y, dur, at, ease) {
      tl.to(cr, { x: x, y: y, duration: dur, ease: ease || 'power2.inOut', onUpdate: drawCrane }, at);
    }
    /** رفعة كاملة: من المخزن إلى الهدف مع توقف قصير قبل التحميل والتنزيل */
    function lift(at, dur, destX, destY, load) {
      craneTo(YARD, TOP_Y, dur * 0.16, at);
      craneTo(YARD, 846, dur * 0.12, at + dur * 0.16, 'power1.inOut');
      tl.to(load, { opacity: 1, duration: 0.01 }, at + dur * 0.3);
      craneTo(YARD, TOP_Y, dur * 0.12, at + dur * 0.32, 'power1.inOut');
      craneTo(destX, TOP_Y, dur * 0.18, at + dur * 0.46);
      craneTo(destX, destY, dur * 0.14, at + dur * 0.66, 'power1.inOut');
      tl.to(load, { opacity: 0, duration: 0.01 }, at + dur * 0.84);
      craneTo(destX, TOP_Y, dur * 0.12, at + dur * 0.86, 'power1.inOut');
    }

    // الحفار
    var ex = { boom: 0, stick: 0, bucket: 0 };
    var boom = $('#exBoom'), stick = $('#exStick'), bucket = $('#exBucket');
    function drawEx() {
      boom.setAttribute('transform', 'rotate(' + ex.boom + ' 14 865)');
      stick.setAttribute('transform', 'rotate(' + ex.stick + ' 64 816)');
      bucket.setAttribute('transform', 'rotate(' + ex.bucket + ' 92 864)');
    }

    var cols = $$('#columns .sc-col'), cages = $$('#cages .sc-cage');
    var sideWall = $('#sideWall');
    var slabs = $$('#slabs .slab'), scafs = $$('#scaffold .scaf');
    var panes = $$('#panes .pane'), loads = $$('#hook .load');
    var world = $('#world'), dustEl = $('#dust'), slabCrew = $('#slabCrew'), shadow = $('#shadow');

    // الحالة الابتدائية
    hide([$('#rebarV'), $('#rebarH'), $('#concrete'), $('#starters'), $('#chute'), dustEl, slabCrew,
      $('#sideGlass'), $('#spandrels'), $('#lobby'), $('#reflect'), $('#uplights'), $('#canopy'), $('#plaza'),
      $('#folks'), $('#parked'), $('#moon'), $('#stars')].concat(loads, $$('#winLights rect'), $$('.sc-lamp-glow, .sc-lamp-pool'), $$('.sc-city-lit')));
    hide(cols.concat(cages, [sideWall]), { scaleY: 0, transformOrigin: '50% 100%' });
    hide(slabs, { scaleX: 0, opacity: 0, transformOrigin: '0% 50%' });
    hide(scafs, { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' });
    hide(panes, { opacity: 0, x: 28 });
    hide($$('#roof .roof-part'), { opacity: 0, y: -40 });
    hide($$('#trees .sc-tree'), { scale: 0, transformOrigin: '50% 100%' });
    hide($('#pit'), { scaleY: 0, transformOrigin: '50% 0%' });
    hide($('#pile'), { scaleY: 0, transformOrigin: '50% 100%' });
    hide($('#podium'), { scaleX: 0, transformOrigin: '50% 50%' });
    hide(shadow, { attr: { width: 0 } });
    tl.set(ex, { boom: 0, stick: 0, bucket: 0, onUpdate: drawEx }, 0);

    // الكاميرا والعمق (السماء أبطأ، المقدمة أسرع)
    tl.fromTo(world, { scale: 1.75, svgOrigin: '0 960' }, { scale: 1.3, svgOrigin: '0 960', duration: 30, ease: 'power1.inOut' }, 0)
      .to(world, { scale: 1.08, svgOrigin: '0 960', duration: 26, ease: 'power1.inOut' }, 32)
      .to(world, { scale: 1, svgOrigin: '0 960', duration: 24, ease: 'power1.inOut' }, 60)
      .to(world, { scale: 0.94, svgOrigin: '0 960', duration: 12, ease: 'power1.inOut' }, 86)
      .fromTo($('#layerBack'), { x: -40 }, { x: 40, duration: 100 }, 0)
      .fromTo($('#layerFore'), { x: 90 }, { x: -60, duration: 100 }, 0)
      .fromTo($('#clouds'), { x: 0 }, { x: 180, duration: 100 }, 0);

    // السماء: نهار ثم غروب ثم ليل
    tl.fromTo($('#dusk'), { opacity: 0 }, { opacity: 0.25, duration: 80 }, 0)
      .to($('#dusk'), { opacity: 1, duration: 10, ease: 'power1.in' }, 86)
      .fromTo($('#sun'), { attr: { cy: 170 } }, { attr: { cy: 760 }, duration: 94, ease: 'power1.in' }, 0)
      .to($('#moon'), { opacity: 1, duration: 5 }, 91)
      .to($('#stars'), { opacity: 1, duration: 8 }, 88);

    /* ---------- المرحلة 1: الحفر (0 → 14) ---------- */
    tl.to(ex, { boom: -16, stick: 30, bucket: 45, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 7, onUpdate: drawEx }, 1)
      .to($('#pit'), { scaleY: 1, duration: 10, ease: 'power1.inOut' }, 1.5)
      .to($('#pile'), { scaleY: 1, duration: 10, ease: 'power1.out' }, 2)
      .to(dustEl, { opacity: 1, duration: 1.5 }, 1)
      .to(dustEl, { opacity: 0, duration: 2.5 }, 11.5);

    /* ---------- المرحلة 2: التسليح والصب (16 → 30) ---------- */
    tl.fromTo($('#excavator'), { x: -260, opacity: 1 }, { x: -760, opacity: 0, duration: 4, ease: 'power2.in' }, 15)
      .to($('#rebarV'), { opacity: 1, duration: 1.5 }, 17)
      .to($('#rebarH'), { opacity: 1, duration: 1.5 }, 18);
    lift(15, 5, 0, 856, $('#loadRebar'));
    tl.fromTo($('#truck'), { x: -1800 }, { x: 180, duration: 3.5, ease: 'power2.out' }, 19)
      .to($('#chute'), { opacity: 1, duration: 0.6 }, 22.5)
      .fromTo($('#concrete'), { opacity: 1, scaleY: 0, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 4.5, ease: 'power1.inOut', immediateRender: false }, 23)
      .to($('#rebarH'), { opacity: 0, duration: 3 }, 24)
      .to(dustEl, { opacity: 0.7, x: 40, duration: 1 }, 23)
      .to(dustEl, { opacity: 0, duration: 2 }, 27.5)
      .to($('#chute'), { opacity: 0, duration: 0.5 }, 27.8)
      .to($('#truck'), { x: 2200, duration: 3.5, ease: 'power2.in' }, 28.4)
      .to($('#podium'), { scaleX: 1, duration: 2, ease: 'power2.out' }, 27.6)
      .to($('#starters'), { opacity: 1, duration: 1 }, 29);

    /* ---------- المرحلة 3: الأعمدة عمودًا عمودًا (32 → 42) ---------- */
    cols.forEach(function (c, i) {
      tl.to(cages[i], { scaleY: frac(LOBBY - 16), duration: 0.8, ease: 'power2.out' }, 32 + i * 1.3)
        .to(c, { scaleY: frac(LOBBY), duration: 1.1, ease: 'power2.inOut' }, 32.5 + i * 1.3);
    });
    tl.to(sideWall, { scaleY: frac(LOBBY), duration: 1.2, ease: 'power2.inOut' }, 39)
      .to(scafs[0], { scaleY: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, 32.5)
      .to(slabs[0], { scaleX: 1, opacity: 1, duration: 1.6, ease: 'power2.inOut' }, 40.2)
      .to($('#starters'), { opacity: 0, duration: 0.6 }, 33)
      .to(shadow, { attr: { width: 40 }, duration: 1.5 }, 40)
      .to(slabCrew, { opacity: 1, duration: 0.8 }, 41.2);
    lift(32, 4.2, -90, LOBBY - 60, $('#loadForm'));
    lift(36.4, 3.8, 90, LOBBY - 60, $('#loadForm'));

    /* ---------- المرحلة 4: الطوابق مع السقالات (44 → 68) ---------- */
    for (var f = 1; f <= FLOORS; f++) {
      var at = FLOOR_START + (f - 1) * FLOOR_STEP;
      var top = ceil(f);
      tl.to(scafs[f], { scaleY: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, at)
        .to(cages, { scaleY: frac(top - 16), duration: 0.7, stagger: 0.08, ease: 'power2.out' }, at + 0.1)
        .to(cols, { scaleY: frac(top), duration: 1.0, stagger: 0.12, ease: 'power2.inOut' }, at + 0.35)
        .to(sideWall, { scaleY: frac(top), duration: 1.0, ease: 'power2.inOut' }, at + 0.5)
        .to(slabs[f], { scaleX: 1, opacity: 1, duration: 0.9, ease: 'power1.inOut' }, at + 1.8)
        .to(dustEl, { y: top - G, x: 0, opacity: 0.35, duration: 0.2 }, at + 1.8)
        .to(dustEl, { opacity: 0, duration: 0.6 }, at + 2.5)
        .to(slabCrew, { y: top, duration: 0.35, ease: 'power1.inOut' }, at + 2.65)
        .to(shadow, { attr: { width: 40 + f * 24 }, duration: 0.8 }, at + 2);
      lift(at, 2.6, f % 2 ? -50 : 50, top - 58, $('#loadBucket'));
    }

    /* ---------- المرحلة 5: الواجهة الزجاجية (70 → 84) ---------- */
    tl.to(cages, { opacity: 0, duration: 1.5 }, 70)
      .to(panes, { opacity: 1, x: 0, duration: 0.55, stagger: 0.28, ease: 'power2.out' }, 70.2)
      .to($('#sideGlass'), { opacity: 1, duration: 8 }, 72)
      .to($('#spandrels'), { opacity: 1, duration: 7 }, 73)
      .to($$('#slabs .sc-slab-top, #slabs .sc-slab-side'), { opacity: 0, duration: 8 }, 72)
      .to($$('#slabs .sc-slab'), { fill: '#1d3044', duration: 8 }, 72)
      .to(cols, { fill: '#1a2b3d', duration: 8 }, 72)
      .fromTo($('#reflect'), { opacity: 0, x: 0 }, { opacity: 1, x: 120, duration: 10, immediateRender: false }, 72)
      .to($('#reflect'), { x: 420, duration: 18 }, 82)
      .to($('#lobby'), { opacity: 1, duration: 2 }, 80.5)
      .to($$('#roof .roof-part'), { opacity: 1, y: 0, duration: 1.2, stagger: 0.6, ease: 'power2.out' }, 81);
    lift(70, 3.8, -60, ROOF - 70, $('#loadGlass'));
    lift(74.2, 3.8, 60, ROOF - 70, $('#loadGlass'));
    lift(78.4, 3.6, 0, ROOF - 70, $('#loadGlass'));

    /* ---------- المرحلة 6: التسليم والإضاءة (86 → 100) ---------- */
    scafs.slice().reverse().forEach(function (s, i) {
      tl.to(s, { opacity: 0, y: -8, duration: 0.6, ease: 'power1.in' }, 86 + i * 0.4);
    });
    tl.to([slabCrew, $('#groundCrew')], { opacity: 0, duration: 1 }, 86)
      .to($('#craneTop'), { opacity: 0, y: -50, duration: 2, ease: 'power2.in' }, 89.5)
      .to($('#mast'), { scaleY: 0, transformOrigin: '50% 100%', duration: 2.4, ease: 'power2.in' }, 91)
      .to($('#crane'), { opacity: 0, duration: 1 }, 93.2)
      .to([$('#fence'), $('#yard')], { opacity: 0, y: 20, duration: 1.5 }, 90)
      .to($('#pile'), { scaleY: 0, duration: 1.5 }, 90)
      .to($('#plaza'), { opacity: 1, duration: 1.5 }, 91)
      .to($('#site'), { opacity: 0, duration: 1.5 }, 91)
      .to($('#pit'), { opacity: 0, duration: 1.5 }, 91)
      .to($$('#trees .sc-tree'), { scale: 1, duration: 1.4, stagger: 0.15, ease: 'back.out(2)' }, 92)
      .to(shadow, { opacity: 0.25, duration: 4 }, 92)
      .to($$('.sc-lamp-glow, .sc-lamp-pool'), { opacity: 1, duration: 1.5, stagger: 0.1 }, 92.5)
      .to($$('.sc-city-lit'), { opacity: 1, duration: 3, stagger: 0.15 }, 92)
      .to($('#canopy'), { opacity: 1, duration: 1 }, 93)
      .to($$('#winLights rect'), { opacity: 1, duration: 0.8, stagger: { each: 0.1, from: 'random' } }, 93.5)
      .to($('#uplights'), { opacity: 1, duration: 2 }, 95)
      .to([$('#folks'), $('#parked')], { opacity: 1, duration: 1.5 }, 94.5)
      .to({}, { duration: 1 }, 99);

    drawCrane();
    drawEx();
    return tl;
  }

  /** العنوان المناسب لموضع السكرول */
  function captionAt(progress) {
    var t = progress * 100, key = 'intro';
    PHASES.forEach(function (ph) { if (t >= ph.at) key = ph.key; });
    var floor = Math.floor((t - FLOOR_START) / FLOOR_STEP);
    return { key: key, floor: Math.max(0, Math.min(FLOORS - 1, floor)), floors: FLOORS };
  }

  global.CityScene = { build: build, fit: fit, timeline: timeline, captionAt: captionAt, FLOORS: FLOORS };
})(window);
