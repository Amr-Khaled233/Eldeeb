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
      // المشهد بعرض الشاشة (بدون نص)، والنص في قسم مستقل يظهر بعد انتهاء البناء
      return '<section id="' + esc(s.id) + '" class="hero" aria-label="' + te(s.label) + '">' +
        '<div class="hero-scene" aria-hidden="true"><svg id="citySvg" preserveAspectRatio="xMidYMid slice" direction="ltr"></svg></div>' +
        '<div class="scene-caption" id="sceneCaption" hidden><span class="cap-eyebrow"></span><strong class="cap-title"></strong><span class="cap-sub"></span></div>' +
        '</section>' +
        '<section class="section hero-intro"><div class="container intro-grid">' +
        '<div class="hero-content">' +
        (t(d.eyebrow) ? '<span class="eyebrow" data-reveal>' + te(d.eyebrow) + '</span>' : '') +
        '<h1 class="hero-title" data-reveal>' + esc(t(d.title)) + (hl ? '<span class="accent">' + esc(hl) + '</span>' : '') + '</h1>' +
        (t(d.subtitle) ? '<p class="hero-sub" data-reveal>' + te(d.subtitle) + '</p>' : '') +
        (btns ? '<div class="hero-actions" data-reveal>' + btns + '</div>' : '') +
        (badges ? '<ul class="hero-badges" data-reveal>' + badges + '</ul>' : '') +
        '</div>' +
        (S.imgSrc(S.settings.logoFull) ? '<div class="intro-logo" data-reveal><img src="' + esc(S.imgSrc(S.settings.logoFull)) + '" alt="' + te(S.settings.siteName) + '" loading="lazy" decoding="async"></div>' : '') +
        '</div></section>';
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

    contact: function (s, idx) {
      var d = s.data || {};
      return open(s, 'contact') + head(d, idx) + contactBlock() + close;
    }
  };

  /** بيانات التواصل + أزرار مباشرة + الخريطة (تُستخدم أيضًا في صفحة المشروع) */
  function contactBlock() {
    var c = S.settings.contact || {};
    var wa = S.waNumber(c);
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

  /* ---------------- مشهد البناء + عناوين الأقسام ---------------- */
  function sectionOf(type) {
    var s = S.section(type);
    return s && s.visible !== false ? s : null;
  }
  function firstSentence(text) {
    var s = String(text || '').split(/[.؟!]/)[0];
    return s.trim();
  }
  /** نص العنوان لكل مرحلة، مأخوذ من أقسام الموقع */
  function captionFor(c) {
    var hero = S.section('hero'), d;
    if (c.key === 'intro') {
      d = hero ? hero.data : {};
      return { eyebrow: t(d.eyebrow), title: t(S.settings.siteName), sub: [t(d.title), t(d.highlight)].filter(Boolean).join(' ') };
    }
    if (c.key === 'about' && sectionOf('about')) {
      d = sectionOf('about');
      return { eyebrow: t(d.label), title: t(d.data.title) };
    }
    if (c.key === 'services' && sectionOf('services')) {
      d = sectionOf('services');
      var items = d.data.items || [];
      if (!items.length) return { eyebrow: t(d.label), title: t(d.data.title) };
      var i = Math.min(items.length - 1, Math.floor(c.floor * items.length / c.floors));
      return { eyebrow: t(d.label), title: t(items[i].title), sub: S.pad(i + 1) + ' / ' + S.pad(items.length) };
    }
    if (c.key === 'projects' && sectionOf('projects')) {
      d = sectionOf('projects');
      return { eyebrow: t(d.label), title: t(d.data.title) };
    }
    if (c.key === 'final') {
      return { eyebrow: t(S.settings.logoText), title: firstSentence(t(S.settings.tagline)) || t(S.settings.siteName) };
    }
    return null;
  }

  var cap = { sig: null, timer: null };
  function updateCaption(p) {
    var box = $('#sceneCaption');
    if (!box) return;
    var c = captionFor(CityScene.captionAt(p));
    var sig = c ? c.eyebrow + '|' + c.title + '|' + (c.sub || '') : '';
    if (sig === cap.sig) return;
    cap.sig = sig;
    box.classList.add('is-out');
    clearTimeout(cap.timer);
    cap.timer = setTimeout(function () {
      box.hidden = !c;
      if (c) {
        $('.cap-eyebrow', box).textContent = c.eyebrow || '';
        $('.cap-title', box).textContent = c.title || '';
        $('.cap-sub', box).textContent = c.sub || '';
        $('.cap-sub', box).hidden = !c.sub;
      }
      box.classList.remove('is-out');
    }, 180);
  }

  // أجهزة ضعيفة أو شاشات صغيرة: عناصر متحركة أقل
  function isLite() {
    var cores = navigator.hardwareConcurrency || 8;
    var mem = navigator.deviceMemory || 8;
    return cores <= 4 || mem <= 4 || window.matchMedia('(max-width: 640px)').matches;
  }

  function initScene() {
    var svg = $('#citySvg');
    if (!svg) return null;
    var hero = $('.hero');
    CityScene.build(svg, { sign: t(S.settings.logoText), lite: isLite() });
    var fitT;
    window.addEventListener('resize', function () {
      clearTimeout(fitT);
      fitT = setTimeout(function () { CityScene.fit(svg); }, 100);
    });
    // إيقاف الحركات المستمرة (الكرين، العربيات، الغبار) لما المشهد يخرج من الشاشة
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
      }).observe(hero);
    }
    if (!hasGsap()) {
      svg.classList.add('scene-static');
      updateCaption(1);
      return null;
    }
    var tl = CityScene.timeline(svg, updateCaption);
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 6); },
      pin: true,
      scrub: 1,
      animation: tl,
      anticipatePin: 1,
      onRefresh: function () {
        CityScene.fit(svg);
        cap.sig = null;
        updateCaption(tl.progress());
      }
    });
    updateCaption(0);
    return tl;
  }

  /* ---------------- GSAP: ظهور الأقسام والمقدمة ---------------- */
  function initGsap() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

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
