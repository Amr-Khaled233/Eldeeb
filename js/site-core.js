/* =========================================================
   Site core: مشترك بين الصفحة الرئيسية وصفحة المشروع
   (تحميل المحتوى، اللغة، الثيم، الهيدر، الفوتر، أدوات مساعدة)
   ========================================================= */
(function (global) {
  'use strict';

  var params = new URLSearchParams(location.search);
  var S = {
    params: params,
    isPreview: params.has('preview'),
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lang: 'ar',
    T: I18N.UI.ar,
    settings: {},
    content: null,
    numLocale: 'en-US'
  };
  var SCROLL_KEY = 'bc:restore-scroll:' + location.pathname;

  /* ---------------- Helpers ---------------- */
  S.$ = function (s, r) { return (r || document).querySelector(s); };
  S.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  S.t = function (v) { return I18N.tr(v, S.lang); };
  S.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  S.te = function (v) { return S.esc(S.t(v)); };
  S.safeUrl = function (u) {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(https?|mailto|tel):/i.test(u)) return '#';
    return u;
  };
  S.imgSrc = function (u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^data:image\//i.test(u) || /^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || /^\/\//.test(u)) return '';
    return u;
  };
  S.linkAttrs = function (href) { return /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : ''; };
  S.digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  /** رقم واتساب بالصيغة الدولية: من حقل واتساب، وإن كان فارغًا فمن رقم الهاتف */
  S.waNumber = function (contact) {
    function norm(v) {
      var d = S.digits(v);
      if (d.indexOf('00') === 0) d = d.slice(2);
      if (/^01\d{9}$/.test(d)) d = '2' + d; // رقم مصري محلي 01xxxxxxxxx
      if (d === '201000000000') return '';   // الرقم التجريبي القديم
      return d.length >= 8 ? d : '';
    }
    contact = contact || {};
    return norm(contact.whatsapp) || norm(contact.phone);
  };
  S.fmt = function (n, dec, minInt) {
    return Number(n).toLocaleString(S.numLocale, {
      minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0, minimumIntegerDigits: minInt || 1
    });
  };
  S.pad = function (n) { return S.fmt(n, 0, 2); };
  S.decimalsOf = function (v) { return (String(v).split('.')[1] || '').length; };
  S.paragraphs = function (text, attrs) {
    return String(text || '').split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p' + (attrs || '') + '>' + S.esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  };
  S.words = function (text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean)
      .map(function (w) { return '<span class="word">' + S.esc(w) + '</span>'; }).join(' ');
  };
  S.initials = function (name) {
    var parts = String(name || '').replace(/^(م|د|أ|ا|Eng|Dr|Mr|Mrs|Ms)\.\s*/i, '').trim().split(/\s+/);
    return S.esc((parts[0] || '').charAt(0) + (parts[1] ? parts[1].charAt(0) : ''));
  };
  S.arrow = function (dir) { return icon(dir === 'prev' ? 'arrowRight' : 'arrow', 'flip'); };
  S.contrastInk = function (hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return '#0D1B2A';
    var n = parseInt(m[1], 16);
    var lum = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (c) {
      c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return (0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2]) > 0.3 ? '#0D1B2A' : '#ffffff';
  };
  function setMeta(sel, value) {
    var m = document.querySelector(sel);
    if (m && value) m.setAttribute('content', value);
  }

  /* ---------------- روابط الصفحات (تحافظ على المعاينة واللغة) ---------------- */
  S.pageUrl = function (path, extra, hash) {
    var q = new URLSearchParams();
    Object.keys(extra || {}).forEach(function (k) { q.set(k, extra[k]); });
    if (params.get('lang')) q.set('lang', S.lang);
    if (S.isPreview) q.set('preview', '1');
    var s = q.toString();
    return path + (s ? '?' + s : '') + (hash ? '#' + hash : '');
  };
  S.homeUrl = function (hash) { return S.pageUrl('./', null, hash); };
  S.projectKey = function (p, i) { return p && p.slug ? String(p.slug) : String(i); };
  S.projectUrl = function (p, i) { return S.pageUrl('project', { p: S.projectKey(p, i) }); };

  /* ---------------- الوصول للمحتوى ---------------- */
  S.section = function (type) {
    return (S.content.sections || []).filter(function (s) { return s.type === type; })[0] || null;
  };
  S.visibleSections = function () {
    return (S.content.sections || []).filter(function (s) { return s.visible !== false; });
  };
  S.sectors = function () {
    var sec = S.section('sectors');
    return sec && sec.data && sec.data.items ? sec.data.items : [];
  };
  S.projects = function () {
    var sec = S.section('projects');
    return sec && sec.data && sec.data.items ? sec.data.items : [];
  };
  /** مجموعة المشروع: القطاع المرتبط به، أو التصنيف القديم */
  S.projectGroup = function (p) {
    var sector = S.sectors().filter(function (s) { return p.sector && s.id === p.sector; })[0];
    if (sector) return { key: sector.id, label: S.t(sector.title), icon: sector.icon };
    var cat = S.t(p.category);
    return cat ? { key: 'cat:' + cat, label: cat, icon: 'building' } : null;
  };

  /* ---------------- الإعدادات ---------------- */
  /** اللوجو: صورة الشعار (logoImage) + اسم الشركة، أو صورة كاملة فقط لو hideLogoText مفعّل */
  S.brandHtml = function () {
    var s = S.settings;
    var logo = S.imgSrc(s.logoImage);
    var mark = logo
      ? '<img class="brand-logo" src="' + S.esc(logo) + '" alt="" decoding="async">'
      : '<span class="brand-mark">' + icon('building') + '</span>';
    if (logo && s.hideLogoText) return mark.replace('alt=""', 'alt="' + S.te(s.siteName) + '"').replace('brand-logo', 'brand-logo brand-logo-full');
    var sub = S.t(s.logoSubtext);
    return mark + '<span class="brand-text"><b>' + S.te(s.logoText) + '</b>' + (sub ? '<small>' + S.esc(sub) + '</small>' : '') + '</span>';
  };

  function applySettings() {
    var s = S.settings;
    S.numLocale = S.lang === 'ar' && s.numerals === 'arabic' ? 'ar-EG' : 'en-US';
    var c = s.colors || {};
    var style = document.documentElement.style;
    if (c.primary) style.setProperty('--primary', c.primary);
    style.setProperty('--on-primary', S.contrastInk(c.primary));
    ['dark', 'light'].forEach(function (mode) {
      var set = c[mode] || {};
      [['background', 'bg'], ['surface', 'surface'], ['text', 'text'], ['muted', 'muted']].forEach(function (p) {
        if (set[p[0]]) style.setProperty('--' + mode + '-' + p[1], set[p[0]]);
      });
    });
    I18N.applyFonts(s.fonts);

    var seo = s.seo || {};
    document.title = S.t(seo.title) || S.t(s.siteName) || document.title;
    setMeta('meta[name="description"]', S.t(seo.description));
    setMeta('meta[property="og:title"]', S.t(seo.title) || S.t(s.siteName));
    setMeta('meta[property="og:description"]', S.t(seo.description));

    S.$('#brand').innerHTML = S.brandHtml();
    S.$('#brand').setAttribute('href', navHref('top'));
    S.$$('[data-logo-text]').forEach(function (el) { el.textContent = S.t(s.logoText); });

    var wa = S.waNumber(s.contact);
    var waEl = S.$('#waFloat');
    if (waEl && wa) {
      waEl.href = 'https://wa.me/' + wa;
      waEl.innerHTML = icon('whatsapp');
      waEl.hidden = false;
    }
  }

  function translateStatic() {
    S.$$('[data-i18n]').forEach(function (el) { el.textContent = S.T[el.getAttribute('data-i18n')] || el.textContent; });
    S.$$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', S.T[el.getAttribute('data-i18n-aria')] || ''); });
  }

  /* ---------------- اللغة والثيم ---------------- */
  function initLangSwitch() {
    var btn = S.$('#langBtn');
    if (!btn || S.settings.showLangSwitch === false) return;
    var other = S.lang === 'ar' ? 'en' : 'ar';
    btn.hidden = false;
    btn.textContent = I18N.LANGS[other].short;
    btn.setAttribute('lang', other);
    btn.setAttribute('aria-label', S.T.switchLang);
    btn.title = I18N.LANGS[other].name;
    btn.addEventListener('click', function () {
      I18N.store(I18N.PREF.lang, other);
      saveScroll();
      var url = new URL(location.href);
      url.searchParams.set('lang', other);
      url.hash = '';
      location.href = url.toString();
    });
  }

  function syncThemeUi() {
    var eff = I18N.effectiveTheme();
    var btn = S.$('#themeBtn');
    btn.classList.toggle('theme-dark', eff === 'dark');
    btn.classList.toggle('theme-light', eff === 'light');
    btn.setAttribute('aria-label', eff === 'dark' ? S.T.themeToLight : S.T.themeToDark);
    btn.title = btn.getAttribute('aria-label');
    var c = S.settings.colors || {};
    setMeta('meta[name="theme-color"]', ((eff === 'dark' ? c.dark : c.light) || {}).background);
  }

  function initThemeSwitch() {
    I18N.applyTheme(I18N.resolveTheme(S.settings.defaultTheme || 'dark'));
    syncThemeUi();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeUi);
    if (S.settings.showThemeSwitch === false) return;
    var btn = S.$('#themeBtn');
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var next = I18N.effectiveTheme() === 'dark' ? 'light' : 'dark';
      I18N.store(I18N.PREF.theme, next);
      I18N.applyTheme(next);
      syncThemeUi();
    });
  }

  /* ---------------- الهيدر والفوتر ---------------- */
  function navHref(id) { return S.isHome ? '#' + id : S.homeUrl(id); }

  function renderNav() {
    S.$('#navList').innerHTML = S.visibleSections().map(function (s) {
      return '<li><a href="' + S.esc(navHref(s.id)) + '">' + S.te(s.label) + '</a></li>';
    }).join('');
  }

  function renderFooter() {
    var s = S.settings;
    var c = s.contact || {};
    var so = s.social || {};
    var socials = ['facebook', 'instagram', 'linkedin', 'x', 'youtube'].filter(function (k) { return so[k]; }).map(function (k) {
      var href = S.safeUrl(so[k]);
      return '<a href="' + S.esc(href) + '"' + S.linkAttrs(href) + ' aria-label="' + k + '">' + icon(k) + '</a>';
    }).join('');
    var links = S.visibleSections().map(function (x) {
      return '<li><a href="' + S.esc(navHref(x.id)) + '">' + S.te(x.label) + '</a></li>';
    }).join('');
    var contact = [
      c.phone && '<li>' + icon('phone') + '<span class="ltr">' + S.esc(c.phone) + '</span></li>',
      c.email && '<li>' + icon('mail') + S.esc(c.email) + '</li>',
      S.t(c.address) && '<li>' + icon('pin') + S.te(c.address) + '</li>'
    ].filter(Boolean).join('');
    S.$('#footer').innerHTML =
      '<div class="footer-hazard" aria-hidden="true"></div>' +
      '<div class="footer-grid">' +
      '<div><a class="brand footer-brand" href="' + S.esc(navHref('top')) + '">' +
      (S.imgSrc(s.logoFull) ? '<img class="footer-logo" src="' + S.esc(S.imgSrc(s.logoFull)) + '" alt="' + S.te(s.siteName) + '" loading="lazy" decoding="async">' : S.brandHtml()) +
      '</a><p>' + S.te(s.tagline) + '</p>' +
      (socials ? '<div class="socials">' + socials + '</div>' : '') + '</div>' +
      '<div><h4>' + S.esc(S.T.quickLinks) + '</h4><ul class="footer-links">' + links + '</ul></div>' +
      '<div><h4>' + S.esc(S.T.contactUs) + '</h4><ul class="footer-contact">' + contact + '</ul></div>' +
      '</div>' +
      '<div class="footer-bottom"><span>© ' + S.fmt(new Date().getFullYear()).replace(/[,٬]/g, '') + ' ' + S.te(s.siteName) + '. ' + S.te(s.footerText) + '</span></div>';
  }

  function initHeader() {
    var header = S.$('#siteHeader');
    var bar = S.$('#scrollProgress');
    var ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('is-scrolled', y > 20);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    var toggle = S.$('#navToggle');
    var nav = S.$('#mainNav');
    function setMenu(state) {
      nav.classList.toggle('is-open', state);
      header.classList.toggle('menu-open', state);
      toggle.setAttribute('aria-expanded', String(state));
    }
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

    // تمرير ناعم للروابط الداخلية (بدون scroll-behavior في CSS حتى لا يفسد ScrollTrigger)
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      var target = id === 'top' ? document.body : document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      S.scrollToEl(id === 'top' ? null : target);
      try { history.replaceState(null, '', '#' + id); } catch (err) { /* ignore */ }
    });

    if (S.isHome && 'IntersectionObserver' in window) {
      var links = S.$$('#navList a');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      S.$$('#main > section').forEach(function (s) { io.observe(s); });
    }
  }

  S.scrollToEl = function (el) {
    var behavior = S.reduceMotion ? 'auto' : 'smooth';
    if (!el) window.scrollTo({ top: 0, behavior: behavior });
    else el.scrollIntoView({ behavior: behavior, block: 'start' });
  };

  /* ---------------- ظهور العناصر (بدون GSAP) ---------------- */
  S.observeReveal = function (root) {
    var els = S.$$('[data-reveal]', root);
    if (S.reduceMotion || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('is-in');
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  };

  /* ---------------- المعاينة واسترجاع التمرير ---------------- */
  function saveScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    try { sessionStorage.setItem(SCROLL_KEY, String(max > 0 ? window.scrollY / max : 0)); } catch (e) { /* ignore */ }
  }
  function initPreview() {
    if (!S.isPreview) return;
    var banner = S.$('#previewBanner');
    if (banner) banner.hidden = false;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.addEventListener('pagehide', saveScroll);
    var reloadT;
    window.addEventListener('storage', function (e) {
      if (e.key === ContentStore.keys.draft || e.key === ContentStore.keys.published) {
        clearTimeout(reloadT);
        reloadT = setTimeout(function () { location.reload(); }, 350);
      }
    });
  }
  S.restoreScroll = function () {
    var ratio = null;
    try {
      ratio = sessionStorage.getItem(SCROLL_KEY);
      sessionStorage.removeItem(SCROLL_KEY);
    } catch (e) { /* ignore */ }
    if (ratio === null) return false;
    window.scrollTo(0, (+ratio || 0) * (document.documentElement.scrollHeight - window.innerHeight));
    return true;
  };

  /**
   * تشغيل الصفحة
   * opts.home: هل هذه الصفحة الرئيسية
   * opts.render(): ترسم محتوى الصفحة وترجع Promise أو لا شيء
   */
  S.boot = function (opts) {
    S.isHome = !!opts.home;
    initPreview();
    return ContentStore.load({ draft: S.isPreview }).then(function (data) {
      S.content = data;
      S.settings = data.settings || {};
      S.lang = I18N.resolveLang(S.settings.defaultLang);
      S.T = I18N.UI[S.lang];
      I18N.setDocLang(S.lang);
      applySettings();
      translateStatic();
      renderNav();
      renderFooter();
      opts.render();
      initLangSwitch();
      initThemeSwitch();
      initHeader();
      document.body.classList.remove('is-loading');
      if (opts.after) opts.after();
    }).catch(function (err) {
      console.error(err);
      S.lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
      S.T = I18N.UI[S.lang];
      S.$('#main').innerHTML = '<div class="load-error"><h2>' + S.esc(S.T.loadErrTitle) + '</h2><p>' + S.esc(S.T.loadErrText) + '</p></div>';
      document.body.classList.remove('is-loading');
    });
  };

  global.Site = S;
})(window);
