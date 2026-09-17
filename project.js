/* =========================================================
   صفحة المشروع: project?p=<slug>
   التفاصيل + البيانات + نطاق العمل + معرض الصور مع عارض
   ========================================================= */
(function () {
  'use strict';

  var S = window.Site;
  var $ = S.$, $$ = S.$$, t = S.t, te = S.te, esc = S.esc;
  var gallery = [];
  var current = 0;
  var lastFocus = null;

  function findProject() {
    var key = S.params.get('p') || decodeURIComponent(location.hash.slice(1));
    var list = S.projects();
    for (var i = 0; i < list.length; i++) {
      if (S.projectKey(list[i], i) === key) return { p: list[i], i: i };
    }
    return null;
  }

  function notFound() {
    document.title = S.T.notFound + ' | ' + t(S.settings.siteName);
    $('#main').innerHTML = '<section class="pp-empty container">' +
      '<span class="pp-empty-icon">' + icon('building') + '</span>' +
      '<h1>' + esc(S.T.notFound) + '</h1><p>' + esc(S.T.notFoundText) + '</p>' +
      '<a class="btn btn-primary" href="' + esc(S.homeUrl('projects')) + '">' + esc(S.T.backToProjects) + S.arrow() + '</a></section>';
  }

  function render() {
    var found = findProject();
    if (!found) return notFound();
    var p = found.p, index = found.i;
    var list = S.projects();
    var group = S.projectGroup(p);
    var cover = S.imgSrc(p.image);

    document.title = t(p.title) + ' | ' + t(S.settings.siteName);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && t(p.description)) desc.setAttribute('content', t(p.description));

    gallery = (p.gallery || []).map(function (g) { return { src: S.imgSrc(g.image), caption: t(g.caption) }; })
      .filter(function (g) { return g.src; });
    if (!gallery.length && cover) gallery = [{ src: cover, caption: t(p.title) }];

    var facts = [
      ['client', 'user', p.client], ['sector', group ? group.icon : 'layers', group ? group.label : ''],
      ['location', 'pin', p.location], ['year', 'clock', p.year],
      ['area', 'ruler', p.area], ['duration', 'calc', p.duration], ['status', 'check', p.status]
    ].filter(function (f) { return t(f[2]); }).map(function (f) {
      return '<div class="fact" data-reveal><span class="fact-icon">' + icon(f[1]) + '</span><span><small>' + esc(S.T[f[0]]) + '</small><b>' + te(f[2]) + '</b></span></div>';
    }).join('');

    var scope = (p.scope || []).filter(function (x) { return t(x.text); }).map(function (x) {
      return '<li><span class="tick">' + icon('check') + '</span>' + te(x.text) + '</li>';
    }).join('');

    var details = S.paragraphs(t(p.details) || t(p.description), ' data-reveal');

    // توزيع الشبكة بدون فراغات: الصورة الأولى كبيرة والباقي يملأ الصفوف
    var n = gallery.length, others = n - 1;
    function gridClass(i) {
      var c = [];
      if (i === 0) c.push(n === 1 ? 'g-wide ld-3' : 'g-wide');
      if (i > 0 && others === 1) c.push('g-tall');
      if (i === n - 1 && i > 0 && others > 2) {
        var rem = (others - 2) % 3;
        if (rem === 1) c.push('ld-3');
        if (rem === 2) c.push('ld-2');
      }
      if (i === n - 1 && i > 0 && others % 2 === 1) c.push('lm-2');
      return c.length ? ' ' + c.join(' ') : '';
    }
    var photos = gallery.map(function (g, i) {
      return '<button class="g-item' + gridClass(i) + '" type="button" data-open="' + i + '" data-reveal>' +
        '<img src="' + esc(g.src) + '" alt="' + esc(g.caption) + '" loading="lazy" decoding="async">' +
        (g.caption ? '<span class="g-caption">' + esc(g.caption) + '</span>' : '') +
        '<span class="g-zoom" aria-hidden="true">' + icon('plus') + '</span></button>';
    }).join('');

    var c = S.settings.contact || {};
    var wa = S.digits(c.whatsapp);
    var tel = String(c.phone || '').replace(/[^\d+]/g, '');
    var waText = encodeURIComponent((S.lang === 'ar' ? 'مرحبًا، أريد الاستفسار عن مشروع مشابه لـ ' : 'Hello, I would like to ask about a project similar to ') + t(p.title));

    var prev = list.length > 1 ? list[(index - 1 + list.length) % list.length] : null;
    var next = list.length > 1 ? list[(index + 1) % list.length] : null;
    function navCard(item, i, label, cls) {
      if (!item) return '';
      var img = S.imgSrc(item.image);
      return '<a class="pp-navcard ' + cls + '" href="' + esc(S.projectUrl(item, i)) + '">' +
        (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<span><small>' + esc(label) + '</small><b>' + te(item.title) + '</b></span></a>';
    }

    $('#main').innerHTML =
      '<section class="pp-hero">' +
      '<div class="container">' +
      '<nav class="crumbs" aria-label="breadcrumb"><a href="' + esc(S.homeUrl()) + '">' + esc(S.T.home) + '</a>' +
      '<span aria-hidden="true">/</span><a href="' + esc(S.homeUrl('projects')) + '">' + esc(S.T.projects) + '</a>' +
      '<span aria-hidden="true">/</span><span aria-current="page">' + te(p.title) + '</span></nav>' +
      (group ? '<span class="chip">' + icon(group.icon) + esc(group.label) + '</span>' : '') +
      '<h1 class="pp-title">' + te(p.title) + '</h1>' +
      (t(p.description) ? '<p class="pp-lead">' + te(p.description) + '</p>' : '') +
      '</div>' +
      (cover ? '<div class="container"><button class="pp-cover" type="button" data-open="0"><img src="' + esc(cover) + '" alt="' + te(p.title) + '" fetchpriority="high" decoding="async"></button></div>' : '') +
      '</section>' +

      (facts ? '<section class="pp-section"><div class="container"><div class="facts">' + facts + '</div></div></section>' : '') +

      '<section class="pp-section"><div class="container pp-body">' +
      '<div class="pp-details"><h2 class="pp-h2" data-reveal>' + esc(S.T.aboutProject) + '</h2>' + details + '</div>' +
      (scope ? '<aside class="pp-scope" data-reveal><h2 class="pp-h2">' + esc(S.T.scope) + '</h2><ul class="examples">' + scope + '</ul></aside>' : '') +
      '</div></section>' +

      (photos ? '<section class="pp-section"><div class="container"><h2 class="pp-h2" data-reveal>' + esc(S.T.gallery) +
        ' <span class="pp-count">' + S.fmt(gallery.length) + '</span></h2><div class="gallery-grid">' + photos + '</div></div></section>' : '') +

      '<section class="pp-section"><div class="container"><div class="pp-cta" data-reveal>' +
      '<div><h2>' + esc(S.T.similarTitle) + '</h2><p>' + esc(S.T.similarText) + '</p></div>' +
      '<div class="pp-cta-actions">' +
      (wa ? '<a class="btn btn-primary" href="https://wa.me/' + wa + '?text=' + waText + '" target="_blank" rel="noopener">' + icon('whatsapp') + esc(S.T.chatWhatsapp) + '</a>' : '') +
      (tel ? '<a class="btn btn-ghost" href="tel:' + esc(tel) + '">' + icon('phone') + esc(S.T.callNow) + '</a>' : '') +
      '</div></div></div></section>' +

      (prev || next ? '<section class="pp-section pp-last"><div class="container"><div class="pp-nav">' +
        navCard(prev, (index - 1 + list.length) % list.length, S.T.prevProject, 'is-prev') +
        '<a class="btn btn-ghost pp-all" href="' + esc(S.homeUrl('projects')) + '">' + icon('layers') + esc(S.T.backToProjects) + '</a>' +
        navCard(next, (index + 1) % list.length, S.T.nextProject, 'is-next') +
        '</div></div></section>' : '');

    S.observeReveal($('#main'));
  }

  /* ---------------- عارض الصور ---------------- */
  function show(i) {
    if (!gallery.length) return;
    current = (i + gallery.length) % gallery.length;
    var g = gallery[current];
    var img = $('#lbImg');
    img.classList.remove('is-in');
    img.src = g.src;
    img.alt = g.caption || '';
    $('#lbCaption').textContent = g.caption || '';
    $('#lbCounter').textContent = S.T.photoOf.replace('{i}', S.fmt(current + 1)).replace('{n}', S.fmt(gallery.length));
    $$('.lb-nav').forEach(function (b) { b.hidden = gallery.length < 2; });
    requestAnimationFrame(function () { img.classList.add('is-in'); });
  }
  function openBox(i, trigger) {
    lastFocus = trigger || document.activeElement;
    $('#lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
    show(i);
    $('.lb-top .lb-btn').focus();
  }
  function closeBox() {
    var lb = $('#lightbox');
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function initLightbox() {
    var lb = $('#lightbox');
    $('.lb-prev').innerHTML = S.arrow('prev');
    $('.lb-next').innerHTML = S.arrow();
    $('#main').addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]');
      if (o) openBox(+o.getAttribute('data-open'), o);
    });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) return closeBox();
      var n = e.target.closest('[data-nav]');
      if (n) show(current + (+n.getAttribute('data-nav')));
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      var rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'ArrowRight') show(current + (rtl ? -1 : 1));
      else if (e.key === 'ArrowLeft') show(current + (rtl ? 1 : -1));
    });
    // سحب بالإصبع
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 40) return;
      var rtl = document.documentElement.dir === 'rtl';
      show(current + ((dx < 0) !== rtl ? 1 : -1));
    });
  }

  S.boot({
    home: false,
    render: render,
    after: function () {
      initLightbox();
      S.restoreScroll();
    }
  });
})();
