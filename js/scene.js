/* =========================================================
   CityScene: عرض مشاريع يُبنى مع السكرول (الهيرو)
   تتابع مبانٍ مختلفة في نفس الموقع:
   عمارة سكنية ← برج إداري ← برجان توأم ← برج الديب الرئيسي
   كل مبنى يُبنى بالرافعة ثم يختفي في الأرض ليظهر التالي،
   والأبراج حوله تظهر وتختفي معه.
   الإحداثيات: الأرض عند y = 900، والموقع في منتصف x = 0
   ========================================================= */
(function (global) {
  'use strict';

  var G = 900;
  var PODIUM = 888;
  var PICK = { tx: 150, hy: 180 };
  var ORIGIN = '0 1010';
  var FLOORS = 12;

  var BUILDINGS = [
    { id: 'b0', style: 'res', towers: [{ x: 0, w: 240, floors: 5, fh: 46, bays: 4 }], win: [2, 20], out: [21, 25], set: 0 },
    { id: 'b1', style: 'office', towers: [{ x: 0, w: 200, floors: 11, fh: 40, bays: 4 }], win: [26, 45], out: [46, 50], set: 1 },
    { id: 'b2', style: 'twin', towers: [{ x: -78, w: 112, floors: 13, fh: 38, bays: 2 }, { x: 78, w: 112, floors: 13, fh: 38, bays: 2 }], win: [51, 70], out: [71, 75], set: 2 },
    { id: 'b3', style: 'flag', towers: [{ x: 0, w: 256, floors: 12, fh: 41, bays: 4 }], win: [76, 96], set: 3 }
  ];

  var SETS = [
    [{ x: -360, w: 120, h: 260, style: 'flat' }, { x: 380, w: 140, h: 300, style: 'crown' }, { x: -620, w: 150, h: 340, style: 'slant' }, { x: 640, w: 130, h: 280, style: 'flat' }],
    [{ x: -380, w: 130, h: 470, style: 'step' }, { x: 400, w: 120, h: 520, style: 'spire' }, { x: -660, w: 120, h: 420, style: 'crown' }, { x: 680, w: 150, h: 450, style: 'slant' }],
    [{ x: -400, w: 140, h: 560, style: 'spire' }, { x: 430, w: 150, h: 600, style: 'step', crane: true }, { x: -700, w: 130, h: 500, style: 'flat', crane: true }, { x: 720, w: 120, h: 480, style: 'crown' }],
    [{ x: -390, w: 120, h: 380, style: 'crown' }, { x: 360, w: 130, h: 470, style: 'flat' }, { x: -600, w: 150, h: 600, style: 'step' },
      { x: 590, w: 160, h: 660, style: 'spire' }, { x: -850, w: 130, h: 460, style: 'slant' }, { x: 840, w: 120, h: 420, style: 'crown' },
      { x: -1090, w: 130, h: 520, style: 'flat', crane: true }, { x: 1080, w: 150, h: 560, style: 'step' }, { x: -1350, w: 140, h: 430, style: 'spire' }, { x: 1340, w: 130, h: 380, style: 'slant' }]
  ];

  var BACK = [
    [-1560, 110, 430], [-1330, 100, 350], [-1140, 120, 500], [-960, 90, 600], [-740, 110, 330],
    [-470, 80, 470], [-270, 90, 380], [300, 90, 420], [470, 100, 330], [700, 90, 560], [930, 110, 360],
    [1190, 100, 470], [1420, 120, 330], [1640, 110, 520]
  ];
  var LAMPS = [-1540, -1280, -1020, -760, -500, -250, 290, 540, 800, 1060, 1320, 1580];
  var PALMS = [-235, -190, 250, 300];
  var TREES = [-1410, -1150, -890, -630, 670, 930, 1190, 1450];

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
    // واجهة البرج الرئيسي للمعة الزجاج
    var ft = BUILDINGS[3].towers[0];
    var fTop = PODIUM - ft.floors * ft.fh;
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
      grad('gWhite', 1, 0, [[0, 'stop-color="#eef0f2"'], [1, 'stop-color="#c3c9cf"']]) +
      grad('gLobby', 0, 1, [[0, 'stop-color="#fff3cf"'], [1, 'stop-color="#e2b04a"']]) +
      grad('gBeam', 0, 1, [[0, 'stop-color="#ffe6a0" stop-opacity="0"'], [1, 'stop-color="#ffd76a" stop-opacity=".55"']]) +
      grad('gShine', 1, 0, [[0, 'stop-color="#fff" stop-opacity="0"'], [0.5, 'stop-color="#fff" stop-opacity=".55"'], [1, 'stop-color="#fff" stop-opacity="0"']]) +
      '<radialGradient id="gSun"><stop offset="0" class="sc-sun-core"/><stop offset=".55" class="sc-sun-mid"/><stop offset="1" class="sc-sun-edge"/></radialGradient>' +
      '<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="gDust"><stop offset="0" stop-color="#b9ada0" stop-opacity=".95"/><stop offset="1" stop-color="#8d8274" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="cGround"><rect x="-5000" y="-5000" width="10000" height="' + (5000 + G) + '"/></clipPath>' +
      '<clipPath id="cFacade"><rect x="-128" y="' + fTop + '" width="256" height="' + (PODIUM - fTop) + '"/></clipPath>' +
      '</defs>';
  }

  /* ---------------- السماء ---------------- */
  function sky() {
    var rand = rng(7);
    var stars = '';
    for (var i = 0; i < 120; i++) {
      stars += '<circle cx="' + Math.round(rand() * 5000 - 2500) + '" cy="' + Math.round(rand() * 2600 - 2000) + '" r="' + (rand() * 1.4 + 0.4).toFixed(1) + '"' +
        (i % 4 === 0 ? ' class="twinkle" style="animation-delay:' + (rand() * 3).toFixed(1) + 's"' : '') + '/>';
    }
    var clouds = [[-900, 160, 1.6], [-300, 60, 1.1], [420, 120, 1.4], [1000, 40, 1], [-1500, 30, 1.2], [1500, 150, 1.5], [-200, -200, 1.3], [600, -320, 1.1]].map(function (c) {
      return '<path transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')" d="M0 40a26 26 0 0 1 48-12 20 20 0 0 1 34 16h-82z"/>';
    }).join('');
    return '<rect id="dusk" class="sc-dusk" x="-5000" y="-5000" width="10000" height="10000"/>' +
      '<g id="stars" class="sc-stars">' + stars + '</g>' +
      '<circle id="sun" cx="-520" cy="200" r="70" fill="url(#gSun)"/>' +
      '<g id="clouds" class="sc-clouds">' + clouds + '</g>';
  }

  /* ---------------- صندوق ثلاثي الأبعاد للأبراج المحيطة ---------------- */
  function box(cx, w, base, h, sideRight, opt) {
    opt = opt || {};
    var l = cx - w / 2, rt = cx + w / 2, top = base - h;
    var D = Math.max(12, Math.round(w * 0.24)), DY = Math.round(D * 0.45);
    var sx = sideRight ? D : -D;
    var ex = sideRight ? rt : l;
    var side = 'M' + ex + ' ' + base + 'l' + sx + ' ' + (-DY) + 'V' + (top - DY) + 'l' + (-sx) + ' ' + DY + 'z';
    var html = p(side, 'sc-side');
    if (opt.windows) {
      html += p(side, '', ' fill="url(#' + (sideRight ? 'pWinR' : 'pWinL') + ')"');
      html += p(side, 'sc-lit', ' fill="url(#' + (sideRight ? 'pLitR' : 'pLitL') + ')"');
    }
    html += p('M' + l + ' ' + top + 'H' + rt + 'l' + sx + ' ' + (-DY) + 'H' + (l + sx) + 'z', 'sc-top');
    html += r(l, top, w, h, 'sc-face', ' fill="url(#gFace)"');
    if (opt.windows) {
      html += r(l + 6, top + 12, w - 12, h - 18, '', ' fill="url(#pWin)"');
      html += r(l + 6, top + 12, w - 12, h - 18, 'sc-lit', ' fill="url(#pLit)"');
    }
    return { html: html, top: top, l: l, rt: rt };
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

  function sideTower(t) {
    var sideRight = t.x < 0;
    var b = box(t.x, t.w, G, t.h, sideRight, { windows: true });
    var html = b.html + r(sideRight ? b.rt - 3 : b.l, b.top, 3, t.h, 'sc-gold-edge');
    var roofY = b.top;
    if (t.style === 'step') {
      var s1 = box(t.x - (sideRight ? 8 : -8), t.w * 0.64, b.top, 60, sideRight, { windows: true });
      var s2 = box(t.x - (sideRight ? 12 : -12), t.w * 0.34, s1.top, 40, sideRight);
      html += s1.html + s2.html;
      roofY = s2.top;
      html += p('M' + t.x + ' ' + roofY + 'v-40', 'sc-steel') + '<circle class="sc-beacon" cx="' + t.x + '" cy="' + (roofY - 42) + '" r="3.5"/>';
    } else if (t.style === 'spire') {
      html += r(b.l + 6, b.top + 6, t.w - 12, 5, 'sc-gold');
      html += p('M' + (t.x - 16) + ' ' + b.top + 'L' + t.x + ' ' + (b.top - 130) + 'L' + (t.x + 16) + ' ' + b.top + 'z', '', ' fill="url(#gSteel)"');
      html += '<circle class="sc-beacon" cx="' + t.x + '" cy="' + (b.top - 134) + '" r="3.5"/>';
    } else if (t.style === 'slant') {
      var up = sideRight ? 'M' + b.l + ' ' + b.top + 'H' + b.rt + 'V' + (b.top - 70) + 'z' : 'M' + b.l + ' ' + b.top + 'H' + b.rt + 'L' + b.l + ' ' + (b.top - 70) + 'z';
      html += p(up, 'sc-face', ' fill="url(#gFace)"') + p(up, '', ' fill="url(#pWin)"');
      html += p(sideRight ? 'M' + b.l + ' ' + b.top + 'L' + b.rt + ' ' + (b.top - 70) : 'M' + b.rt + ' ' + b.top + 'L' + b.l + ' ' + (b.top - 70), 'sc-gold-line');
      roofY = b.top - 70;
    } else if (t.style === 'crown') {
      for (var fx = b.l + 8; fx < b.rt - 4; fx += 10) html += r(fx, b.top - 26, 3, 26, 'sc-gold');
      html += r(b.l, b.top - 30, t.w, 5, 'sc-gold');
      roofY = b.top - 30;
    } else {
      html += r(b.l - 4, b.top - 6, t.w + 8, 6, 'sc-cap');
      html += p('M' + (t.x + (sideRight ? -20 : 20)) + ' ' + b.top + 'v-36', 'sc-steel') + '<circle class="sc-beacon" cx="' + (t.x + (sideRight ? -20 : 20)) + '" cy="' + (b.top - 38) + '" r="3.5"/>';
    }
    if (t.crane) html += roofCrane(b.l + t.w * 0.7, roofY, t.x > 0);
    return '<g class="rise" data-h="' + (t.h + 240) + '">' + html + '</g>';
  }

  function surroundings() {
    var back = BACK.map(function (b) {
      var l = b[0] - b[1] / 2, top = G - b[2];
      return '<g class="back-t">' + r(l, top, b[1], b[2], 'sc-tw-back') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, '', ' fill="url(#pWinB)"') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, 'sc-lit', ' fill="url(#pLitB)"') +
        r(l - 3, top - 4, b[1] + 6, 5, 'sc-tw-back') + '</g>';
    }).join('');
    var sets = SETS.map(function (set, i) {
      return '<g class="fset" data-set="' + i + '">' + set.map(sideTower).join('') + '</g>';
    }).join('');
    return '<g id="backLayer">' + back + '</g>' +
      r(-5000, 380, 10000, G - 380, '', ' fill="url(#gHaze)"') +
      '<g clip-path="url(#cGround)"><g id="frontLayer">' + sets + '</g></g>';
  }

  /* ---------------- الأرض والشارع ---------------- */
  function ground() {
    var dashes = '';
    for (var x = -5000; x < 5000; x += 60) dashes += 'M' + x + ' 976h30';
    var fence = '';
    [[-330, -170], [200, 330]].forEach(function (seg) {
      for (var fx = seg[0]; fx < seg[1]; fx += 32) fence += r(fx, 866, 30, 34, 'sc-fence') + r(fx, 884, 30, 4, 'sc-gold');
    });
    return '<g id="ground">' +
      r(-5000, G, 10000, 3000, 'sc-soil') +
      r(-5000, 936, 10000, 12, 'sc-walk') +
      r(-5000, 948, 10000, 56, 'sc-road') +
      p(dashes, 'sc-lane') +
      p('M-5000 ' + G + 'H5000', 'sc-ground-line') +
      r(-5000, 1004, 10000, 6, 'sc-walk') +
      '</g>' +
      '<g id="plaza">' + r(-340, G, 680, 36, 'sc-plaza') + r(-340, G, 680, 36, '', ' fill="url(#pPave)"') +
      p('M-340 918H340M-60 900v36M60 900v36', 'sc-gold-line') + '</g>' +
      '<g id="fence">' + fence + '</g>';
  }

  function street() {
    var lamps = LAMPS.map(function (x) {
      return '<g class="sc-lamp"><ellipse class="sc-lamp-pool" cx="' + (x + 14) + '" cy="976" rx="46" ry="10"/>' +
        '<circle class="sc-lamp-glow" cx="' + (x + 14) + '" cy="874" r="30" fill="url(#gGlow)"/>' +
        p('M' + x + ' 942V872q0-6 6-6h10', 'sc-pole') + r(x + 12, 866, 12, 4, 'sc-gold') + '</g>';
    }).join('');
    var palms = PALMS.map(function (x) {
      return '<g class="sc-palm">' + p('M' + x + ' 936q-4-34 3-66', 'sc-palm-trunk') +
        p('M' + (x + 3) + ' 870q-20-12-38 4M' + (x + 3) + ' 870q20-14 38 4M' + (x + 3) + ' 870q-10-22-30-22M' + (x + 3) + ' 870q10-22 30-22M' + (x + 3) + ' 870q0-20 4-30', 'sc-palm-leaf') + '</g>';
    }).join('');
    var trees = TREES.map(function (x) {
      return '<g class="sc-tree">' + r(x - 2, 912, 4, 26, 'sc-trunk') +
        '<circle class="sc-leaf" cx="' + x + '" cy="902" r="17"/><circle class="sc-leaf-2" cx="' + (x + 7) + '" cy="896" r="9"/></g>';
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
    var dust = '<g id="dust">' + [[0, 0, 220, 60], [-150, -20, 110, 50], [150, -20, 110, 50], [-60, -60, 90, 55], [70, -70, 90, 55]].map(function (d) {
      return '<ellipse cx="' + d[0] + '" cy="' + (G + d[1]) + '" rx="' + d[2] + '" ry="' + d[3] + '" fill="url(#gDust)"/>';
    }).join('') + '</g>';
    return '<g id="trees">' + trees + '</g><g id="palms">' + palms + '</g><g id="lamps">' + lamps + '</g>' + truck + dust +
      '<g id="cars"><g transform="translate(0 968)">' + laneA + '</g><g transform="translate(0 994) scale(-1 1)">' + laneB + '</g></g>';
  }

  /* ---------------- المباني المتتابعة ---------------- */
  function buildingHtml(B, bi) {
    var rand = rng(31 + bi * 7);
    var glassy = B.style !== 'res';
    var html = '<g clip-path="url(#cGround)"><g class="bld" id="' + B.id + '">';
    var lits = '', lobby = '', crowns = '';

    B.towers.forEach(function (t, ti) {
      var l = t.x - t.w / 2, rt = t.x + t.w / 2, top = PODIUM - t.floors * t.fh;
      var sideRight = t.x >= 0;
      var D = Math.round(t.w * 0.16), DY = Math.round(D * 0.45), sx = sideRight ? D : -D, ex = sideRight ? rt : l;
      var bw = t.w / t.bays;
      var tag = ' data-t="' + ti + '"';
      var sideD = 'M' + ex + ' ' + PODIUM + 'l' + sx + ' ' + (-DY) + 'V' + (top - DY) + 'l' + (-sx) + ' ' + DY + 'z';

      // القاعدة
      var pex = sideRight ? rt + 14 : l - 14;
      html += '<g class="b-podium">' + p('M' + pex + ' ' + PODIUM + 'l' + sx + ' ' + (-DY) + 'v12l' + (-sx) + ' ' + DY + 'z', 'sc-slab-side') +
        r(l - 14, PODIUM, t.w + 28, 12, 'sc-podium') + r(l - 14, PODIUM + 8, t.w + 28, 4, '', ' fill="url(#pHaz)"') + '</g>';

      // الجانب
      if (glassy) {
        var lines = '';
        for (var k0 = 0; k0 < t.floors; k0++) lines += 'M' + ex + ' ' + (PODIUM - k0 * t.fh) + 'l' + sx + ' ' + (-DY);
        html += '<g class="b-side-glass">' + p(sideD, '', ' fill="url(#gSideGlass)"') + p(lines, 'sc-side-lines') + '</g>';
      } else {
        html += '<g class="b-side-grow"' + tag + '>' + p(sideD, 'sc-side-wall') +
          p(sideD, '', ' fill="url(#' + (sideRight ? 'pWinR' : 'pWinL') + ')"') + '</g>';
      }

      // الأعمدة
      var cols = '';
      for (var i = 0; i <= t.bays; i++) cols += r(l + i * bw - 5, top, 10, PODIUM - top, 'sc-column', ' fill="url(#gConcrete)"');
      cols += r(ex + sx - 3, top - DY, 6, PODIUM - top, 'sc-column', ' fill="url(#gConcrete)"');
      html += '<g class="b-cols"' + tag + '>' + cols + '</g>';

      // الزجاج / النوافذ
      var panes = '', span = '';
      for (var k = 0; k < t.floors; k++) {
        var y = PODIUM - (k + 1) * t.fh;
        span += 'M' + l + ' ' + (y + 7) + 'H' + rt;
        if (glassy && k === 0) continue;
        for (var j = 0; j < t.bays; j++) {
          var bx = l + j * bw + 5, pw = bw - 10, ph = t.fh - 7;
          panes += '<g class="b-pane">' + r(bx, y + 7, pw, ph, 'sc-glass', ' fill="url(#gCurtain)"') +
            (pw > 44 ? p('M' + (bx + pw / 2) + ' ' + (y + 7) + 'v' + ph, 'sc-mullion') : '') +
            (glassy ? '' : r(bx - 3, y + 7 + ph * 0.62, pw + 6, 3, 'sc-rail') + p('M' + bx + ' ' + (y + 7 + ph * 0.62) + 'v' + ph * 0.38 + 'M' + (bx + pw) + ' ' + (y + 7 + ph * 0.62) + 'v' + ph * 0.38, 'sc-rail-post')) +
            '</g>';
          if (rand() < 0.45) lits += r(bx + 1, y + 8, pw - 2, ph - 2, 'sc-mainlit b-lit');
        }
      }
      html += '<g class="b-glass">' + panes + '</g>';
      if (glassy) html += '<g class="b-span">' + p(span, 'sc-spandrel') + '</g>';
      if (glassy) {
        lobby += '<g class="b-lobby">' + r(l + 6, PODIUM - t.fh + 6, t.w - 12, t.fh - 6, '', ' fill="url(#gLobby)"') +
          r(t.x - Math.min(36, t.w * 0.2), PODIUM - t.fh * 0.62, Math.min(72, t.w * 0.4), t.fh * 0.62, 'sc-lobby-door') +
          r(t.x - t.w * 0.28, PODIUM - t.fh - 2, t.w * 0.56, 5, '', ' fill="url(#gGoldH)"') + '</g>';
      }

      // الأسقف (ترفعها الرافعة)
      var slabs = '';
      for (var s = 0; s < t.floors; s++) {
        var sy = PODIUM - (s + 1) * t.fh;
        var sex = sideRight ? rt + 4 : l - 4;
        slabs += '<g class="b-slab" data-k="' + s + '" data-t="' + ti + '" data-cx="' + t.x + '" data-y="' + sy + '" data-floors="' + t.floors + '">' +
          p('M' + sex + ' ' + sy + 'l' + sx + ' ' + (-DY) + 'v7l' + (-sx) + ' ' + DY + 'z', 'sc-slab-side') +
          p('M' + (l - 4) + ' ' + sy + 'H' + (rt + 4) + 'l' + sx + ' ' + (-DY) + 'H' + (l - 4 + sx) + 'z', 'sc-slab-top') +
          r(l - 4, sy, t.w + 8, 7, glassy ? 'sc-slab' : 'sc-slab sc-slab-white') + '</g>';
      }
      html += '<g class="b-slabs">' + slabs + '</g>';

      // التاج
      var cx = t.x;
      if (B.style === 'res') {
        crowns += '<g class="b-crown">' + r(l - 4, top - 12, t.w + 8, 12, 'sc-slab-white') +
          p('M' + (sideRight ? rt + 4 : l - 4) + ' ' + (top - 12) + 'l' + sx + ' ' + (-DY) + 'v12l' + (-sx) + ' ' + DY + 'z', 'sc-slab-side') + '</g>' +
          '<g class="b-crown">' + r(l + 18, top - 48, 4, 36, 'sc-gold') + r(l + t.w * 0.48, top - 48, 4, 36, 'sc-gold') +
          r(l + 12, top - 52, t.w * 0.5, 6, 'sc-gold') +
          p('M' + (l + 30) + ' ' + (top - 46) + 'v6M' + (l + 50) + ' ' + (top - 46) + 'v6M' + (l + 70) + ' ' + (top - 46) + 'v6M' + (l + 90) + ' ' + (top - 46) + 'v6', 'sc-gold-line') +
          r(rt - 60, top - 36, 40, 24, 'sc-crown') + '</g>';
      } else if (B.style === 'office') {
        crowns += '<g class="b-crown">' + r(l + t.w * 0.12, top - 34, t.w * 0.76, 34, 'sc-crown') +
          p('M' + (l + t.w * 0.88) + ' ' + (top - 34) + 'l' + (sx * 0.8) + ' ' + (-DY * 0.8) + 'v34l' + (-sx * 0.8) + ' ' + (DY * 0.8) + 'z', 'sc-side') + '</g>' +
          '<g class="b-crown">' + r(l + t.w * 0.1, top - 40, t.w * 0.8, 6, '', ' fill="url(#gGoldH)"') + '</g>' +
          '<g class="b-crown">' + p('M' + (cx - 6) + ' ' + (top - 40) + 'L' + cx + ' ' + (top - 120) + 'L' + (cx + 6) + ' ' + (top - 40) + 'z', '', ' fill="url(#gGold)"') +
          '<circle class="sc-beacon" cx="' + cx + '" cy="' + (top - 124) + '" r="4"/></g>';
      } else if (B.style === 'twin') {
        var fins = '';
        for (var fx = l + 6; fx < rt - 3; fx += 9) fins += r(fx, top - 30, 3, 30, 'sc-gold');
        crowns += '<g class="b-crown">' + fins + r(l - 2, top - 34, t.w + 4, 5, '', ' fill="url(#gGoldH)"') + '</g>' +
          '<g class="b-crown">' + p('M' + (cx - 5) + ' ' + (top - 34) + 'L' + cx + ' ' + (top - 104) + 'L' + (cx + 5) + ' ' + (top - 34) + 'z', '', ' fill="url(#gGold)"') +
          '<circle class="sc-beacon" cx="' + cx + '" cy="' + (top - 108) + '" r="4"/></g>';
      } else {
        var ffins = '';
        for (var ff = -96; ff <= 96; ff += 12) ffins += 'M' + ff + ' ' + (top - 42) + 'v40';
        crowns += '<g class="b-crown">' + p('M110 ' + (top - 42) + 'l40 -18v40l-40 18z', 'sc-side') +
          r(-110, top - 42, 220, 42, 'sc-crown') + p(ffins, 'sc-fins') + '</g>' +
          '<g class="b-crown">' + r(-114, top - 50, 228, 8, '', ' fill="url(#gGoldH)"') + '</g>' +
          '<g class="b-crown">' + p('M64 ' + (top - 94) + 'l30 -14v44l-30 14z', 'sc-side') + r(-64, top - 94, 128, 44, 'sc-crown') +
          '<text class="sc-sign crown-sign" x="0" y="' + (top - 66) + '" text-anchor="middle"></text>' +
          r(-70, top - 100, 140, 6, '', ' fill="url(#gGoldH)"') + '</g>' +
          '<g class="b-crown">' + p('M-7 ' + (top - 100) + 'L0 ' + (top - 200) + 'L7 ' + (top - 100) + 'z', '', ' fill="url(#gGold)"') +
          p('M-14 ' + (top - 116) + 'h28M-10 ' + (top - 134) + 'h20M-6 ' + (top - 152) + 'h12', 'sc-gold-line') +
          '<circle class="sc-beacon" cx="0" cy="' + (top - 204) + '" r="4.5"/></g>';
      }
    });

    if (B.style === 'twin') {
      var t0 = B.towers[0], by = PODIUM - 10 * t0.fh;
      var bl = t0.x + t0.w / 2, br = B.towers[1].x - B.towers[1].w / 2;
      crowns += '<g class="b-crown">' + r(bl, by, br - bl, t0.fh * 1.6, 'sc-glass', ' fill="url(#gCurtain)"') +
        r(bl, by - 3, br - bl, 4, '', ' fill="url(#gGoldH)"') + r(bl, by + t0.fh * 1.6 - 1, br - bl, 4, '', ' fill="url(#gGoldH)"') + '</g>';
    }

    html += '<g class="b-lits">' + lits + '</g>' + lobby + crowns;
    if (B.style === 'flag') {
      var ft = B.towers[0], fTop = PODIUM - ft.floors * ft.fh;
      html += '<g clip-path="url(#cFacade)"><rect id="shine" class="sc-shine" x="-260" y="' + (fTop - 40) + '" width="70" height="' + (PODIUM - fTop + 60) + '" fill="url(#gShine)" transform="skewX(-18)"/></g>' +
        '<g id="beams">' + p('M-3 ' + (fTop - 96) + 'L-240 -900L-120 -900Z', 'sc-beam sc-beam-a', ' fill="url(#gBeam)"') +
        p('M3 ' + (fTop - 96) + 'L120 -900L240 -900Z', 'sc-beam sc-beam-b', ' fill="url(#gBeam)"') + '</g>';
    }
    return html + '</g></g>';
  }

  function sparks() {
    return '<g id="sparks">' + [-80, 0, 80].map(function (x, i) {
      return '<g class="sc-spark" transform="translate(' + x + ' 0)" style="animation-delay:' + (i * 0.23) + 's">' +
        '<circle r="3.5"/><path d="M0 0l-9-10M0 0l8-9M0 0l-3 11M0 0l11 2"/></g>';
    }).join('') + '</g>';
  }

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
      surroundings() + ground() +
      BUILDINGS.map(buildingHtml).join('') +
      sparks() + street() + crane() +
      '</g>';
  }

  function build(svg, signText) {
    svg.innerHTML = markup();
    Array.prototype.forEach.call(svg.querySelectorAll('.crown-sign'), function (el) { el.textContent = signText || ''; });
    fit(svg);
  }

  /** viewBox يملأ الشاشة، والموقع في المنتصف */
  function fit(svg) {
    var vw = svg.clientWidth || window.innerWidth;
    var vh = svg.clientHeight || window.innerHeight;
    var ar = vw / vh;
    var h, w, y0;
    if (ar >= 0.95) {
      h = 1010; w = h * ar;
      if (w < 900) { w = 900; h = w / ar; }
      y0 = 1010 - h;
    } else {
      // الموبايل: نركّز على المبنى ونوسّطه رأسيًا
      w = 560; h = w / ar;
      y0 = 560 - h / 2;
    }
    var x0 = 20 - w / 2;
    svg.setAttribute('viewBox', [x0, y0, w, h].map(function (n) { return Math.round(n * 10) / 10; }).join(' '));
  }

  function floorsAt() { return 0; }
  function phaseAt() { return 0; }

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
    var tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'none' },
      onUpdate: function () { if (onProgress) onProgress(this.progress()); }
    });
    function move(to, dur, at, ease) {
      tl.to(crane, { tx: to[0], hy: to[1], duration: dur, ease: ease || 'sine.inOut', onUpdate: draw }, at);
    }
    var world = $('#world'), sparksEl = $('#sparks'), dust = $('#dust'), fence = $('#fence');
    var plaza = $('#plaza'), palms = $$('#palms .sc-palm');

    // الحالة الابتدائية للعناصر المشتركة
    tl.fromTo([sparksEl, dust, plaza, $('#beams'), $('#shine')], { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
      .fromTo(palms, { scale: 0, transformOrigin: '50% 100%' }, { scale: 0, duration: 0.01 }, 0)
      .fromTo(fence, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
      .fromTo($$('#frontLayer .rise'), { y: function (i, el) { return +el.getAttribute('data-h'); } }, { y: function (i, el) { return +el.getAttribute('data-h'); }, duration: 0.01 }, 0);

    // السماء: من النهار للغروب ثم الليل
    tl.fromTo($('#dusk'), { opacity: 0 }, { opacity: 0.2, duration: 20 }, 0)
      .to($('#dusk'), { opacity: 0.45, duration: 10 }, 28)
      .to($('#dusk'), { opacity: 0.75, duration: 10 }, 53)
      .to($('#dusk'), { opacity: 1, duration: 12 }, 78)
      .fromTo($('#sun'), { attr: { cy: 200 } }, { attr: { cy: 980 }, duration: 70 }, 0)
      .fromTo($('#stars'), { opacity: 0 }, { opacity: 1, duration: 30 }, 50)
      .fromTo($('#clouds'), { x: 0 }, { x: 420, duration: 100 }, 0)
      .fromTo($('#bpGrid'), { opacity: 1 }, { opacity: 0, duration: 20 }, 0)
      .fromTo($$('#lamps .sc-lamp-glow, #lamps .sc-lamp-pool'), { opacity: 0 }, { opacity: 1, duration: 2, stagger: 0.2 }, 55)
      .fromTo($$('#backLayer .sc-lit'), { opacity: 0 }, { opacity: 1, duration: 3, stagger: 0.4 }, 56)
      .fromTo($('#backLayer'), { x: -80 }, { x: 80, duration: 100 }, 0);

    // عربية الخرسانة في البداية
    tl.fromTo($('#truck'), { x: -1700 }, { x: -470, duration: 3, ease: 'power2.out' }, 0)
      .to($('#truck'), { x: -2100, duration: 3, ease: 'power2.in' }, 6)
      .fromTo($('#hookLoad'), { opacity: 1 }, { opacity: 0, duration: 1 }, 4);

    BUILDINGS.forEach(function (B, bi) {
      var q = function (s) {
        return $$(s.split(',').map(function (part) { return '#' + B.id + ' ' + part.trim(); }).join(', '));
      };
      var el = $('#' + B.id);
      var a = B.win[0], b = B.win[1], span = b - a;
      var glassy = B.style !== 'res';
      var first = bi === 0;
      var s0 = a + span * 0.06, sLen = span * 0.5;
      var g0 = a + span * 0.58, g1 = a + span * 0.8;
      var c0 = g1, c1 = a + span * 0.92;

      // الحالة الابتدائية
      tl.fromTo(q('.b-cols, .b-side-grow'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 0, duration: 0.01 }, 0)
        .fromTo(q('.b-slab'), { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
        .fromTo(q('.b-pane'), { opacity: 0, scaleY: 0, transformOrigin: '50% 100%' }, { opacity: 0, scaleY: 0, duration: 0.01 }, 0)
        .fromTo(q('.b-crown, .b-side-glass, .b-span, .b-lobby, .b-lit'), { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
        .fromTo(q('.b-podium'), { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 0, duration: 0.01 }, 0);

      // الكاميرا تقترب ثم تبتعد مع كل مبنى
      tl.fromTo(world, { scale: 1.3, svgOrigin: ORIGIN }, { scale: 1, svgOrigin: ORIGIN, duration: span * 0.95, ease: 'power2.inOut', immediateRender: first }, a);

      // سور الموقع والأبراج المحيطة
      tl.to(fence, { opacity: 1, duration: 1.5 }, a)
        .to(fence, { opacity: 0, duration: 1.5 }, c1);
      $$('.fset[data-set="' + B.set + '"] .rise').forEach(function (t, i) {
        tl.to(t, { y: 0, duration: span * 0.45, ease: 'expo.out' }, a + span * 0.08 + i * span * 0.05);
      });

      // الهيكل: القاعدة ثم الأعمدة والأسقف
      tl.to(q('.b-podium'), { scaleX: 1, duration: span * 0.05, ease: 'power2.out' }, a)
        .to(sparksEl, { opacity: 1, duration: 0.5 }, s0)
        .to(sparksEl, { opacity: 0, duration: 0.5 }, s0 + sLen);
      var slabs = q('.b-slab').sort(function (m, n) {
        return (+m.getAttribute('data-k') - +n.getAttribute('data-k')) || (+m.getAttribute('data-cx') - +n.getAttribute('data-cx'));
      });
      var step = sLen / slabs.length;
      slabs.forEach(function (slab, n) {
        var k = +slab.getAttribute('data-k'), cx = +slab.getAttribute('data-cx'), y = +slab.getAttribute('data-y');
        var ti = slab.getAttribute('data-t'), floors = +slab.getAttribute('data-floors');
        var at = s0 + n * step;
        tl.to(q('.b-cols[data-t="' + ti + '"], .b-side-grow[data-t="' + ti + '"]'), { scaleY: (k + 1) / floors, duration: step * 0.45, ease: 'power1.out' }, at);
        tl.fromTo(slab, { x: PICK.tx - cx, y: PICK.hy + 14 - y, opacity: 0 }, { x: PICK.tx - cx, y: PICK.hy + 14 - y, opacity: 1, duration: step * 0.1 }, at + step * 0.25);
        tl.to(slab, { x: 0, y: 0, duration: step * 0.45, ease: 'sine.inOut' }, at + step * 0.35);
        move([cx, y - 14], step * 0.45, at + step * 0.35);
        move([PICK.tx, PICK.hy], step * 0.18, at + step * 0.8, 'power1.in');
        tl.to(sparksEl, { x: cx, y: y + 2, duration: step * 0.1 }, at + step * 0.8);
      });

      // الواجهات
      var panes = q('.b-pane');
      tl.to(panes, { opacity: 1, scaleY: 1, duration: 1.2, stagger: Math.max(0.02, (g1 - g0 - 1.2) / panes.length), ease: 'power2.out' }, g0);
      if (glassy) tl.to(q('.b-side-glass, .b-span'), { opacity: 1, duration: g1 - g0 }, g0);
      if (glassy) {
        tl.to(q('.b-slab .sc-slab-top, .b-slab .sc-slab-side'), { opacity: 0, duration: g1 - g0 }, g0)
          .to(q('.b-slab .sc-slab'), { fill: '#1f3246', duration: g1 - g0 }, g0)
          .to(q('.b-cols rect'), { fill: '#1a2b3d', duration: g1 - g0 }, g0);
      }
      move([PICK.tx, 420], g1 - g0, g0);

      // التاج
      tl.fromTo(q('.b-crown'), { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: (c1 - c0) * 0.5, stagger: (c1 - c0) * 0.14, ease: 'power2.out', immediateRender: false }, c0);
      move([PICK.tx, PICK.hy], c1 - c0, c0);

      // الافتتاح: إضاءة وممشى ونخيل
      var lits = q('.b-lit');
      if (glassy) tl.to(q('.b-lobby'), { opacity: 1, duration: 1 }, c1);
      tl.to(lits, { opacity: 1, duration: 0.8, stagger: { each: Math.max(0.01, (b - c1 - 0.8) / Math.max(1, lits.length)), from: 'random' } }, c1)
        .to(plaza, { opacity: 1, duration: 1.5 }, c1)
        .to(palms, { scale: 1, duration: 1.5, stagger: 0.2, ease: 'back.out(2)' }, c1);

      // الاختفاء في الأرض وظهور التالي
      if (B.out) {
        var o0 = B.out[0], o1 = B.out[1], d = o1 - o0;
        tl.to(el, { y: 820, duration: d, ease: 'power3.in' }, o0)
          .to(world, { scale: 1.3, svgOrigin: ORIGIN, duration: d, ease: 'power2.in' }, o0)
          .to(plaza, { opacity: 0, duration: d * 0.5 }, o0)
          .to(palms, { scale: 0, duration: d * 0.5 }, o0)
          .fromTo(dust, { opacity: 0, scale: 0.4, svgOrigin: '0 ' + G }, { opacity: 1, scale: 1.25, svgOrigin: '0 ' + G, duration: d * 0.6, immediateRender: false }, o0 + d * 0.25)
          .to(dust, { opacity: 0, duration: d * 0.45 }, o1 - d * 0.1);
        $$('.fset[data-set="' + B.set + '"] .rise').forEach(function (t, i) {
          tl.to(t, { y: +t.getAttribute('data-h'), duration: d, ease: 'power3.in' }, o0 + i * 0.25);
        });
      }
    });

    // النهاية: كشافات ولمعة الزجاج
    tl.to($('#beams'), { opacity: 1, duration: 3 }, 95)
      .to($('#shine'), { opacity: 1, duration: 2 }, 96)
      .fromTo($('#crane'), { opacity: 1 }, { opacity: 0.25, duration: 4 }, 95)
      .fromTo($$('#trees .sc-tree'), { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 2, stagger: 0.15, ease: 'back.out(2)' }, 94)
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
