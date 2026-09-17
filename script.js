/* =========================================================
   الصفحة الرئيسية: عرض الأقسام + مشهد البناء المثبّت في الهيرو
   المحتوى من ContentStore، والأدوات المشتركة من Site (js/site-core.js)
   ========================================================= */
(function () {
  'use strict';

  var S = window.Site;
  var $ = S.$, $$ = S.$$, t = S.t, te = S.te, esc = S.esc;
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger) && !S.reduceMotion; };

  /* ---------------- عناصر مشتركة ---------------- */
  function head(d, idx) {
    var sub = t(d.subtitle);
    return '<header class="section-head">' +
      '<div class="phase-tag" data-reveal><span class="phase-num">' + S.pad(idx) + '</span><span class="phase-dot" aria-hidden="true"></span><span>' + te(d.eyebrow) + '</span></div>' +
      '<h2 class="section-title" data-reveal>' + te(d.title) + '</h2>' +
      (sub ? '<p class="section-sub" data-reveal>' + esc(sub) + '</p>' : '') +
      '</header>';
  }
  function open(s, cls) {
    return '<section id="' + esc(s.id) + '" class="section ' + cls + '" aria-label="' + te(s.label) + '"><div class="container">';
  }
  var close = '</div></section>';
  function btnHtml(b, style) {
    var label = t(b && b.label);
    if (!label) return '';
    var href = S.safeUrl(b.href);
    var ghost = (style || b.style) === 'ghost';
    return '<a class="btn ' + (ghost ? 'btn-ghost' : 'btn-primary') + '" href="' + esc(href) + '"' + S.linkAttrs(href) + '>' +
      esc(label) + (ghost ? '' : S.arrow()) + '</a>';
  }

  /* ---------------- الأقسام ---------------- */
  var R = {
    hero: function (s, idx, ctx) {
      var d = s.data || {};
      var btns = (d.buttons || []).map(function (b) { return btnHtml(b); }).join('');
      var badges = (d.badges || []).filter(function (b) { return t(b.text); }).map(function (b) {
        return '<li>' + icon('shield') + te(b.text) + '</li>';
      }).join('');
      var hl = t(d.highlight);
      return '<section id="' + esc(s.id) + '" class="hero" aria-label="' + te(s.label) + '">' +
        '<div class="hero-scene" aria-hidden="true"><svg id="citySvg" preserveAspectRatio="xMidYMax slice" direction="ltr"></svg></div>' +
        '<div class="hero-scrim" aria-hidden="true"></div>' +
        '<div class="hero-inner"><div class="hero-content">' +
        (t(d.eyebrow) ? '<span class="eyebrow">' + te(d.eyebrow) + '</span>' : '') +
        '<h1 class="hero-title">' + S.words(t(d.title)) + (hl ? '<span class="accent">' + S.words(hl) + '</span>' : '') + '</h1>' +
        (t(d.subtitle) ? '<p class="hero-sub">' + te(d.subtitle) + '</p>' : '') +
        (btns ? '<div class="hero-actions">' + btns + '</div>' : '') +
        (badges ? '<ul class="hero-badges">' + badges + '</ul>' : '') +
        '</div></div>' +
        '<div class="hero-hud" aria-hidden="true">' +
        '<div class="hud-row"><span class="hud-label">' + esc(S.T.stageLabel) + '</span><span class="hud-percent"><b id="hudPercent">0</b>%</span></div>' +
        '<div class="hud-phase" id="hudPhase">' + esc(S.T.phases[0]) + '</div>' +
        '<div class="hud-bar"><span id="hudBar"></span></div>' +
        '<div class="hud-meta"><span>' + esc(S.T.floors) + ' <bdi dir="ltr"><b id="hudFloors">0</b>/<b>' + S.fmt(CityScene.FLOORS) + '</b></bdi></span>' +
        '<span class="hud-done">' + esc(S.T.done) + '</span></div></div>' +
        (ctx.next ? '<a class="scroll-cue" href="#' + esc(ctx.next) + '"><span class="mouse"></span><span>' + esc(S.T.scrollCue) + '</span></a>' : '') +
        '</section>';
    },

    about: function (s, idx) {
      var d = s.data || {};
      var img = S.imgSrc(d.image);
      var feats = (d.features || []).filter(function (f) { return t(f.text); }).map(function (f) {
        return '<li data-reveal><span class="tick">' + icon('check') + '</span><span>' + te(f.text) + '</span></li>';
      }).join('');
      var btn = btnHtml(d.button, 'primary').replace('<a ', '<a data-reveal ');
      return open(s, 'about') + '<div class="about-grid">' +
        '<div class="about-text">' + head(d, idx) + S.paragraphs(t(d.text), ' data-reveal') +
        (feats ? '<ul class="feature-list">' + feats + '</ul>' : '') + btn + '</div>' +
        (img ? '<div class="about-media" data-reveal><div class="frame"><img src="' + esc(img) + '" alt="' + te(d.title) + '" loading="lazy" decoding="async"></div>' +
          (d.experienceValue ? '<div class="exp-badge"><b>' + esc(d.experienceValue) + '</b><span>' + te(d.experienceLabel) + '</span></div>' : '') +
          '</div>' : '') +
        '</div>' + close;
    },

    sectors: function (s, idx) {
      var d = s.data || {};
      var items = d.items || [];
      if (!items.length) return '';
      var tabs = items.map(function (it, i) {
        var count = countProjects(it.id);
        return '<button class="sector-tab' + (i === 0 ? ' is-active' : '') + '" type="button" role="tab" id="sector-tab-' + i + '"' +
          ' aria-selected="' + (i === 0) + '" aria-controls="sectorPanel" tabindex="' + (i === 0 ? 0 : -1) + '" data-index="' + i + '">' +
          '<span class="sector-tab-icon">' + icon(it.icon) + '</span>' +
          '<span class="sector-tab-text"><b>' + te(it.title) + '</b>' +
          (count ? '<small>' + esc(S.T.projectsCount.replace('{n}', S.fmt(count))) + '</small>' : '') + '</span></button>';
      }).join('');
      return open(s, 'sectors') + head(d, idx) +
        '<div class="sectors-wrap" data-reveal>' +
        '<div class="sector-tabs" role="tablist" aria-label="' + te(s.label) + '">' + tabs + '</div>' +
        '<div class="sector-panel" id="sectorPanel" role="tabpanel" aria-labelledby="sector-tab-0">' + sectorPanel(items[0]) + '</div>' +
        '</div>' + close;
    },

    services: function (s, idx) {
      var d = s.data || {};
      var cards = (d.items || []).map(function (it, i) {
        var points = (it.points || []).filter(function (p) { return t(p.text); }).map(function (p) {
          return '<li>' + icon('check') + te(p.text) + '</li>';
        }).join('');
        return '<article class="service-card" data-reveal>' +
          '<span class="service-num" aria-hidden="true">' + S.pad(i + 1) + '</span>' +
          '<div class="service-icon">' + icon(it.icon) + '</div>' +
          '<h3>' + te(it.title) + '</h3><p>' + te(it.text) + '</p>' +
          (points ? '<ul class="service-points">' + points + '</ul>' : '') + '</article>';
      }).join('');
      return open(s, 'services') + head(d, idx) + '<div class="services-grid">' + cards + '</div>' + close;
    },

    projects: function (s, idx) {
      var d = s.data || {};
      var items = d.items || [];
      var groups = [];
      items.forEach(function (p) {
        var g = S.projectGroup(p);
        if (g && !groups.some(function (x) { return x.key === g.key; })) groups.push(g);
      });
      var filters = groups.length > 1
        ? '<div class="filters" data-reveal role="group" aria-label="' + esc(S.T.filterLabel) + '">' +
          '<button class="filter-btn is-active" type="button" data-filter="*" aria-pressed="true">' + esc(S.T.all) + '</button>' +
          groups.map(function (g) {
            return '<button class="filter-btn" type="button" data-filter="' + esc(g.key) + '" aria-pressed="false">' + esc(g.label) + '</button>';
          }).join('') + '</div>'
        : '';
      var cards = items.map(function (p, i) {
        var img = S.imgSrc(p.image);
        var g = S.projectGroup(p);
        var photos = (p.gallery || []).length;
        return '<a class="project-card" data-reveal data-group="' + esc(g ? g.key : '') + '" href="' + esc(S.projectUrl(p, i)) + '">' +
          '<div class="project-media">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" decoding="async">' : '') +
          (photos ? '<span class="project-photos">' + icon('image') + S.fmt(photos) + '</span>' : '') + '</div>' +
          (g ? '<span class="chip">' + esc(g.label) + '</span>' : '') +
          '<div class="project-info"><h3>' + te(p.title) + '</h3>' +
          (t(p.description) ? '<p>' + te(p.description) + '</p>' : '') +
          '<div class="project-meta">' +
          (t(p.location) ? '<span>' + icon('pin') + te(p.location) + '</span>' : '') +
          (p.year ? '<span>' + icon('clock') + esc(p.year) + '</span>' : '') +
          '</div><span class="project-link">' + esc(S.T.viewProject) + S.arrow() + '</span></div></a>';
      }).join('');
      return open(s, 'projects') + head(d, idx) + filters + '<div class="projects-grid">' + cards + '</div>' + close;
    },

    stats: function (s, idx) {
      var d = s.data || {};
      var items = (d.items || []).map(function (it) {
        var v = parseFloat(it.value) || 0;
        var dec = S.decimalsOf(it.value);
        var suffix = t(it.suffix);
        return '<div class="stat" data-reveal><div class="stat-value">' +
          '<span class="stat-num" data-count="' + v + '" data-dec="' + dec + '">' + S.fmt(v, dec) + '</span>' +
          (suffix ? '<span class="stat-suffix">' + esc(suffix) + '</span>' : '') +
          '</div><div class="stat-label">' + te(it.label) + '</div></div>';
      }).join('');
      return open(s, 'stats') + head(d, idx) + '<div class="stats-grid">' + items + '</div>' + close;
    },

    testimonials: function (s, idx) {
      var d = s.data || {};
      var cards = (d.items || []).map(function (it) {
        var rating = Math.max(0, Math.min(5, parseInt(it.rating, 10) || 0));
        var stars = '';
        for (var i = 1; i <= 5; i++) stars += icon('star', i > rating ? 'off' : '');
        var av = S.imgSrc(it.avatar);
        return '<figure class="t-card">' +
          '<div class="t-quote">' + icon('quote', 'flip') + '</div>' +
          '<blockquote class="t-text">' + te(it.text) + '</blockquote>' +
          (rating ? '<div class="t-stars" role="img" aria-label="' + esc(S.T.rating.replace('{n}', rating)) + '">' + stars + '</div>' : '') +
          '<figcaption class="t-person"><span class="t-avatar">' +
          (av ? '<img src="' + esc(av) + '" alt="" loading="lazy" decoding="async">' : S.initials(t(it.name))) +
          '</span><span><b>' + te(it.name) + '</b><small>' + te(it.role) + '</small></span></figcaption></figure>';
      }).join('');
      return open(s, 'testimonials') + head(d, idx) +
        '<div class="t-wrap" data-reveal><div class="t-track" tabindex="0" aria-label="' + esc(S.T.testimonials) + '">' + cards + '</div>' +
        '<div class="t-controls"><button class="t-btn" type="button" data-dir="prev" aria-label="' + esc(S.T.prev) + '">' + S.arrow('prev') + '</button>' +
        '<button class="t-btn" type="button" data-dir="next" aria-label="' + esc(S.T.next) + '">' + S.arrow() + '</button>' +
        '<div class="t-dots"></div></div></div>' + close;
    },

    contact: function (s, idx) {
      var d = s.data || {};
      return open(s, 'contact') + head(d, idx) + contactBlock() + close;
    }
  };

  /** بيانات التواصل + أزرار مباشرة + الخريطة (تُستخدم أيضًا في صفحة المشروع) */
  function contactBlock() {
    var c = S.settings.contact || {};
    var wa = S.digits(c.whatsapp);
    var tel = String(c.phone || '').replace(/[^\d+]/g, '');
    var info = [];
    if (c.phone) info.push(['a', 'tel:' + tel, 'phone', S.T.callUs, '<span class="ltr">' + esc(c.phone) + '</span>']);
    if (wa) info.push(['a', 'https://wa.me/' + wa, 'whatsapp', S.T.whatsapp, '<span class="ltr">+' + esc(wa) + '</span>']);
    if (c.email) info.push(['a', 'mailto:' + c.email, 'mail', S.T.email, esc(c.email)]);
    if (t(c.address)) info.push(['a', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t(c.address)), 'pin', S.T.address, te(c.address)]);
    if (t(c.hours)) info.push(['div', '', 'clock', S.T.hours, te(c.hours)]);
    var cards = info.map(function (i) {
      var inner = '<span class="info-icon">' + icon(i[2]) + '</span><span><small>' + esc(i[3]) + '</small><b>' + i[4] + '</b></span>';
      return i[0] === 'a'
        ? '<a class="info-item" data-reveal href="' + esc(i[1]) + '"' + S.linkAttrs(i[1]) + '>' + inner + '</a>'
        : '<div class="info-item" data-reveal>' + inner + '</div>';
    }).join('');
    var actions = (wa ? '<a class="btn btn-primary" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon('whatsapp') + esc(S.T.chatWhatsapp) + '</a>' : '') +
      (tel ? '<a class="btn btn-ghost" href="tel:' + esc(tel) + '">' + icon('phone') + esc(S.T.callNow) + '</a>' : '') +
      (c.email ? '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + '">' + icon('mail') + esc(S.T.sendEmail) + '</a>' : '');
    var map = /^https:\/\//i.test(c.mapEmbed || '')
      ? '<div class="map-frame" data-reveal><iframe src="' + esc(c.mapEmbed) + '" title="' + esc(S.T.mapTitle) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>'
      : '';
    return '<div class="info-grid">' + cards + '</div>' +
      (actions ? '<div class="contact-actions" data-reveal>' + actions + '</div>' : '') + map;
  }

  /* ---------------- المجالات ---------------- */
  function countProjects(sectorId) {
    return S.projects().filter(function (p) { return p.sector && p.sector === sectorId; }).length;
  }
  function sectorPanel(it) {
    var img = S.imgSrc(it.image);
    var examples = (it.examples || []).filter(function (e) { return t(e.text); }).map(function (e) {
      return '<li><span class="tick">' + icon('check') + '</span>' + te(e.text) + '</li>';
    }).join('');
    var count = countProjects(it.id);
    return (img ? '<div class="sector-media"><img src="' + esc(img) + '" alt="" loading="lazy" decoding="async"></div>' : '') +
      '<div class="sector-body">' +
      '<span class="sector-icon">' + icon(it.icon) + '</span>' +
      '<h3>' + te(it.title) + '</h3>' +
      (t(it.text) ? '<p>' + te(it.text) + '</p>' : '') +
      (examples ? '<h4>' + esc(S.T.examples) + '</h4><ul class="examples">' + examples + '</ul>' : '') +
      (count && S.section('projects') && S.section('projects').visible !== false
        ? '<button class="btn btn-ghost" type="button" data-show-sector="' + esc(it.id) + '">' + esc(S.T.sectorProjects) + ' (' + S.fmt(count) + ')' + S.arrow() + '</button>'
        : '') +
      '</div>';
  }

  function initSectors() {
    var wrap = $('.sectors-wrap');
    if (!wrap) return;
    var items = S.sectors();
    var tabs = $$('.sector-tab', wrap);
    var panel = $('#sectorPanel');
    function select(i, focus) {
      tabs.forEach(function (tab, j) {
        var on = i === j;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      if (focus) tabs[i].focus();
      panel.setAttribute('aria-labelledby', 'sector-tab-' + i);
      panel.classList.remove('is-swapping');
      void panel.offsetWidth;
      panel.innerHTML = sectorPanel(items[i]);
      panel.classList.add('is-swapping');
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    wrap.addEventListener('click', function (e) {
      var tab = e.target.closest('.sector-tab');
      if (tab) { select(+tab.getAttribute('data-index')); return; }
      var show = e.target.closest('[data-show-sector]');
      if (show) {
        var id = show.getAttribute('data-show-sector');
        var btn = $('.filter-btn[data-filter="' + CSS.escape(id) + '"]');
        if (btn) btn.click();
        S.scrollToEl(document.getElementById('projects'));
      }
    });
    wrap.addEventListener('keydown', function (e) {
      var tab = e.target.closest('.sector-tab');
      if (!tab) return;
      var i = +tab.getAttribute('data-index');
      var rtl = document.documentElement.dir === 'rtl';
      var nextKeys = ['ArrowDown', rtl ? 'ArrowLeft' : 'ArrowRight'];
      var prevKeys = ['ArrowUp', rtl ? 'ArrowRight' : 'ArrowLeft'];
      if (nextKeys.indexOf(e.key) >= 0) { e.preventDefault(); select((i + 1) % tabs.length, true); }
      if (prevKeys.indexOf(e.key) >= 0) { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
    });
  }

  /* ---------------- المشاريع ---------------- */
  function initProjects() {
    var wrap = $('.projects');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var f = e.target.closest('.filter-btn');
      if (!f) return;
      var val = f.getAttribute('data-filter');
      $$('.filter-btn', wrap).forEach(function (b) {
        var on = b === f;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      var shown = [];
      $$('.project-card', wrap).forEach(function (card) {
        var match = val === '*' || card.getAttribute('data-group') === val;
        card.classList.toggle('is-hidden', !match);
        if (match) shown.push(card);
      });
      if (hasGsap()) {
        gsap.fromTo(shown, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', overwrite: true });
        ScrollTrigger.refresh();
      }
    });
  }

  /* ---------------- آراء العملاء ---------------- */
  function initTestimonials() {
    var wrap = $('.t-wrap');
    if (!wrap) return;
    var track = $('.t-track', wrap);
    var dotsEl = $('.t-dots', wrap);
    var controls = $('.t-controls', wrap);
    var cards = $$('.t-card', track);
    if (!cards.length) { controls.hidden = true; return; }
    var sign = document.documentElement.dir === 'rtl' ? -1 : 1;

    function step() { return cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0); }
    function pages() { return Math.max(1, cards.length - Math.round(track.clientWidth / step()) + 1); }
    function current() { return Math.round(Math.abs(track.scrollLeft) / step()); }
    function go(i) {
      var n = pages();
      i = (i + n) % n;
      track.scrollTo({ left: sign * i * step(), behavior: S.reduceMotion ? 'auto' : 'smooth' });
    }
    function buildDots() {
      var n = pages();
      controls.hidden = n <= 1;
      dotsEl.innerHTML = Array.from({ length: n }, function (_, i) {
        return '<button type="button" aria-label="' + esc(S.T.slide) + ' ' + (i + 1) + '"></button>';
      }).join('');
      syncDots();
    }
    function syncDots() {
      var c = current();
      $$('button', dotsEl).forEach(function (b, i) { b.classList.toggle('is-active', i === c); });
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.t-btn');
      if (b) { go(current() + (b.getAttribute('data-dir') === 'next' ? 1 : -1)); restart(); return; }
      var dot = e.target.closest('.t-dots button');
      if (dot) { go($$('button', dotsEl).indexOf(dot)); restart(); }
    });
    var st;
    track.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(syncDots, 80); }, { passive: true });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildDots, 150); });
    buildDots();

    var timer = null, paused = false;
    function restart() {
      clearInterval(timer);
      if (S.reduceMotion) return;
      timer = setInterval(function () { if (!paused && !document.hidden) go(current() + 1); }, 6000);
    }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { wrap.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { wrap.addEventListener(ev, function () { paused = false; }); });
    restart();
  }

  /* ---------------- العدادات ---------------- */
  function initCounters() {
    var nums = $$('.stat-num');
    if (!nums.length || S.reduceMotion || !('IntersectionObserver' in window)) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var dec = +el.getAttribute('data-dec') || 0;
      var t0 = null;
      function frame(now) {
        if (t0 === null) t0 = now;
        var k = Math.min(1, (now - t0) / 2200);
        el.textContent = S.fmt(target * (1 - Math.pow(1 - k, 4)), dec);
        if (k < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); run(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) {
      el.textContent = S.fmt(0, +el.getAttribute('data-dec') || 0);
      io.observe(el);
    });
  }

  /* ---------------- مشهد البناء ---------------- */
  var hud = {};
  function updateHud(p) {
    if (!hud.pctEl) {
      hud.pctEl = $('#hudPercent'); hud.phaseEl = $('#hudPhase'); hud.floorsEl = $('#hudFloors');
      hud.barEl = $('#hudBar'); hud.box = $('.hero-hud'); hud.hero = $('.hero');
      if (!hud.pctEl) return;
    }
    var pct = Math.round(p * 100);
    var phase = CityScene.phaseAt(p);
    var floors = CityScene.floorsAt(p);
    if (hud.pct !== pct) { hud.pctEl.textContent = S.fmt(pct); hud.pct = pct; }
    if (hud.phase !== phase) { hud.phaseEl.textContent = S.T.phases[phase]; hud.phase = phase; }
    if (hud.floors !== floors) { hud.floorsEl.textContent = S.fmt(floors); hud.floors = floors; }
    hud.barEl.style.transform = 'scaleX(' + p + ')';
    hud.box.classList.toggle('is-complete', p >= 0.99);
    hud.hero.classList.toggle('is-building', p > 0.02);
  }

  function initScene() {
    var svg = $('#citySvg');
    if (!svg) return null;
    CityScene.build(svg, t(S.settings.logoText));
    var fitT;
    window.addEventListener('resize', function () {
      clearTimeout(fitT);
      fitT = setTimeout(function () { CityScene.fit(svg); }, 100);
    });
    if (!hasGsap()) {
      svg.classList.add('scene-static');
      updateHud(1);
      return null;
    }
    var tl = CityScene.timeline(svg, updateHud);
    tl.to('.scroll-cue', { autoAlpha: 0, duration: 4 }, 0);
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 3.2); },
      pin: true,
      scrub: 1,
      animation: tl,
      anticipatePin: 1,
      onRefresh: function () {
        CityScene.fit(svg);
        hud.pct = hud.phase = hud.floors = null;
        updateHud(tl.progress());
      }
    });
    updateHud(0);
    return tl;
  }

  /* ---------------- GSAP: ظهور الأقسام والمقدمة ---------------- */
  function initGsap() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    var intro = gsap.timeline({ delay: 0.25, defaults: { ease: 'power3.out' } });
    var eyebrow = $$('.hero .eyebrow');
    var wordsEl = $$('.hero-title .word');
    var rest = $$('.hero-sub, .hero-actions, .hero-badges, .hero-hud');
    if (eyebrow.length) intro.from(eyebrow, { y: 20, autoAlpha: 0, duration: 0.6 });
    if (wordsEl.length) intro.from(wordsEl, { yPercent: 60, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, '-=0.3');
    if (rest.length) intro.from(rest, { y: 26, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, '-=0.55');

    initScene();

    var reveals = $$('.section [data-reveal]');
    if (reveals.length) {
      gsap.set(reveals, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(reveals, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true });
        }
      });
    }
    $$('.about-media img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.stats').forEach(function (sec) {
      gsap.fromTo(sec, { '--stripe-y': '0px' }, { '--stripe-y': '-160px', ease: 'none', scrollTrigger: { trigger: sec, scrub: true } });
    });

    var refresh = function () { ScrollTrigger.refresh(); };
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    var rt;
    $$('#main img[loading="lazy"]').forEach(function (img) {
      if (!img.complete) img.addEventListener('load', function () { clearTimeout(rt); rt = setTimeout(refresh, 200); }, { once: true });
    });
  }

  /* ---------------- تشغيل ---------------- */
  function render() {
    var visible = S.visibleSections().filter(function (s) { return R[s.type]; });
    var phase = 0;
    $('#main').innerHTML = '<span id="top"></span>' + visible.map(function (s, i) {
      var idx = s.type === 'hero' ? 0 : ++phase;
      return R[s.type](s, idx, { next: visible[i + 1] && visible[i + 1].id });
    }).join('');
  }

  S.boot({
    home: true,
    render: render,
    after: function () {
      initSectors();
      initProjects();
      initTestimonials();
      initCounters();
      if (hasGsap()) initGsap();
      else {
        initScene();
        S.observeReveal($('#main'));
      }
      var restored = S.restoreScroll();
      if (!restored && location.hash) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) setTimeout(function () { target.scrollIntoView(); }, 80);
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
  });

  window.SiteContact = { block: contactBlock };
})();
