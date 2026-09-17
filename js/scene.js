/* =========================================================
   CityScene: مشهد مدينة فاخر بعرض الشاشة داخل الهيرو
   - برج زجاجي رئيسي (بعمق ثلاثي الأبعاد) يُبنى طابقًا طابقًا بالرافعة
   - أبراج واقعية بواجهات وجوانب وأسطح تصعد من الأرض
   - حركة كاميرا (تقريب ثم ابتعاد) + عمق بين الطبقات
   - في النهاية: إضاءة النوافذ، لوبي مضيء، نخيل، كشافات ذهبية
   الإحداثيات: الأرض عند y = 900، والبرج الرئيسي في منتصف x = 0
   ========================================================= */
(function (global) {
  'use strict';

  var G = 900;                              // مستوى الأرض
  var PODIUM = 888;                         // أعلى القاعدة
  var TOP = 396;                            // أعلى آخر سقف
  var COLS = [-120, -60, 0, 60, 120];       // مراكز الأعمدة
  var BAYS = [-115, -55, 5, 65];            // فتحات الزجاج (عرض 50)
  var FLOORS = 12;
  var FH = 41;
  var DEPTH = 40, DEPTH_Y = 18;             // عمق جانب البرج الرئيسي
  var FLOOR_START = 10;
  var FLOOR_STEP = 4.3;
  var PHASE_AT = [0, 0.05, 0.10, 0.60, 0.76, 0.86, 0.99];
  var PICK = { tx: 150, hy: 180 };
  var ORIGIN = '40 1010';                   // مركز حركة الكاميرا

  var BACK = [
    [-1560, 110, 430], [-1330, 100, 350], [-1140, 120, 500], [-960, 90, 600], [-740, 110, 330],
    [-470, 80, 470], [-270, 90, 380], [300, 90, 420], [470, 100, 330], [700, 90, 560], [930, 110, 360],
    [1190, 100, 470], [1420, 120, 330], [1640, 110, 520]
  ];
  var FRONT = [
    { x: -390, w: 120, h: 380, style: 'crown' },
    { x: 360, w: 130, h: 470, style: 'flat', crane: true },
    { x: -600, w: 150, h: 600, style: 'step' },
    { x: 590, w: 160, h: 660, style: 'spire' },
    { x: -850, w: 130, h: 460, style: 'slant' },
    { x: 840, w: 120, h: 420, style: 'crown' },
    { x: -1090, w: 130, h: 520, style: 'flat', crane: true },
    { x: 1080, w: 150, h: 560, style: 'step' },
    { x: -1350, w: 140, h: 430, style: 'spire' },
    { x: 1340, w: 130, h: 380, style: 'slant' }
  ];
  var LAMPS = [-1540, -1280, -1020, -760, -500, -250, 290, 540, 800, 1060, 1320, 1580];
  var PALMS = [-235, -190, 250, 300];
  var TREES = [-1410, -1150, -890, -630, -370, 420, 670, 930, 1190, 1450];
  var LIT = [[0, 1], [1, 3], [2, 0], [2, 2], [3, 1], [4, 3], [4, 0], [5, 2], [6, 1], [7, 3], [7, 0], [8, 2],
    [9, 1], [9, 3], [10, 0], [10, 2], [11, 1], [11, 3], [1, 0], [5, 1], [8, 0], [3, 3], [6, 3], [10, 1]];

  function slabY(k) { return PODIUM - (k + 1) * FH; }  // k = 0..11

  function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  function r(x, y, w, h, cls, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '/>';
  }
  function p(d, cls, extra) {
    return '<path d="' + d + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '/>';
  }
  function grad(id, x2, y2, stops) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" ' + s[1] + '/>'; }).join('') + '</linearGradient>';
  }

  /* ---------------- التعريفات ---------------- */
  function defs() {
    var ang = (Math.atan(0.45) * 180 / Math.PI).toFixed(1);
    function winPat(id, w, h, cls, skew) {
      return '<pattern id="' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse"' + (skew ? ' patternTransform="skewY(' + skew + ')"' : '') + '>' +
        '<rect x="' + Math.round(w * 0.2) + '" y="' + Math.round(h * 0.2) + '" width="' + Math.round(w * 0.6) + '" height="' + Math.round(h * 0.6) + '" class="' + cls + '"/></pattern>';
    }
    function litPat(id, w, h, skew) {
      var a = Math.round(w * 0.2), b = Math.round(h * 0.2), cw = Math.round(w * 0.6), ch = Math.round(h * 0.6);
      return '<pattern id="' + id + '" width="' + (w * 4) + '" height="' + (h * 3) + '" patternUnits="userSpaceOnUse"' + (skew ? ' patternTransform="skewY(' + skew + ')"' : '') + '>' +
        [[0, 0], [2, 1], [1, 2], [3, 0], [3, 2]].map(function (c, i) {
          return '<rect x="' + (c[0] * w + a) + '" y="' + (c[1] * h + b) + '" width="' + cw + '" height="' + ch + '" class="sc-litwin' + (i % 2 ? ' sc-litwin-2' : '') + '"/>';
        }).join('') + '</pattern>';
    }
    return '<defs>' +
      '<pattern id="pGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="sc-grid"/></pattern>' +
      '<pattern id="pHaz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" class="sc-gold"/></pattern>' +
      '<pattern id="pPave" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M0 12h24M12 0v12" class="sc-pave-line"/></pattern>' +
      winPat('pWin', 16, 22, 'sc-win') + winPat('pWinR', 16, 22, 'sc-win-side', -ang) + winPat('pWinL', 16, 22, 'sc-win-side', ang) +
      litPat('pLit', 16, 22) + litPat('pLitR', 16, 22, -ang) + litPat('pLitL', 16, 22, ang) +
      winPat('pWinB', 12, 16, 'sc-win-b') + litPat('pLitB', 12, 16) +
      grad('gCurtain', 0, 1, [[0, 'class="sc-cur-a"'], [0.45, 'class="sc-cur-b"'], [0.55, 'class="sc-cur-c"'], [1, 'class="sc-cur-d"']]) +
      grad('gSideGlass', 1, 1, [[0, 'class="sc-side-a"'], [1, 'class="sc-side-b"']]) +
      grad('gFace', 1, 0, [[0, 'class="sc-face-a"'], [1, 'class="sc-face-b"']]) +
      grad('gHaze', 0, 1, [[0, 'class="sc-haze-0"'], [1, 'class="sc-haze-1"']]) +
      grad('gSteel', 1, 0, [[0, 'stop-color="#6e7780"'], [0.5, 'stop-color="#e3e7ea"'], [1, 'stop-color="#6e7780"']]) +
      grad('gGold', 0, 1, [[0, 'stop-color="#f3d98a"'], [0.5, 'stop-color="#C89D2A"'], [1, 'stop-color="#8a6810"']]) +
      grad('gGoldH', 1, 0, [[0, 'stop-color="#8a6810"'], [0.5, 'stop-color="#f3d98a"'], [1, 'stop-color="#8a6810"']]) +
      grad('gConcrete', 0, 1, [[0, 'stop-color="#a3aab1"'], [1, 'stop-color="#6a7178"']]) +
      grad('gLobby', 0, 1, [[0, 'stop-color="#fff3cf"'], [1, 'stop-color="#e2b04a"']]) +
      grad('gBeam', 0, 1, [[0, 'stop-color="#ffe6a0" stop-opacity="0"'], [1, 'stop-color="#ffd76a" stop-opacity=".55"']]) +
      grad('gShine', 1, 0, [[0, 'stop-color="#fff" stop-opacity="0"'], [0.5, 'stop-color="#fff" stop-opacity=".55"'], [1, 'stop-color="#fff" stop-opacity="0"']]) +
      '<radialGradient id="gSun"><stop offset="0" class="sc-sun-core"/><stop offset=".55" class="sc-sun-mid"/><stop offset="1" class="sc-sun-edge"/></radialGradient>' +
      '<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="cGround"><rect x="-5000" y="-5000" width="10000" height="' + (5000 + G) + '"/></clipPath>' +
      '<clipPath id="cFacade"><rect x="-128" y="' + TOP + '" width="256" height="' + (PODIUM - TOP) + '"/>' +
      '<path d="M128 ' + PODIUM + 'l' + DEPTH + ' -' + DEPTH_Y + 'V' + (TOP - DEPTH_Y) + 'l-' + DEPTH + ' ' + DEPTH_Y + 'z"/></clipPath>' +
      '</defs>';
  }

  /* ---------------- السماء ---------------- */
  function sky() {
    var rand = rng(7);
    var stars = '';
    for (var i = 0; i < 120; i++) {
      stars += '<circle cx="' + Math.round(rand() * 5000 - 2500) + '" cy="' + Math.round(rand() * 2200 - 1700) + '" r="' + (rand() * 1.4 + 0.4).toFixed(1) + '"' +
        (i % 4 === 0 ? ' class="twinkle" style="animation-delay:' + (rand() * 3).toFixed(1) + 's"' : '') + '/>';
    }
    var clouds = [[-900, 160, 1.6], [-300, 60, 1.1], [420, 120, 1.4], [1000, 40, 1], [-1500, 30, 1.2], [1500, 150, 1.5]].map(function (c) {
      return '<path transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')" d="M0 40a26 26 0 0 1 48-12 20 20 0 0 1 34 16h-82z"/>';
    }).join('');
    return '<rect id="dusk" class="sc-dusk" x="-5000" y="-5000" width="10000" height="10000"/>' +
      '<g id="stars" class="sc-stars">' + stars + '</g>' +
      '<circle id="sun" cx="-620" cy="760" r="70" fill="url(#gSun)"/>' +
      '<g id="clouds" class="sc-clouds">' + clouds + '</g>';
  }

  /* ---------------- صندوق ثلاثي الأبعاد (واجهة + جانب + سطح) ---------------- */
  function box(cx, w, base, h, sideRight, opt) {
    opt = opt || {};
    var l = cx - w / 2, rt = cx + w / 2, top = base - h;
    var D = Math.max(12, Math.round(w * 0.24)), DY = Math.round(D * 0.45);
    var sx = sideRight ? D : -D;
    var ex = sideRight ? rt : l;
    var html = '';
    html += p('M' + ex + ' ' + base + 'l' + sx + ' ' + (-DY) + 'V' + (top - DY) + 'l' + (-sx) + ' ' + DY + 'z', 'sc-side');
    if (opt.windows) {
      html += p('M' + ex + ' ' + (base - 6) + 'l' + sx + ' ' + (-DY) + 'V' + (top - DY + 10) + 'l' + (-sx) + ' ' + DY + 'z', '', ' fill="url(#' + (sideRight ? 'pWinR' : 'pWinL') + ')"');
      html += p('M' + ex + ' ' + (base - 6) + 'l' + sx + ' ' + (-DY) + 'V' + (top - DY + 10) + 'l' + (-sx) + ' ' + DY + 'z', 'sc-lit', ' fill="url(#' + (sideRight ? 'pLitR' : 'pLitL') + ')"');
    }
    html += p('M' + l + ' ' + top + 'H' + rt + 'l' + sx + ' ' + (-DY) + 'H' + (l + sx) + 'z', 'sc-top');
    html += r(l, top, w, h, 'sc-face', ' fill="url(#gFace)"');
    if (opt.windows) {
      html += r(l + 6, top + 12, w - 12, h - 18, '', ' fill="url(#pWin)"');
      html += r(l + 6, top + 12, w - 12, h - 18, 'sc-lit', ' fill="url(#pLit)"');
    }
    return { html: html, top: top, D: D, DY: DY, l: l, rt: rt };
  }

  function roofCrane(x, y, flip) {
    var s = flip ? -1 : 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ' 1)">' +
      p('M-5 0V-96M5 0V-96M-5 -8L5 -24M5 -8L-5 -24M-5 -24L5 -40M5 -24L-5 -40M-5 -40L5 -56M5 -40L-5 -56M-5 -56L5 -72M5 -56L-5 -72M-5 -72L5 -88M5 -72L-5 -88', 'sc-crane-steel') +
      p('M-120 -104H40M-120 -96H40M-120 -104V-96M-110 -96l6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8', 'sc-crane-steel') +
      r(22, -112, 18, 16, 'sc-crane-weight') +
      p('M0 -104V-126M0 -126L-120 -104M0 -126L40 -104M-80 -96V-40', 'sc-cable') +
      r(-88, -40, 16, 5, 'sc-gold') + '</g>';
  }

  function backTowers() {
    return '<g clip-path="url(#cGround)"><g id="backLayer"><g id="backTowers">' + BACK.map(function (b) {
      var l = b[0] - b[1] / 2, top = G - b[2];
      return '<g class="rise" data-h="' + (b[2] + 30) + '">' +
        r(l, top, b[1], b[2], 'sc-tw-back') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, '', ' fill="url(#pWinB)"') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, 'sc-lit', ' fill="url(#pLitB)"') +
        r(l - 3, top - 4, b[1] + 6, 5, 'sc-tw-back') +
        '</g>';
    }).join('') + '</g></g></g>' +
      r(-5000, 380, 10000, G - 380, '', ' fill="url(#gHaze)"');
  }

  function frontTower(t, i) {
    var sideRight = t.x < 0;
    var b = box(t.x, t.w, G, t.h, sideRight, { windows: true });
    var html = b.html;
    var edge = sideRight ? b.rt - 3 : b.l;
    html += r(edge, b.top, 3, t.h, 'sc-gold-edge');
    var roofY = b.top;
    if (t.style === 'step') {
      var s1 = box(t.x - (sideRight ? 8 : -8), t.w * 0.64, b.top, 60, sideRight, { windows: true });
      html += s1.html;
      var s2 = box(t.x - (sideRight ? 12 : -12), t.w * 0.34, s1.top, 40, sideRight);
      html += s2.html;
      roofY = s2.top;
      html += p('M' + t.x + ' ' + roofY + 'v-40', 'sc-steel') + '<circle class="sc-beacon" cx="' + t.x + '" cy="' + (roofY - 42) + '" r="3.5"/>';
    } else if (t.style === 'spire') {
      html += r(b.l + 6, b.top + 6, t.w - 12, 5, 'sc-gold');
      html += p('M' + (t.x - 16) + ' ' + b.top + 'L' + t.x + ' ' + (b.top - 130) + 'L' + (t.x + 16) + ' ' + b.top + 'z', '', ' fill="url(#gSteel)"');
      html += p('M' + t.x + ' ' + (b.top - 130) + 'v-30', 'sc-steel') + '<circle class="sc-beacon" cx="' + t.x + '" cy="' + (b.top - 162) + '" r="3.5"/>';
    } else if (t.style === 'slant') {
      var hi = 70;
      var up = sideRight ? 'M' + b.l + ' ' + b.top + 'H' + b.rt + 'V' + (b.top - hi) + 'z' : 'M' + b.l + ' ' + b.top + 'H' + b.rt + 'L' + b.l + ' ' + (b.top - hi) + 'z';
      html += p(up, 'sc-face', ' fill="url(#gFace)"');
      html += p(up, '', ' fill="url(#pWin)"');
      html += p(sideRight ? 'M' + b.l + ' ' + b.top + 'L' + b.rt + ' ' + (b.top - hi) : 'M' + b.rt + ' ' + b.top + 'L' + b.l + ' ' + (b.top - hi), 'sc-gold-line');
      roofY = b.top - hi;
    } else if (t.style === 'crown') {
      for (var fx = b.l + 8; fx < b.rt - 4; fx += 10) html += r(fx, b.top - 26, 3, 26, 'sc-gold');
      html += r(b.l, b.top - 30, t.w, 5, 'sc-gold');
      roofY = b.top - 30;
    } else {
      html += r(b.l - 4, b.top - 6, t.w + 8, 6, 'sc-cap');
      html += p('M' + (t.x + (sideRight ? -20 : 20)) + ' ' + b.top + 'v-36', 'sc-steel') + '<circle class="sc-beacon" cx="' + (t.x + (sideRight ? -20 : 20)) + '" cy="' + (b.top - 38) + '" r="3.5"/>';
    }
    if (t.crane) html += roofCrane(b.l + t.w * 0.7, roofY, t.x > 0);
    return '<g class="rise" data-h="' + (t.h + 220) + '">' + html + '</g>';
  }

  function frontTowers() {
    return '<g clip-path="url(#cGround)"><g id="frontLayer"><g id="frontTowers">' + FRONT.map(frontTower).join('') + '</g></g></g>';
  }

  /* ---------------- الأرض ---------------- */
  function ground() {
    var dashes = '';
    for (var x = -5000; x < 5000; x += 60) dashes += 'M' + x + ' 976h30';
    var fence = '';
    [[-330, -170], [200, 330]].forEach(function (seg) {
      for (var fx = seg[0]; fx < seg[1]; fx += 32) {
        fence += r(fx, 866, 30, 34, 'sc-fence') + r(fx, 884, 30, 4, 'sc-gold');
      }
    });
    return '<g id="ground">' +
      r(-5000, G, 10000, 3000, 'sc-soil') +
      r(-5000, 936, 10000, 12, 'sc-walk') +
      r(-5000, 948, 10000, 56, 'sc-road') +
      r(-5000, 948, 10000, 56, 'sc-road-sheen') +
      p(dashes, 'sc-lane') +
      p('M-5000 ' + G + 'H5000', 'sc-ground-line') +
      r(-5000, 1004, 10000, 6, 'sc-walk') +
      '</g>' +
      '<g id="plaza">' + r(-340, G, 680, 36, 'sc-plaza') + r(-340, G, 680, 36, '', ' fill="url(#pPave)"') +
      p('M-340 918H340M-60 900v36M60 900v36', 'sc-gold-line') + '</g>' +
      '<g id="fence">' + fence + '</g>';
  }

  /* ---------------- البرج الرئيسي ---------------- */
  function mainTower() {
    var footings = COLS.map(function (c) { return r(c - 10, G, 20, 26, 'sc-footing'); }).join('');
    var cols = COLS.map(function (c) { return r(c - 5, TOP, 10, PODIUM - TOP, 'sc-column', ' fill="url(#gConcrete)"'); }).join('');
    var panes = '', slabs = '', lit = '', spandrels = '', sideLines = '';
    for (var k = 0; k < FLOORS; k++) {
      var y = slabY(k);
      slabs += '<g class="sc-slab-g">' +
        p('M128 ' + y + 'l' + DEPTH + ' -' + DEPTH_Y + 'v7l-' + DEPTH + ' ' + DEPTH_Y + 'z', 'sc-slab-side') +
        p('M-128 ' + y + 'H128l' + DEPTH + ' -' + DEPTH_Y + 'H-88z', 'sc-slab-top') +
        r(-128, y, 256, 7, 'sc-slab') + r(-128, y + 5, 256, 2, 'sc-slab-edge') + '</g>';
      if (k > 0) {
        BAYS.forEach(function (bx) {
          panes += '<g class="sc-pane">' + r(bx, y + 7, 50, 34, 'sc-glass', ' fill="url(#gCurtain)"') +
            p('M' + (bx + 25) + ' ' + (y + 7) + 'v34', 'sc-mullion') + '</g>';
        });
      }
      spandrels += 'M-128 ' + (y + 7) + 'H128';
      sideLines += 'M128 ' + (y + 7) + 'l' + DEPTH + ' -' + DEPTH_Y;
    }
    LIT.forEach(function (c) {
      if (c[0] === 0) return;
      lit += r(BAYS[c[1]] + 1, slabY(c[0]) + 8, 48, 32, 'sc-mainlit');
    });
    var sideGlass = p('M128 ' + PODIUM + 'l' + DEPTH + ' -' + DEPTH_Y + 'V' + (TOP - DEPTH_Y) + 'l-' + DEPTH + ' ' + DEPTH_Y + 'z', '', ' fill="url(#gSideGlass)"') +
      p(sideLines, 'sc-side-lines');
    var fins = '';
    for (var fx = -96; fx <= 96; fx += 12) fins += 'M' + fx + ' 354v40';
    var sparksHtml = [-100, -20, 70].map(function (x, i) {
      return '<g class="sc-spark" transform="translate(' + x + ' 0)" style="animation-delay:' + (i * 0.23) + 's">' +
        '<circle r="3.5"/><path d="M0 0l-9-10M0 0l8-9M0 0l-3 11M0 0l11 2"/></g>';
    }).join('');

    return '<g id="ghost" class="sc-ghost"><rect x="-128" y="296" width="256" height="' + (PODIUM - 296) + '"/><path d="M0 296V196"/></g>' +
      '<g id="footings">' + footings + '</g>' +
      '<g id="podium">' + p('M142 ' + PODIUM + 'l' + DEPTH + ' -' + DEPTH_Y + 'v12l-' + DEPTH + ' ' + DEPTH_Y + 'z', 'sc-slab-side') +
      r(-142, PODIUM, 284, 12, 'sc-podium') + r(-142, PODIUM + 8, 284, 4, '', ' fill="url(#pHaz)"') + '</g>' +
      '<g id="sideFrame">' + r(164, TOP - DEPTH_Y, 6, PODIUM - TOP, 'sc-column', ' fill="url(#gConcrete)"') + '</g>' +
      '<g id="sideGlass">' + sideGlass + '</g>' +
      '<g id="columns">' + cols + '</g>' +
      '<g id="glass">' + panes + '</g>' +
      '<g id="spandrels">' + p(spandrels, 'sc-spandrel') + '</g>' +
      '<g id="mainLights">' + lit + '</g>' +
      '<g id="lobby">' + r(-122, 848, 244, 40, '', ' fill="url(#gLobby)"') +
      p('M-61 848v40M0 848v40M61 848v40', 'sc-mullion') +
      r(-36, 862, 72, 26, 'sc-lobby-door') + r(-70, 842, 140, 6, '', ' fill="url(#gGoldH)"') + '</g>' +
      '<g id="slabs">' + slabs + '</g>' +
      '<g clip-path="url(#cFacade)"><rect id="shine" class="sc-shine" x="-260" y="' + (TOP - 40) + '" width="70" height="' + (PODIUM - TOP + 60) + '" fill="url(#gShine)" transform="skewX(-18)"/></g>' +
      '<g id="crownBase">' +
      p('M110 354l' + DEPTH + ' -' + DEPTH_Y + 'v40l-' + DEPTH + ' ' + DEPTH_Y + 'z', 'sc-side') +
      r(-110, 354, 220, 42, 'sc-crown') + p(fins, 'sc-fins') + '</g>' +
      '<g id="crownGlow">' + r(-114, 346, 228, 8, '', ' fill="url(#gGoldH)"') +
      p('M114 346l' + DEPTH + ' -' + DEPTH_Y + 'v8l-' + DEPTH + ' ' + DEPTH_Y + 'z', 'sc-gold') + '</g>' +
      '<g id="crownTop">' +
      p('M64 302l30 -14v44l-30 14z', 'sc-side') +
      r(-64, 302, 128, 44, 'sc-crown') +
      '<text id="crownSign" class="sc-sign" x="0" y="330" text-anchor="middle"></text>' +
      r(-70, 296, 140, 6, '', ' fill="url(#gGoldH)"') + '</g>' +
      '<g id="spire">' + p('M-7 296L0 196L7 296z', '', ' fill="url(#gGold)"') +
      p('M-14 280h28M-10 262h20M-6 244h12', 'sc-gold-line') + '<circle class="sc-beacon" cx="0" cy="192" r="4.5"/></g>' +
      '<g id="beams">' +
      p('M-3 300L-240 -700L-120 -700Z', 'sc-beam sc-beam-a', ' fill="url(#gBeam)"') +
      p('M3 300L120 -700L240 -700Z', 'sc-beam sc-beam-b', ' fill="url(#gBeam)"') + '</g>' +
      '<g id="sparks">' + sparksHtml + '</g>';
  }

  /* ---------------- الشارع ---------------- */
  function street() {
    var lamps = LAMPS.map(function (x) {
      return '<g class="sc-lamp"><ellipse class="sc-lamp-pool" cx="' + (x + 14) + '" cy="976" rx="46" ry="10"/>' +
        '<circle class="sc-lamp-glow" cx="' + (x + 14) + '" cy="874" r="30" fill="url(#gGlow)"/>' +
        p('M' + x + ' 942V872q0-6 6-6h10', 'sc-pole') + r(x + 12, 866, 12, 4, 'sc-gold') + '</g>';
    }).join('');
    var palms = PALMS.map(function (x) {
      return '<g class="sc-tree">' + p('M' + x + ' 936q-4-34 3-66', 'sc-palm-trunk') +
        p('M' + (x + 3) + ' 870q-20-12-38 4M' + (x + 3) + ' 870q20-14 38 4M' + (x + 3) + ' 870q-10-22-30-22M' + (x + 3) + ' 870q10-22 30-22M' + (x + 3) + ' 870q0-20 4-30', 'sc-palm-leaf') + '</g>';
    }).join('');
    var trees = TREES.map(function (x) {
      return '<g class="sc-tree">' + r(x - 2, 912, 4, 26, 'sc-trunk') +
        '<circle class="sc-leaf" cx="' + x + '" cy="902" r="17"/><circle class="sc-leaf-2" cx="' + (x + 7) + '" cy="896" r="9"/></g>';
    }).join('');

    var carColors = ['c1', 'c2', 'c3', 'c4', 'c5'];
    function car(i, dur, delay) {
      return '<g><g class="sc-car" style="animation-duration:' + dur + 's;animation-delay:-' + delay + 's">' +
        p('M22 -7l90 -12v24z', 'sc-beam-car') +
        r(-24, -11, 48, 10, 'sc-car-body ' + carColors[i % 5], ' rx="4"') +
        p('M-14 -11l6 -8h16l7 8z', 'sc-car-cab ' + carColors[i % 5]) + p('M-10 -12l4 -5h12l4 5z', 'sc-car-win') +
        '<circle class="sc-wheel" cx="-13" cy="0" r="3.8"/><circle class="sc-wheel" cx="13" cy="0" r="3.8"/>' +
        '<circle class="sc-headlight" cx="23" cy="-6" r="2.2"/><circle class="sc-taillight" cx="-23" cy="-6" r="2"/>' +
        r(-20, 2, 40, 6, 'sc-car-reflect') + '</g></g>';
    }
    var laneA = '', laneB = '';
    for (var i = 0; i < 6; i++) {
      laneA += car(i, 15 + (i % 3) * 3, i * 3);
      laneB += car(i + 2, 13 + (i % 2) * 4, i * 2.7 + 1.5);
    }
    var truck = '<g id="truck" transform="translate(-1700 0)"><g transform="translate(0 999)">' +
      r(-80, -16, 120, 8, 'sc-chassis') +
      '<ellipse class="sc-drum" cx="-22" cy="-34" rx="46" ry="22"/>' + p('M-58 -44q36 20 72 0M-60 -30q36 20 76 0', 'sc-drum-stripe') +
      p('M40 -8V-40h18l16 16v16z', 'sc-cab-truck') + p('M46 -36h10l10 10H46z', 'sc-car-win') +
      '<circle class="sc-wheel" cx="-58" cy="0" r="7"/><circle class="sc-wheel" cx="-36" cy="0" r="7"/><circle class="sc-wheel" cx="56" cy="0" r="7"/>' +
      '<circle class="sc-headlight" cx="73" cy="-14" r="2.5"/></g></g>';
    return '<g id="trees">' + trees + palms + '</g><g id="lamps">' + lamps + '</g>' + truck +
      '<g id="cars"><g transform="translate(0 968)">' + laneA + '</g><g transform="translate(0 994) scale(-1 1)">' + laneB + '</g></g>';
  }

  /* ---------------- الرافعة ---------------- */
  function crane() {
    var mast = 'M176 900V150M190 900V150';
    for (var y = 900; y > 176; y -= 26) mast += 'M176 ' + y + 'L190 ' + (y - 26) + 'M190 ' + y + 'L176 ' + (y - 26);
    var jib = 'M-70 138H190M-70 150H190M-70 138V150';
    for (var x = -70; x < 180; x += 14) jib += 'M' + x + ' 150L' + (x + 7) + ' 138L' + (x + 14) + ' 150';
    return '<g id="crane">' +
      r(162, 886, 42, 14, 'sc-crane-weight') +
      p(mast, 'sc-crane-steel') + p(jib, 'sc-crane-steel') +
      p('M177 138L183 102L189 138M183 102L-70 142M183 102L252 140', 'sc-cable') +
      r(190, 138, 62, 10, 'sc-gold') + r(232, 148, 18, 20, 'sc-crane-weight') +
      r(172, 152, 26, 17, 'sc-crane-cab', ' rx="2"') +
      '<line id="craneCable" class="sc-cable" x1="150" y1="156" x2="150" y2="180"/>' +
      r(142, 150, 16, 6, 'sc-gold', ' id="trolley"') +
      '<g id="hook" transform="translate(150 180)">' + p('M0 0v7a4 4 0 1 1-4 4', 'sc-hook') +
      '<g id="hookLoad">' + p('M-2 12-30 24M2 12 30 24', 'sc-cable') + r(-36, 24, 72, 7, 'sc-gold') + '</g></g>' +
      '</g>';
  }

  /* ---------------- API ---------------- */
  function markup() {
    return defs() + sky() +
      '<g id="world">' +
      '<g id="bpGrid">' + r(-5000, -5000, 10000, 5000 + G, '', ' fill="url(#pGrid)"') + '</g>' +
      backTowers() + frontTowers() + ground() + mainTower() + street() + crane() +
      '</g>';
  }

  function build(svg, signText) {
    svg.innerHTML = markup();
    var sign = svg.querySelector('#crownSign');
    if (sign) sign.textContent = signText || '';
    fit(svg);
  }

  /** viewBox يملأ عرض الشاشة ويضع البرج في مكان مناسب بجانب النص */
  function fit(svg) {
    var vw = svg.clientWidth || window.innerWidth;
    var vh = svg.clientHeight || window.innerHeight;
    var ar = vw / vh;
    var bottom = 1010;
    var h = 1010;
    var w = h * ar;
    if (w < 640) { w = 640; h = w / ar; }
    var portrait = ar < 0.95;
    var rtl = document.documentElement.dir === 'rtl';
    var frac = portrait ? 0.46 : (rtl ? 0.3 : 0.7);
    var x0 = 55 - w * frac;
    svg.setAttribute('viewBox', [x0, bottom - h, w, h].map(function (n) { return Math.round(n * 10) / 10; }).join(' '));
  }

  function floorsAt(pr) {
    var n = 0;
    for (var k = 0; k < FLOORS; k++) if (pr * 100 >= FLOOR_START + k * FLOOR_STEP + 3.7) n = k + 1;
    return n;
  }
  function phaseAt(pr) {
    var ph = 0;
    PHASE_AT.forEach(function (at, i) { if (pr >= at) ph = i; });
    return ph;
  }

  function timeline(svg, onProgress) {
    var $ = function (s) { return svg.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(svg.querySelectorAll(s)); };
    var trolley = $('#trolley'), cable = $('#craneCable'), hook = $('#hook');
    var crane = { tx: PICK.tx, hy: PICK.hy };
    function draw() {
      trolley.setAttribute('x', crane.tx - 8);
      cable.setAttribute('x1', crane.tx);
      cable.setAttribute('x2', crane.tx);
      cable.setAttribute('y2', crane.hy);
      hook.setAttribute('transform', 'translate(' + crane.tx + ' ' + crane.hy + ')');
    }
    function move(tl, to, dur, at, ease) {
      tl.to(crane, { tx: to[0], hy: to[1], duration: dur, ease: ease || 'sine.inOut', onUpdate: draw }, at);
    }

    var columns = $$('#columns rect');
    var slabs = $$('#slabs .sc-slab-g');
    var back = $$('#backTowers .rise');
    var front = $$('#frontTowers .rise');
    var tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'none' },
      onUpdate: function () { if (onProgress) onProgress(this.progress()); }
    });

    // الكاميرا: تبدأ قريبة من موقع البناء ثم تبتعد لتكشف المدينة
    tl.fromTo($('#world'), { scale: 1.4, svgOrigin: ORIGIN }, { scale: 1, svgOrigin: ORIGIN, duration: 88, ease: 'power2.inOut' }, 0)
      .fromTo($('#backLayer'), { x: -90 }, { x: 90, duration: 100 }, 0)
      .fromTo($('#frontLayer'), { x: -40 }, { x: 40, duration: 100 }, 0);

    // الجو العام
    tl.fromTo($('#dusk'), { opacity: 0 }, { opacity: 1, duration: 100 }, 0)
      .fromTo($('#sun'), { attr: { cy: 760 } }, { attr: { cy: 120 }, duration: 100 }, 0)
      .fromTo($('#stars'), { opacity: 0 }, { opacity: 1, duration: 40 }, 55)
      .fromTo($('#clouds'), { x: 0 }, { x: 360, duration: 100 }, 0)
      .fromTo($('#bpGrid'), { opacity: 1 }, { opacity: 0, duration: 60 }, 0)
      .fromTo($('#ghost'), { opacity: 1 }, { opacity: 0, duration: 12 }, 76);

    // الحالة الابتدائية
    tl.fromTo(columns.concat($('#sideFrame')), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 0, duration: 0.01 }, 0)
      .fromTo(slabs, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
      .fromTo($('#sparks'), { opacity: 0, y: PODIUM }, { opacity: 0, y: PODIUM, duration: 0.01 }, 0)
      .fromTo([$('#plaza'), $('#lobby'), $('#beams'), $('#shine'), $('#sideGlass'), $('#spandrels')], { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);

    // 0 → 10: الحفر والقاعدة
    tl.fromTo($('#truck'), { x: -1700 }, { x: -470, duration: 6, ease: 'power2.out' }, 0)
      .to($('#truck'), { x: -2100, duration: 5, ease: 'power2.in' }, 8.5)
      .fromTo($$('#footings rect'), { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 3, stagger: 0.35 }, 1)
      .fromTo($('#podium'), { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 4 }, 5)
      .fromTo($('#fence'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 3 }, 0.5)
      .fromTo($('#hookLoad'), { opacity: 1 }, { opacity: 0, duration: 1.5 }, 8.5);
    move(tl, [40, 820], 3.5, 1);
    move(tl, [PICK.tx, PICK.hy], 3.5, 5);

    // 10 → 62: الأعمدة والأسقف
    tl.to($('#sparks'), { opacity: 1, duration: 1 }, FLOOR_START)
      .to($('#sparks'), { opacity: 0, duration: 1.5 }, 62);
    slabs.forEach(function (slab, k) {
      var y = slabY(k);
      var at = FLOOR_START + k * FLOOR_STEP;
      tl.to(columns.concat($('#sideFrame')), { scaleY: (k + 1) / FLOORS, duration: 1.6, stagger: 0.08, ease: 'power1.out' }, at);
      tl.fromTo(slab, { x: PICK.tx, y: PICK.hy + 14 - y, opacity: 0 }, { x: PICK.tx, y: PICK.hy + 14 - y, opacity: 1, duration: 0.3 }, at + 1.2);
      tl.to(slab, { x: 0, y: 0, duration: 2.2, ease: 'sine.inOut' }, at + 1.5);
      tl.to($('#sparks'), { y: y + 2, duration: 0.6 }, at + 3.4);
      move(tl, [0, y - 14], 2.2, at + 1.5);
      move(tl, [PICK.tx, PICK.hy], 0.6, at + 3.7, 'power1.in');
    });

    // الخلفية مدينة قائمة من البداية وتظهر تدريجيًا، والأبراج القريبة تصعد من الأرض
    tl.fromTo(back, { opacity: 0.35 }, { opacity: 1, duration: 30, stagger: 1 }, 0);
    front.forEach(function (el, i) {
      tl.fromTo(el, { y: +el.getAttribute('data-h') }, { y: 0, duration: 16, ease: 'expo.out' }, 12 + i * (64 / front.length));
    });

    // 60 → 77: الواجهات الزجاجية
    tl.fromTo($$('#glass .sc-pane'), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, opacity: 1, duration: 1.6, stagger: 0.36, ease: 'power2.out' }, 60)
      .to($('#sideGlass'), { opacity: 1, duration: 10 }, 62)
      .to($('#spandrels'), { opacity: 1, duration: 8 }, 64)
      // بعد تركيب الزجاج: الأسقف والأعمدة تختفي خلف الواجهة
      .to($$('#slabs .sc-slab-top, #slabs .sc-slab-side'), { opacity: 0, duration: 8, stagger: 0.3 }, 62)
      .to($$('#slabs .sc-slab'), { fill: '#1f3246', duration: 8, stagger: 0.3 }, 62)
      .to(columns.concat($('#sideFrame rect')), { fill: '#1a2b3d', duration: 8 }, 62);
    move(tl, [60, 600], 7, 60);
    move(tl, [120, 300], 7, 68);

    // 76 → 87: التاج والسارية
    tl.fromTo($('#crownBase'), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' }, { scaleY: 1, opacity: 1, duration: 3, ease: 'power2.out' }, 76)
      .fromTo($('#crownGlow'), { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 2.5, ease: 'power2.out' }, 78.5)
      .fromTo($('#crownTop'), { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 3.5, ease: 'power2.out' }, 79.5)
      .fromTo($('#spire'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 2.5, ease: 'back.out(2)' }, 83)
      .fromTo($('#crownSign'), { opacity: 0 }, { opacity: 1, duration: 2 }, 85);
    move(tl, [0, 300], 3, 76);
    move(tl, [0, 290], 3, 80);
    move(tl, [200, 170], 3, 84);

    // 84 → 100: تسليم المشروع والإضاءة
    tl.to($('#fence'), { opacity: 0, y: 40, duration: 3 }, 84)
      .to($('#plaza'), { opacity: 1, duration: 3 }, 85)
      .fromTo($$('#lamps .sc-lamp-glow, #lamps .sc-lamp-pool'), { opacity: 0 }, { opacity: 1, duration: 2, stagger: 0.12 }, 86)
      .fromTo($$('#trees .sc-tree'), { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 2.5, stagger: 0.2, ease: 'back.out(2)' }, 86)
      .to($('#lobby'), { opacity: 1, duration: 2 }, 88)
      .fromTo($$('#mainLights rect'), { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: { each: 0.22, from: 'random' } }, 88)
      .fromTo($$('.sc-lit'), { opacity: 0 }, { opacity: 1, duration: 2.5, stagger: { each: 0.18, from: 'random' } }, 88)
      .fromTo($('#crane'), { opacity: 1 }, { opacity: 0.25, duration: 5 }, 92)
      .to($('#beams'), { opacity: 1, duration: 4 }, 93)
      .to($('#shine'), { opacity: 1, duration: 2 }, 95)
      .to({}, { duration: 1 }, 99);

    draw();
    return tl;
  }

  global.CityScene = {
    FLOORS: FLOORS,
    build: build,
    fit: fit,
    timeline: timeline,
    floorsAt: floorsAt,
    phaseAt: phaseAt
  };
})(window);
