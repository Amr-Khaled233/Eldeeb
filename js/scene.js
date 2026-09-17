/* =========================================================
   CityScene: مشهد مدينة كامل العرض داخل الهيرو
   برج رئيسي يُبنى طابقًا طابقًا بالرافعة، وأبراج حوله تصعد من الأرض،
   وعربيات في الشارع، وفي النهاية تضيء النوافذ وأعمدة الإنارة.
   الإحداثيات: الأرض عند y = 900، والبرج الرئيسي في منتصف x = 0
   ========================================================= */
(function (global) {
  'use strict';

  var G = 900;                              // مستوى الأرض
  var PODIUM = 888;                         // أعلى القاعدة
  var COLS = [-120, -60, 0, 60, 120];       // مراكز الأعمدة
  var BAYS = [-115, -55, 5, 65];            // فتحات الزجاج (عرض 50)
  var FLOORS = 12;
  var FH = 41;
  var FLOOR_START = 10;
  var FLOOR_STEP = 4.3;
  var PHASE_AT = [0, 0.05, 0.10, 0.60, 0.76, 0.86, 0.99];
  var PICK = { tx: 150, hy: 180 };          // مكان التقاط الرافعة

  var BACK = [
    [-1480, 100, 420], [-1250, 100, 330], [-1060, 120, 470], [-930, 90, 560], [-690, 110, 300],
    [-230, 80, 430], [230, 90, 390], [450, 100, 300], [690, 90, 520], [900, 110, 330],
    [1180, 100, 440], [1400, 120, 300], [1620, 110, 480]
  ];
  var FRONT = [
    { x: -380, w: 110, h: 360 },
    { x: 330, w: 130, h: 470, crane: true },
    { x: -580, w: 150, h: 580, crane: true },
    { x: 560, w: 160, h: 640 },
    { x: -820, w: 130, h: 450 },
    { x: 800, w: 120, h: 410 },
    { x: -1060, w: 120, h: 380 },
    { x: 1040, w: 140, h: 540, crane: true },
    { x: -1320, w: 140, h: 500 },
    { x: 1310, w: 120, h: 360 }
  ];
  var LAMPS = [-1500, -1240, -980, -720, -440, -210, 250, 500, 760, 1020, 1280, 1540];
  var TREES = [-1370, -1110, -850, -590, -320, -175, 215, 375, 630, 890, 1150, 1410];
  var LIT = [[0, 1], [1, 3], [2, 0], [2, 2], [3, 1], [4, 3], [4, 0], [5, 2], [6, 1], [7, 3], [7, 0], [8, 2],
    [9, 1], [9, 3], [10, 0], [10, 2], [11, 1], [11, 3], [1, 0], [5, 1], [8, 0], [3, 3]];

  function slabY(k) { return PODIUM - (k + 1) * FH; }  // k = 0..11

  // مولّد عشوائي ثابت (نفس الشكل في كل مرة)
  function rng(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  function r(x, y, w, h, cls, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (cls ? ' class="' + cls + '"' : '') + (extra || '') + '/>';
  }

  /* ---------------- عناصر المشهد ---------------- */
  function defs() {
    return '<defs>' +
      '<pattern id="pGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="sc-grid"/></pattern>' +
      '<pattern id="pHaz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" class="sc-gold"/></pattern>' +
      '<pattern id="pWin" width="18" height="22" patternUnits="userSpaceOnUse"><rect x="4" y="5" width="10" height="12" class="sc-win"/></pattern>' +
      '<pattern id="pLit" width="54" height="66" patternUnits="userSpaceOnUse">' +
      '<rect x="4" y="5" width="10" height="12" class="sc-litwin"/><rect x="40" y="27" width="10" height="12" class="sc-litwin"/><rect x="22" y="49" width="10" height="12" class="sc-litwin"/><rect x="40" y="5" width="10" height="12" class="sc-litwin sc-litwin-2"/></pattern>' +
      '<pattern id="pWinB" width="14" height="18" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="8" height="10" class="sc-win-b"/></pattern>' +
      '<pattern id="pLitB" width="42" height="54" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="8" height="10" class="sc-litwin"/><rect x="31" y="22" width="8" height="10" class="sc-litwin"/><rect x="17" y="40" width="8" height="10" class="sc-litwin"/></pattern>' +
      '<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb8cc"/><stop offset=".45" stop-color="#1f3348"/><stop offset="1" stop-color="#7d9bb5"/></linearGradient>' +
      '<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e7780"/><stop offset=".5" stop-color="#c9ced3"/><stop offset="1" stop-color="#6e7780"/></linearGradient>' +
      '<linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d27a"/><stop offset="1" stop-color="#a87c14"/></linearGradient>' +
      '<linearGradient id="gConcrete" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa1a8"/><stop offset="1" stop-color="#6a7178"/></linearGradient>' +
      '<radialGradient id="gSun"><stop offset="0" class="sc-sun-core"/><stop offset=".55" class="sc-sun-mid"/><stop offset="1" class="sc-sun-edge"/></radialGradient>' +
      '<radialGradient id="gGlow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="cGround"><rect x="-4000" y="-5000" width="8000" height="' + (5000 + G) + '"/></clipPath>' +
      '</defs>';
  }

  function sky() {
    var rand = rng(7);
    var stars = '';
    for (var i = 0; i < 90; i++) {
      stars += '<circle cx="' + Math.round(rand() * 4400 - 2200) + '" cy="' + Math.round(rand() * 1900 - 1400) + '" r="' + (rand() * 1.4 + 0.4).toFixed(1) + '"' +
        (i % 5 === 0 ? ' class="twinkle" style="animation-delay:' + (rand() * 3).toFixed(1) + 's"' : '') + '/>';
    }
    var clouds = [[-900, 160, 1.4], [-300, 90, 1], [420, 140, 1.2], [1000, 70, 0.9], [-1500, 60, 1.1], [1500, 180, 1.3]].map(function (c) {
      return '<path transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + c[2] + ')" d="M0 40a26 26 0 0 1 48-12 20 20 0 0 1 34 16h-82z"/>';
    }).join('');
    return '<rect id="dusk" class="sc-dusk" x="-5000" y="-5000" width="10000" height="10000"/>' +
      '<g id="stars" class="sc-stars">' + stars + '</g>' +
      '<circle id="sun" cx="-560" cy="760" r="54" fill="url(#gSun)"/>' +
      '<g id="clouds" class="sc-clouds">' + clouds + '</g>' +
      '<g id="bpGrid">' + r(-5000, -5000, 10000, 5000 + G, '', ' fill="url(#pGrid)"') + '</g>';
  }

  function backTowers() {
    return '<g clip-path="url(#cGround)"><g id="backTowers">' + BACK.map(function (b) {
      var l = b[0] - b[1] / 2, top = G - b[2];
      return '<g class="rise" data-h="' + b[2] + '">' +
        r(l, top, b[1], b[2], 'sc-tw-back') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, '', ' fill="url(#pWinB)"') +
        r(l + 5, top + 10, b[1] - 10, b[2] - 16, 'sc-lit sc-lit-back', ' fill="url(#pLitB)"') +
        '</g>';
    }).join('') + '</g></g>';
  }

  function roofCrane(x, y, flip) {
    var s = flip ? -1 : 1;
    return '<g class="sc-roofcrane" transform="translate(' + x + ' ' + y + ') scale(' + s + ' 1)">' +
      '<path class="sc-crane-steel" d="M-5 0V-96M5 0V-96M-5 -8L5 -24M5 -8L-5 -24M-5 -24L5 -40M5 -24L-5 -40M-5 -40L5 -56M5 -40L-5 -56M-5 -56L5 -72M5 -56L-5 -72M-5 -72L5 -88M5 -72L-5 -88"/>' +
      '<path class="sc-crane-steel" d="M-120 -104H40M-120 -96H40M-120 -104V-96M-110 -96l6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8 6 -8 6 8"/>' +
      r(22, -112, 18, 16, 'sc-crane-weight') +
      '<path class="sc-cable" d="M0 -104V-126M0 -126L-120 -104M0 -126L40 -104M-80 -96V-40"/>' +
      r(-88, -40, 16, 5, 'sc-gold') +
      '</g>';
  }

  function frontTowers() {
    return '<g clip-path="url(#cGround)"><g id="frontTowers">' + FRONT.map(function (t, i) {
      var l = t.x - t.w / 2, top = G - t.h;
      var tall = t.h > 480;
      var roofY = tall ? top - 46 : top - 8;
      var html = '<g class="rise" data-h="' + (t.h + (t.crane ? 140 : 60)) + '">' +
        r(l, top, t.w, t.h, 'sc-tw') +
        r(l + 7, top + 16, t.w - 14, t.h - 26, '', ' fill="url(#pWin)"') +
        r(l + 7, top + 16, t.w - 14, t.h - 26, 'sc-lit', ' fill="url(#pLit)"') +
        r(i % 2 ? l + t.w - 4 : l, top, 4, t.h, 'sc-gold-edge') +
        r(l - 6, top - 8, t.w + 12, 10, 'sc-cap');
      if (tall) {
        html += r(l + t.w * 0.2, top - 46, t.w * 0.6, 40, 'sc-tw') +
          r(l + t.w * 0.2 + 6, top - 40, t.w * 0.6 - 12, 30, '', ' fill="url(#pWin)"') +
          r(l + t.w * 0.2 - 4, top - 52, t.w * 0.6 + 8, 8, 'sc-cap');
      }
      if (t.crane) html += roofCrane(l + t.w * 0.7, roofY, t.x > 0);
      else {
        html += '<path class="sc-steel" d="M' + (t.x) + ' ' + roofY + 'v-44"/>' +
          '<circle class="sc-beacon" cx="' + t.x + '" cy="' + (roofY - 46) + '" r="3.5"/>';
      }
      return html + '</g>';
    }).join('') + '</g></g>';
  }

  function ground() {
    var dashes = '';
    for (var x = -5000; x < 5000; x += 60) dashes += 'M' + x + ' 976h30';
    return '<g id="ground">' +
      r(-5000, G, 10000, 3000, 'sc-soil') +
      r(-5000, 936, 10000, 12, 'sc-walk') +
      r(-5000, 948, 10000, 56, 'sc-road') +
      '<path class="sc-lane" d="' + dashes + '"/>' +
      '<path class="sc-ground-line" d="M-5000 ' + G + 'H5000"/>' +
      r(-5000, 1004, 10000, 4, 'sc-walk') +
      '</g>';
  }

  function mainTower() {
    var footings = COLS.map(function (c) { return r(c - 10, G, 20, 26, 'sc-footing'); }).join('');
    var cols = COLS.map(function (c) { return r(c - 5, 396, 10, PODIUM - 396, 'sc-column', ' fill="url(#gConcrete)"'); }).join('');
    var panes = '', slabs = '', lit = '';
    for (var k = 0; k < FLOORS; k++) {
      var y = slabY(k);
      slabs += '<g class="sc-slab-g">' + r(-128, y, 256, 7, 'sc-slab') + r(-128, y + 5, 256, 2, 'sc-slab-edge') + '</g>';
      BAYS.forEach(function (bx) {
        panes += '<g class="sc-pane">' + r(bx, y + 7, 50, 34, 'sc-glass', ' fill="url(#gGlass)"') +
          '<path class="sc-shine" d="M' + (bx + 8) + ' ' + (y + 9) + 'h8l-6 30h-8z"/></g>';
      });
    }
    LIT.forEach(function (p) {
      lit += r(BAYS[p[1]] + 1, slabY(p[0]) + 8, 48, 32, 'sc-mainlit');
    });
    var fins = '';
    for (var fx = -90; fx <= 90; fx += 12) fins += 'M' + fx + ' 358v36';
    return '<g id="ghost" class="sc-ghost"><rect x="-128" y="322" width="256" height="' + (PODIUM - 322) + '"/><path d="M0 322V250"/></g>' +
      '<g id="footings">' + footings + '</g>' +
      '<g id="podium">' + r(-142, PODIUM, 284, 12, 'sc-podium') + r(-142, PODIUM + 8, 284, 4, '', ' fill="url(#pHaz)"') + '</g>' +
      '<g id="columns">' + cols + '</g>' +
      '<g id="glass">' + panes + '</g>' +
      '<g id="mainLights">' + lit + '</g>' +
      '<g id="slabs">' + slabs + '</g>' +
      '<g id="crownBase">' + r(-100, 356, 200, 40, 'sc-tw') + '<path class="sc-fins" d="' + fins + '"/>' + r(-106, 350, 212, 8, 'sc-gold', '') + '</g>' +
      '<g id="crownTop">' + r(-56, 318, 112, 34, 'sc-tw') + '<text id="crownSign" class="sc-sign" x="0" y="341" text-anchor="middle"></text>' + r(-60, 314, 120, 6, 'sc-cap') + '</g>' +
      '<g id="spire"><path d="M0 314V250" stroke="url(#gSteel)" stroke-width="4"/><path class="sc-gold-line" d="M-10 300h20M-7 284h14M-4 268h8"/><circle class="sc-beacon" cx="0" cy="247" r="4"/></g>';
  }

  function sparks() {
    return '<g id="sparks">' + [-100, -20, 70].map(function (x, i) {
      return '<g class="sc-spark" transform="translate(' + x + ' 0)" style="animation-delay:' + (i * 0.23) + 's">' +
        '<circle r="3.5"/><path d="M0 0l-9-10M0 0l8-9M0 0l-3 11M0 0l11 2"/></g>';
    }).join('') + '</g>';
  }

  function street() {
    var lamps = LAMPS.map(function (x) {
      return '<g class="sc-lamp"><ellipse class="sc-lamp-pool" cx="' + (x + 14) + '" cy="944" rx="36" ry="6"/>' +
        '<circle class="sc-lamp-glow" cx="' + (x + 14) + '" cy="876" r="26" fill="url(#gGlow)"/>' +
        '<path class="sc-pole" d="M' + x + ' 940V872h16"/>' + r(x + 10, 872, 10, 4, 'sc-lamp-head') + '</g>';
    }).join('');
    var trees = TREES.map(function (x) {
      return '<g class="sc-tree">' + r(x - 2, 912, 4, 26, 'sc-trunk') +
        '<circle class="sc-leaf" cx="' + x + '" cy="902" r="17"/><circle class="sc-leaf-2" cx="' + (x + 7) + '" cy="897" r="9"/></g>';
    }).join('');

    var carColors = ['c1', 'c2', 'c3', 'c4', 'c5'];
    function car(i, dur, delay) {
      return '<g class="sc-car-wrap"><g class="sc-car" style="animation-duration:' + dur + 's;animation-delay:-' + delay + 's">' +
        '<path class="sc-beam" d="M22 -7l70 -9v18z"/>' +
        '<rect x="-22" y="-11" width="44" height="10" rx="3" class="sc-car-body ' + carColors[i % 5] + '"/>' +
        '<path class="sc-car-cab ' + carColors[i % 5] + '" d="M-13 -11l5 -8h15l6 8z"/><path class="sc-car-win" d="M-9 -12l3 -5h11l3 5z"/>' +
        '<circle class="sc-wheel" cx="-12" cy="0" r="3.6"/><circle class="sc-wheel" cx="12" cy="0" r="3.6"/>' +
        '<circle class="sc-headlight" cx="21" cy="-6" r="2"/><circle class="sc-taillight" cx="-21" cy="-6" r="1.8"/></g></g>';
    }
    var laneA = '', laneB = '';
    for (var i = 0; i < 5; i++) {
      laneA += car(i, 16 + (i % 3) * 3, i * 3.4);
      laneB += car(i + 2, 14 + (i % 2) * 4, i * 3.1 + 1.5);
    }
    var truck = '<g id="truck" transform="translate(-1700 0)"><g transform="translate(0 999)">' +
      r(-80, -16, 120, 8, 'sc-chassis') +
      '<ellipse class="sc-drum" cx="-22" cy="-34" rx="46" ry="22"/><path class="sc-drum-stripe" d="M-58 -44q36 20 72 0M-60 -30q36 20 76 0"/>' +
      '<path class="sc-cab-truck" d="M40 -8V-40h18l16 16v16z"/><path class="sc-car-win" d="M46 -36h10l10 10H46z"/>' +
      '<circle class="sc-wheel" cx="-58" cy="0" r="7"/><circle class="sc-wheel" cx="-36" cy="0" r="7"/><circle class="sc-wheel" cx="56" cy="0" r="7"/>' +
      '<circle class="sc-headlight" cx="73" cy="-14" r="2.5"/></g></g>';
    return '<g id="trees">' + trees + '</g><g id="lamps">' + lamps + '</g>' + truck +
      '<g id="cars"><g transform="translate(0 968)">' + laneA + '</g><g transform="translate(0 994) scale(-1 1)">' + laneB + '</g></g>';
  }

  function crane() {
    var mast = 'M176 900V150M190 900V150';
    for (var y = 900; y > 176; y -= 26) mast += 'M176 ' + y + 'L190 ' + (y - 26) + 'M190 ' + y + 'L176 ' + (y - 26);
    var jib = 'M-70 138H190M-70 150H190M-70 138V150';
    for (var x = -70; x < 180; x += 14) jib += 'M' + x + ' 150L' + (x + 7) + ' 138L' + (x + 14) + ' 150';
    return '<g id="crane">' +
      r(162, 886, 42, 14, 'sc-crane-weight') +
      '<path class="sc-crane-steel" d="' + mast + '"/>' +
      '<path class="sc-crane-steel" d="' + jib + '"/>' +
      '<path class="sc-cable" d="M177 138L183 102L189 138M183 102L-70 142M183 102L252 140"/>' +
      r(190, 138, 62, 10, 'sc-gold') + r(232, 148, 18, 20, 'sc-crane-weight') +
      r(172, 152, 26, 17, 'sc-crane-cab', ' rx="2"') +
      '<line id="craneCable" class="sc-cable" x1="150" y1="156" x2="150" y2="180"/>' +
      r(142, 150, 16, 6, 'sc-gold', ' id="trolley"') +
      '<g id="hook" transform="translate(150 180)"><path class="sc-hook" d="M0 0v7a4 4 0 1 1-4 4"/>' +
      '<g id="hookLoad"><path class="sc-cable" d="M-2 12-30 24M2 12 30 24"/>' + r(-36, 24, 72, 7, 'sc-gold') + '</g></g>' +
      '</g>';
  }

  /* ---------------- API ---------------- */
  function markup() {
    return defs() + sky() + backTowers() + frontTowers() + ground() + mainTower() + sparks() + street() + crane();
  }

  function build(svg, signText) {
    svg.innerHTML = markup();
    var sign = svg.querySelector('#crownSign');
    if (sign) sign.textContent = signText || '';
    fit(svg);
  }

  /** يضبط viewBox ليملأ عرض الشاشة كاملًا مع إبقاء البرج في مكان مناسب */
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

  function floorsAt(p) {
    var n = 0;
    for (var k = 0; k < FLOORS; k++) if (p * 100 >= FLOOR_START + k * FLOOR_STEP + 3.7) n = k + 1;
    return n;
  }
  function phaseAt(p) {
    var ph = 0;
    PHASE_AT.forEach(function (at, i) { if (p >= at) ph = i; });
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

    // الجو العام
    tl.fromTo($('#dusk'), { opacity: 0 }, { opacity: 1, duration: 100 }, 0)
      .fromTo($('#sun'), { attr: { cy: 760 } }, { attr: { cy: 150 }, duration: 100 }, 0)
      .fromTo($('#stars'), { opacity: 0 }, { opacity: 1, duration: 40 }, 55)
      .fromTo($('#clouds'), { x: 0 }, { x: 320, duration: 100 }, 0)
      .fromTo($('#bpGrid'), { opacity: 1 }, { opacity: 0.1, duration: 60 }, 0)
      .fromTo($('#ghost'), { opacity: 1 }, { opacity: 0, duration: 12 }, 76);

    // الحالة الابتدائية
    tl.fromTo(columns, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 0, duration: 0.01 }, 0)
      .fromTo(slabs, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)
      .fromTo($('#sparks'), { opacity: 0, y: PODIUM }, { opacity: 0, y: PODIUM, duration: 0.01 }, 0);

    // 0 → 10: الحفر والقاعدة وعربية الخرسانة
    tl.fromTo($('#truck'), { x: -1700 }, { x: -330, duration: 6, ease: 'power2.out' }, 0)
      .to($('#truck'), { x: -2000, duration: 5, ease: 'power2.in' }, 8.5)
      .fromTo($$('#footings rect'), { scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 3, stagger: 0.35 }, 1)
      .fromTo($('#podium'), { scaleX: 0, transformOrigin: '50% 50%' }, { scaleX: 1, duration: 4 }, 5)
      .fromTo($('#hookLoad'), { opacity: 1 }, { opacity: 0, duration: 1.5 }, 8.5);
    move(tl, [40, 820], 3.5, 1);
    move(tl, [PICK.tx, PICK.hy], 3.5, 5);

    // 10 → 62: الأعمدة والأسقف طابقًا طابقًا
    tl.to($('#sparks'), { opacity: 1, duration: 1 }, FLOOR_START)
      .to($('#sparks'), { opacity: 0, duration: 1.5 }, 62);
    slabs.forEach(function (slab, k) {
      var y = slabY(k);
      var at = FLOOR_START + k * FLOOR_STEP;
      tl.to(columns, { scaleY: (k + 1) / FLOORS, duration: 1.6, stagger: 0.08, ease: 'power1.out' }, at);
      tl.fromTo(slab, { x: PICK.tx, y: PICK.hy + 14 - y, opacity: 0 }, { x: PICK.tx, y: PICK.hy + 14 - y, opacity: 1, duration: 0.3 }, at + 1.2);
      tl.to(slab, { x: 0, y: 0, duration: 2.2, ease: 'sine.inOut' }, at + 1.5);
      tl.to($('#sparks'), { y: y + 2, duration: 0.6 }, at + 3.4);
      move(tl, [0, y - 14], 2.2, at + 1.5);
      move(tl, [PICK.tx, PICK.hy], 0.6, at + 3.7, 'power1.in');
    });

    // الأبراج المحيطة تصعد من الأرض
    back.forEach(function (el, i) {
      var h = +el.getAttribute('data-h');
      tl.fromTo(el, { y: h + 40 }, { y: 0, duration: 14, ease: 'power2.out' }, 2 + i * (44 / back.length));
    });
    front.forEach(function (el, i) {
      var h = +el.getAttribute('data-h');
      tl.fromTo(el, { y: h + 60 }, { y: 0, duration: 15, ease: 'expo.out' }, 12 + i * (66 / front.length));
    });

    // 60 → 77: الواجهات الزجاجية
    tl.fromTo($$('#glass .sc-pane'), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, opacity: 1, duration: 1.6, stagger: 0.32, ease: 'power2.out' }, 60);
    move(tl, [60, 600], 7, 60);
    move(tl, [120, 300], 7, 68);

    // 76 → 87: التاج والسارية
    tl.fromTo($('#crownBase'), { scaleY: 0, opacity: 0, transformOrigin: '50% 100%' }, { scaleY: 1, opacity: 1, duration: 3, ease: 'power2.out' }, 76)
      .fromTo($('#crownTop'), { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 3.5, ease: 'power2.out' }, 79)
      .fromTo($('#spire'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 2.5, ease: 'back.out(2)' }, 82.5)
      .fromTo($('#crownSign'), { opacity: 0 }, { opacity: 1, duration: 2 }, 84);
    move(tl, [0, 300], 3, 76);
    move(tl, [0, 290], 3, 79.5);
    move(tl, [200, 170], 3, 84);

    // 86 → 100: الإضاءة وتنسيق الموقع
    tl.fromTo($$('#lamps .sc-lamp-glow, #lamps .sc-lamp-pool'), { opacity: 0 }, { opacity: 1, duration: 2, stagger: 0.12 }, 86)
      .fromTo($$('#trees .sc-tree'), { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 2.5, stagger: 0.3, ease: 'back.out(2)' }, 86)
      .fromTo($$('#mainLights rect'), { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: { each: 0.25, from: 'random' } }, 88)
      .fromTo($$('.sc-lit'), { opacity: 0 }, { opacity: 1, duration: 2.5, stagger: { each: 0.35, from: 'random' } }, 88)
      .fromTo($('#crane'), { opacity: 1 }, { opacity: 0.3, duration: 5 }, 94)
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
