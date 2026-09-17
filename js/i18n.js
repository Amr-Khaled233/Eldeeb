/* =========================================================
   اللغات والخطوط والثيم (مشترك بين الموقع ولوحة التحكم)
   ========================================================= */
(function (global) {
  'use strict';

  var LANGS = { ar: { name: 'العربية', short: 'ع', dir: 'rtl' }, en: { name: 'English', short: 'EN', dir: 'ltr' } };

  // الخطوط المتاحة في لوحة التحكم مع الأوزان المدعومة على Google Fonts
  var FONTS = {
    'IBM Plex Sans Arabic': { weights: '400;500;600;700', script: 'ar' },
    'Cairo': { weights: '400;600;700;800', script: 'ar' },
    'Tajawal': { weights: '400;500;700;800', script: 'ar' },
    'Almarai': { weights: '400;700;800', script: 'ar' },
    'Noto Kufi Arabic': { weights: '400;500;600;700;800', script: 'ar' },
    'Readex Pro': { weights: '400;500;600;700', script: 'ar' },
    'Montserrat': { weights: '400;500;600;700;800', script: 'en' },
    'Inter': { weights: '400;500;600;700;800', script: 'en' },
    'Manrope': { weights: '400;500;600;700;800', script: 'en' },
    'Poppins': { weights: '400;500;600;700;800', script: 'en' }
  };
  // الخطوط المحمّلة مسبقًا في <head>
  var PRELOADED = ['IBM Plex Sans Arabic', 'Montserrat'];

  var UI = {
    ar: {
      skip: 'تخطي إلى المحتوى', home: 'الصفحة الرئيسية', menu: 'القائمة', mainNav: 'التنقل الرئيسي',
      preview: 'وضع المعاينة: هذه نسخة غير منشورة',
      stageLabel: 'مرحلة التنفيذ', floors: 'الطوابق:', done: '✓ اكتمل البناء',
      phases: ['تجهيز الموقع والحفر', 'صب الأساسات', 'الهيكل الخرساني', 'الواجهات الزجاجية', 'التاج والسطح', 'الإضاءة وتنسيق الموقع', 'اكتمل المشروع'],
      scrollCue: 'انزل لتشاهد مراحل البناء',
      all: 'الكل', filterLabel: 'تصفية المشاريع', viewProject: 'عرض التفاصيل',
      examples: 'أمثلة على ما نقدمه', sectorProjects: 'مشاريع هذا المجال', projectsCount: '{n} مشروع',
      prev: 'السابق', next: 'التالي', slide: 'الشريحة', rating: 'التقييم {n} من 5', testimonials: 'آراء العملاء',
      callUs: 'اتصل بنا', whatsapp: 'واتساب', email: 'البريد الإلكتروني', address: 'العنوان', hours: 'مواعيد العمل',
      mapTitle: 'موقعنا على الخريطة', chatWhatsapp: 'راسلنا على واتساب', callNow: 'اتصل الآن', sendEmail: 'أرسل بريدًا',
      quickLinks: 'روابط سريعة', contactUs: 'تواصل معنا', close: 'إغلاق', waFloat: 'تواصل عبر واتساب',
      themeToDark: 'التبديل إلى الوضع الداكن', themeToLight: 'التبديل إلى الوضع الفاتح', switchLang: 'Switch to English',
      /* صفحة المشروع */
      projects: 'المشاريع', backToProjects: 'كل المشاريع', aboutProject: 'عن المشروع', scope: 'نطاق العمل',
      gallery: 'معرض الصور', client: 'العميل', area: 'المساحة', duration: 'مدة التنفيذ', status: 'الحالة',
      location: 'الموقع', year: 'السنة', sector: 'المجال', photoOf: 'صورة {i} من {n}',
      similarTitle: 'عندك مشروع مشابه؟', similarText: 'تواصل معنا وسنساعدك في كل خطوة من الفكرة حتى التسليم.',
      prevProject: 'المشروع السابق', nextProject: 'المشروع التالي',
      notFound: 'المشروع غير موجود', notFoundText: 'ربما تم حذفه أو تغيير رابطه.',
      loadErrTitle: 'تعذر تحميل المحتوى',
      loadErrText: 'تأكد من تشغيل الموقع عبر خادم (وليس بفتح الملف مباشرة) ومن وجود data.json.'
    },
    en: {
      skip: 'Skip to content', home: 'Home', menu: 'Menu', mainNav: 'Main navigation',
      preview: 'Preview mode: unpublished draft',
      stageLabel: 'Construction stage', floors: 'Floors:', done: '✓ Build complete',
      phases: ['Site preparation and excavation', 'Pouring foundations', 'Concrete structure', 'Glass facades', 'Crown and roof', 'Lighting and landscaping', 'Project complete'],
      scrollCue: 'Scroll to watch the build',
      all: 'All', filterLabel: 'Filter projects', viewProject: 'View details',
      examples: 'Examples of what we deliver', sectorProjects: 'Projects in this sector', projectsCount: '{n} projects',
      prev: 'Previous', next: 'Next', slide: 'Slide', rating: 'Rated {n} out of 5', testimonials: 'Client testimonials',
      callUs: 'Call us', whatsapp: 'WhatsApp', email: 'Email', address: 'Address', hours: 'Working hours',
      mapTitle: 'Our location on the map', chatWhatsapp: 'Chat on WhatsApp', callNow: 'Call now', sendEmail: 'Send an email',
      quickLinks: 'Quick links', contactUs: 'Contact us', close: 'Close', waFloat: 'Chat on WhatsApp',
      themeToDark: 'Switch to dark mode', themeToLight: 'Switch to light mode', switchLang: 'التبديل إلى العربية',
      projects: 'Projects', backToProjects: 'All projects', aboutProject: 'About the project', scope: 'Scope of work',
      gallery: 'Photo gallery', client: 'Client', area: 'Area', duration: 'Duration', status: 'Status',
      location: 'Location', year: 'Year', sector: 'Sector', photoOf: 'Photo {i} of {n}',
      similarTitle: 'Have a similar project?', similarText: 'Get in touch and we will support you at every step, from idea to handover.',
      prevProject: 'Previous project', nextProject: 'Next project',
      notFound: 'Project not found', notFoundText: 'It may have been removed or its link changed.',
      loadErrTitle: 'Could not load content',
      loadErrText: 'Make sure the site is served from a web server (not opened as a file) and that data.json exists.'
    }
  };

  var PREF = { lang: 'bc:lang', theme: 'bc:theme' };

  function store(k, v) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }
  function read(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  /** النص باللغة المطلوبة، مع الرجوع للغة الأخرى لو فارغ */
  function tr(v, lang) {
    if (v == null) return '';
    if (typeof v !== 'object') return String(v);
    var other = lang === 'ar' ? 'en' : 'ar';
    return v[lang] != null && v[lang] !== '' ? String(v[lang]) : (v[other] != null ? String(v[other]) : '');
  }

  function fontHref(names) {
    var fams = names.filter(function (n, i) { return FONTS[n] && names.indexOf(n) === i; }).map(function (n) {
      return 'family=' + n.replace(/ /g, '+') + ':wght@' + FONTS[n].weights;
    });
    return fams.length ? 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap' : '';
  }

  function applyFonts(fonts) {
    fonts = fonts || {};
    var ar = FONTS[fonts.ar] ? fonts.ar : 'IBM Plex Sans Arabic';
    var en = FONTS[fonts.en] ? fonts.en : 'Montserrat';
    var href = fontHref([ar, en].filter(function (n) { return PRELOADED.indexOf(n) < 0; }));
    var link = document.getElementById('dynFonts');
    if (href) {
      if (!link) {
        link = document.createElement('link');
        link.id = 'dynFonts';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      if (link.getAttribute('href') !== href) link.href = href;
    }
    var st = document.documentElement.style;
    st.setProperty('--font-ar', "'" + ar + "'");
    st.setProperty('--font-en', "'" + en + "'");
  }

  function resolveLang(defaultLang) {
    var q = new URLSearchParams(location.search).get('lang');
    if (LANGS[q]) return q;
    var saved = read(PREF.lang);
    if (LANGS[saved]) return saved;
    return LANGS[defaultLang] ? defaultLang : 'ar';
  }
  function setDocLang(lang) {
    var d = document.documentElement;
    d.lang = lang;
    d.dir = LANGS[lang].dir;
  }

  /** الثيم: 'dark' | 'light' | 'system' */
  function resolveTheme(defaultTheme) {
    var saved = read(PREF.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    return defaultTheme || 'dark';
  }
  function applyTheme(theme) {
    var d = document.documentElement;
    if (theme === 'dark' || theme === 'light') d.setAttribute('data-theme', theme);
    else d.removeAttribute('data-theme');
  }
  function effectiveTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  global.I18N = {
    LANGS: LANGS, FONTS: FONTS, UI: UI, PREF: PREF,
    tr: tr, store: store, read: read,
    applyFonts: applyFonts, resolveLang: resolveLang, setDocLang: setDocLang,
    resolveTheme: resolveTheme, applyTheme: applyTheme, effectiveTheme: effectiveTheme
  };
})(window);
