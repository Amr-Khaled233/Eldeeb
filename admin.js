/* =========================================================
   لوحة التحكم: تحرير المحتوى بدون كود
   كل الحفظ والقراءة عبر ContentStore (js/store.js)
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var cfg = ContentStore.config;
  var HASH_KEY = cfg.storagePrefix + ':admin:hash';
  var SESSION_KEY = cfg.storagePrefix + ':admin:session';
  var THEME_KEY = 'bc:admin-theme';

  var state = {
    data: null,
    publishedJson: '',
    view: 'sections',
    open: {},          // عناصر القوائم المفتوحة
    lists: {},         // مسار القائمة ← تعريفها
    previewLang: 'ar',
    device: 'desktop'
  };

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function ar(v) { return I18N.tr(v, 'ar'); }
  function strip(d) { var c = clone(d); delete c.updatedAt; return JSON.stringify(c); }
  function debounce(fn, ms) {
    var t;
    return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); };
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var keys = path.split('.');
    var o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = keys[i];
      var nextIsLang = (keys[i + 1] === 'ar' || keys[i + 1] === 'en') && i + 1 === keys.length - 1;
      if (o[k] == null || typeof o[k] !== 'object') {
        // تحويل نص قديم غير مترجم إلى {ar, en}
        o[k] = nextIsLang ? { ar: o[k] == null ? '' : String(o[k]), en: '' } : {};
      }
      o = o[k];
    }
    o[keys[keys.length - 1]] = value;
  }
  function toast(msg, isErr) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { el.className = 'toast'; }, 3200);
  }
  function sha256(text) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('insecure'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* ---------------- Schemas ---------------- */
  function L(key, label, type, extra) { return Object.assign({ key: key, label: label, type: type || 'text', i18n: true }, extra || {}); }
  function F(key, label, type, extra) { return Object.assign({ key: key, label: label, type: type || 'text' }, extra || {}); }
  var LINK_HINT = 'مثال: ‎#contact‎ لقسم في الصفحة، أو رابط كامل ‎https://...';
  var BUTTON_FIELDS = [L('label', 'نص الزر'), F('href', 'الرابط', 'text', { dir: 'ltr', hint: LINK_HINT })];
  var HEAD_FIELDS = [
    L('eyebrow', 'عنوان صغير (مرحلة البناء)', 'text', { hint: 'يظهر فوق عنوان القسم بجانب رقم المرحلة' }),
    L('title', 'عنوان القسم')
  ];

  var TYPES = {
    hero: {
      name: 'الواجهة الرئيسية', icon: 'home', desc: 'أول ما يراه الزائر: العنوان والأزرار.',
      fields: [
        L('eyebrow', 'السطر العلوي الصغير'),
        L('title', 'العنوان الرئيسي'),
        L('highlight', 'الجزء الملوّن من العنوان'),
        L('subtitle', 'الوصف', 'textarea'),
        F('image', 'صورة خلفية خفيفة (اختياري)', 'image', { maxW: 1920 }),
        F('buttons', 'الأزرار', 'list', {
          item: 'زر', titleKey: 'label', fields: BUTTON_FIELDS.concat([F('style', 'شكل الزر', 'select', { options: [['primary', 'أساسي (ملوّن)'], ['ghost', 'ثانوي (شفاف)']] })]),
          template: { label: { ar: 'زر جديد', en: 'New button' }, href: '#contact', style: 'primary' }
        }),
        F('badges', 'شارات الثقة', 'list', { item: 'شارة', titleKey: 'text', fields: [L('text', 'النص')], template: { text: { ar: '', en: '' } } })
      ]
    },
    about: {
      name: 'من نحن', icon: 'building', desc: 'تعريف بالشركة وخبرتها.',
      fields: HEAD_FIELDS.concat([
        L('text', 'النص', 'textarea', { rows: 7, hint: 'اترك سطرًا فارغًا بين الفقرات' }),
        F('image', 'الصورة', 'image', { maxW: 1200 }),
        F('experienceValue', 'رقم شارة الخبرة', 'text', { dir: 'ltr', hint: 'مثال: 18+' }),
        L('experienceLabel', 'نص شارة الخبرة'),
        F('features', 'المميزات', 'list', { item: 'ميزة', titleKey: 'text', fields: [L('text', 'النص')], template: { text: { ar: '', en: '' } } }),
        F('button', 'زر القسم', 'group', { fields: BUTTON_FIELDS, hint: 'اترك النص فارغًا لإخفاء الزر' })
      ])
    },
    sectors: {
      name: 'مجالات العمل', icon: 'factory', desc: 'القطاعات التي تعمل بها مع أمثلة لما تقدمه في كل قطاع.',
      fields: HEAD_FIELDS.concat([
        L('subtitle', 'وصف القسم', 'textarea', { rows: 2 }),
        F('items', 'المجالات', 'list', {
          item: 'مجال', titleKey: 'title',
          fields: [
            F('id', 'المعرّف (بالإنجليزي)', 'text', { dir: 'ltr', hint: 'يستخدم لربط المشاريع بهذا المجال. حروف إنجليزية صغيرة بدون مسافات. يتولد تلقائيًا لو تركته فارغًا.' }),
            F('icon', 'الأيقونة', 'icon'),
            L('title', 'اسم المجال'),
            L('text', 'وصف مختصر', 'textarea', { rows: 2 }),
            F('image', 'صورة المجال', 'image', { maxW: 1200 }),
            F('examples', 'أمثلة على ما تقدمه', 'list', { item: 'مثال', titleKey: 'text', fields: [L('text', 'المثال')], template: { text: { ar: '', en: '' } } })
          ],
          template: { id: '', icon: 'building', title: { ar: 'مجال جديد', en: 'New sector' }, text: { ar: '', en: '' }, image: '', examples: [] }
        })
      ])
    },
    services: {
      name: 'الخدمات', icon: 'tools', desc: 'بطاقات الخدمات مع الأيقونات.',
      fields: HEAD_FIELDS.concat([
        L('subtitle', 'وصف القسم', 'textarea', { rows: 2 }),
        F('items', 'الخدمات', 'list', {
          item: 'خدمة', titleKey: 'title',
          fields: [
            F('icon', 'الأيقونة', 'icon'), L('title', 'اسم الخدمة'), L('text', 'الوصف', 'textarea', { rows: 3 }),
            F('points', 'نقاط تفصيلية', 'list', { item: 'نقطة', titleKey: 'text', fields: [L('text', 'النص')], template: { text: { ar: '', en: '' } } })
          ],
          template: { icon: 'building', title: { ar: 'خدمة جديدة', en: 'New service' }, text: { ar: '', en: '' }, points: [] }
        })
      ])
    },
    projects: {
      name: 'المشاريع', icon: 'layers', desc: 'كل مشروع له صفحة خاصة فيها التفاصيل ومعرض الصور.',
      fields: HEAD_FIELDS.concat([
        L('subtitle', 'وصف القسم', 'textarea', { rows: 2 }),
        F('items', 'المشاريع', 'list', {
          item: 'مشروع', titleKey: 'title',
          fields: [
            F('projectPage', '', 'projectLink'),
            L('title', 'اسم المشروع'),
            F('slug', 'رابط الصفحة (بالإنجليزي)', 'text', { dir: 'ltr', hint: 'يظهر في الرابط: project?p=... يتولد تلقائيًا من الاسم الإنجليزي لو تركته فارغًا.' }),
            F('sector', 'المجال', 'select', { options: sectorOptions, hint: 'يحدد زر التصفية الذي يظهر فيه المشروع' }),
            L('location', 'الموقع'),
            F('year', 'السنة', 'text', { dir: 'ltr' }),
            L('client', 'العميل'),
            L('area', 'المساحة'),
            L('duration', 'مدة التنفيذ'),
            L('status', 'الحالة'),
            F('image', 'صورة الغلاف', 'image', { maxW: 1600 }),
            L('description', 'وصف مختصر (يظهر في الكارت)', 'textarea', { rows: 2 }),
            L('details', 'تفاصيل المشروع (صفحة المشروع)', 'textarea', { rows: 6, hint: 'اترك سطرًا فارغًا بين الفقرات' }),
            F('scope', 'نطاق العمل', 'list', { item: 'بند', titleKey: 'text', fields: [L('text', 'البند')], template: { text: { ar: '', en: '' } } }),
            F('gallery', 'معرض الصور', 'list', {
              item: 'صورة', titleKey: 'caption', hint: 'للصور الكثيرة: ارفعها في assets/images واكتب مسارها بدل الرفع المباشر',
              fields: [F('image', 'الصورة', 'image', { maxW: 1600 }), L('caption', 'وصف الصورة')],
              template: { image: '', caption: { ar: '', en: '' } }
            })
          ],
          template: {
            slug: '', sector: '', title: { ar: 'مشروع جديد', en: 'New project' }, location: { ar: '', en: '' }, year: String(new Date().getFullYear()),
            client: { ar: '', en: '' }, area: { ar: '', en: '' }, duration: { ar: '', en: '' }, status: { ar: 'مكتمل', en: 'Completed' },
            image: '', description: { ar: '', en: '' }, details: { ar: '', en: '' }, scope: [], gallery: []
          }
        })
      ])
    },
    stats: {
      name: 'الأرقام والإنجازات', icon: 'calc', desc: 'عدادات متحركة تظهر عند الوصول للقسم.',
      fields: HEAD_FIELDS.concat([
        F('items', 'الأرقام', 'list', {
          item: 'رقم', titleKey: 'label',
          fields: [
            F('value', 'الرقم', 'number', { hint: 'يمكن استخدام كسور مثل 1.2' }),
            L('suffix', 'اللاحقة', 'text', { hint: 'مثل: + أو % أو M م²' }),
            L('label', 'الوصف')
          ],
          template: { value: 100, suffix: { ar: '+', en: '+' }, label: { ar: '', en: '' } }
        })
      ])
    },
    testimonials: {
      name: 'آراء العملاء', icon: 'quote', desc: 'سلايدر آراء العملاء مع التقييم.',
      fields: HEAD_FIELDS.concat([
        F('items', 'الآراء', 'list', {
          item: 'رأي', titleKey: 'name',
          fields: [
            L('name', 'اسم العميل'),
            L('role', 'الوظيفة / الشركة'),
            L('text', 'الرأي', 'textarea', { rows: 3 }),
            F('rating', 'التقييم', 'select', { options: [[5, '★★★★★ (5)'], [4, '★★★★ (4)'], [3, '★★★ (3)'], [2, '★★ (2)'], [1, '★ (1)'], [0, 'بدون تقييم']], numeric: true }),
            F('avatar', 'صورة العميل (اختياري)', 'image', { maxW: 240, square: true })
          ],
          template: { name: { ar: 'عميل جديد', en: 'New client' }, role: { ar: '', en: '' }, text: { ar: '', en: '' }, rating: 5, avatar: '' }
        })
      ])
    },
    contact: {
      name: 'تواصل معنا', icon: 'mail', desc: 'بطاقات التواصل وأزرار واتساب والاتصال. البيانات نفسها من "الإعدادات العامة".',
      fields: HEAD_FIELDS.concat([
        L('subtitle', 'وصف القسم', 'textarea', { rows: 2 })
      ])
    }
  };

  function sectorOptions() {
    var sec = state.data.sections.filter(function (s) { return s.type === 'sectors'; })[0];
    var items = sec && sec.data && sec.data.items ? sec.data.items : [];
    return [['', 'بدون مجال']].concat(items.filter(function (s) { return s.id; }).map(function (s) { return [s.id, ar(s.title)]; }));
  }

  function slugify(v) {
    return String(v || '').toLowerCase().trim()
      .replace(/[^a-z0-9؀-ۿ]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }
  function uniqueSlugs(items, key, source) {
    var used = {};
    items.forEach(function (it, i) {
      var base = slugify(it[key]) || slugify(it[source] && (it[source].en || it[source].ar)) || 'item-' + (i + 1);
      var s = base, n = 2;
      while (used[s]) s = base + '-' + n++;
      used[s] = true;
      it[key] = s;
    });
  }
  /** قبل الحفظ: توليد المعرّفات والروابط الناقصة ومنع التكرار */
  function prepare(data) {
    data.sections.forEach(function (s) {
      if (!s.data || !Array.isArray(s.data.items)) return;
      if (s.type === 'sectors') uniqueSlugs(s.data.items, 'id', 'title');
      if (s.type === 'projects') uniqueSlugs(s.data.items, 'slug', 'title');
    });
    return data;
  }

  var FONT_OPTS = function (script) {
    return Object.keys(I18N.FONTS).filter(function (n) { return I18N.FONTS[n].script === script || script === 'any'; })
      .map(function (n) { return [n, n]; });
  };
  var COLOR_SET = function () {
    return [F('background', 'الخلفية', 'color'), F('surface', 'البطاقات', 'color'), F('text', 'النص', 'color'), F('muted', 'النص الثانوي', 'color')];
  };

  var SETTINGS_CARDS = [
    {
      title: 'الهوية', icon: 'building', desc: 'اسم الشركة واللوجو.',
      fields: [
        L('siteName', 'اسم الشركة الكامل'),
        L('logoText', 'اسم اللوجو (نص)'),
        L('logoSubtext', 'السطر الصغير تحت اللوجو'),
        F('logoImage', 'شعار الهيدر', 'image', { maxW: 600, keepAlpha: true, contain: true, hint: 'يفضل صورة شفافة الخلفية (PNG أو WebP)' }),
        F('hideLogoText', 'إخفاء اسم الشركة بجانب الشعار', 'toggle', { off: true }),
        F('logoFull', 'اللوجو الكامل (الفوتر)', 'image', { maxW: 800, keepAlpha: true, contain: true }),
        L('tagline', 'نبذة قصيرة (الفوتر)', 'textarea', { rows: 2 })
      ]
    },
    {
      title: 'اللغة والمظهر', icon: 'settings', desc: 'اللغة والوضع الافتراضي والخطوط.',
      cols: 2,
      fields: [
        F('defaultLang', 'اللغة الافتراضية', 'select', { options: [['ar', 'العربية'], ['en', 'English']] }),
        F('showLangSwitch', 'إظهار زر تبديل اللغة', 'toggle'),
        F('defaultTheme', 'الوضع الافتراضي', 'select', { options: [['dark', 'داكن'], ['light', 'فاتح'], ['system', 'حسب جهاز الزائر']] }),
        F('showThemeSwitch', 'إظهار زر الداكن/الفاتح', 'toggle'),
        F('fonts.ar', 'خط اللغة العربية', 'select', { options: FONT_OPTS('ar'), hint: 'IBM Plex Sans Arabic هو الأوضح للقراءة' }),
        F('fonts.en', 'خط اللغة الإنجليزية', 'select', { options: FONT_OPTS('any') }),
        F('numerals', 'شكل الأرقام في النسخة العربية', 'select', { options: [['latin', '123 (لاتينية)'], ['arabic', '١٢٣ (هندية)']] })
      ]
    },
    {
      title: 'الألوان', icon: 'paint', desc: 'اللون الأساسي مشترك، ولكل وضع ألوانه الخاصة.',
      id: 'colors',
      fields: [
        F('colors.primary', 'اللون الأساسي', 'color', { presets: ['#C89D2A', '#D4A937', '#B8891F', '#E0B64A', '#F59E0B', '#8D959E'] }),
        F('colors.dark', 'الوضع الداكن', 'group', { fields: COLOR_SET(), cols: 2 }),
        F('colors.light', 'الوضع الفاتح', 'group', { fields: COLOR_SET(), cols: 2 })
      ]
    },
    {
      title: 'بيانات التواصل', icon: 'phone', desc: 'تظهر في قسم التواصل والفوتر وزر واتساب.',
      cols: 2,
      fields: [
        F('contact.phone', 'رقم الهاتف', 'text', { dir: 'ltr' }),
        F('contact.whatsapp', 'رقم واتساب (بالكود الدولي بدون +)', 'text', { dir: 'ltr', hint: 'مثال: 201000000000. اتركه فارغًا لإخفاء زر واتساب' }),
        F('contact.email', 'البريد الإلكتروني', 'text', { dir: 'ltr' }),
        F('contact.mapEmbed', 'رابط تضمين خريطة Google (اختياري)', 'text', { dir: 'ltr', hint: 'من Google Maps: مشاركة ← تضمين خريطة ← انسخ قيمة src فقط' }),
        L('contact.address', 'العنوان'),
        L('contact.hours', 'مواعيد العمل')
      ]
    },
    {
      title: 'السوشيال ميديا', icon: 'instagram', desc: 'اترك الحقل فارغًا لإخفاء الأيقونة.',
      cols: 2,
      fields: [
        F('social.facebook', 'Facebook', 'text', { dir: 'ltr' }),
        F('social.instagram', 'Instagram', 'text', { dir: 'ltr' }),
        F('social.linkedin', 'LinkedIn', 'text', { dir: 'ltr' }),
        F('social.x', 'X (Twitter)', 'text', { dir: 'ltr' }),
        F('social.youtube', 'YouTube', 'text', { dir: 'ltr' })
      ]
    },
    {
      title: 'محركات البحث والفوتر', icon: 'external', desc: 'العنوان والوصف الظاهران في نتائج البحث.',
      fields: [
        L('seo.title', 'عنوان الصفحة (Title)'),
        L('seo.description', 'الوصف (Meta description)', 'textarea', { rows: 2 }),
        L('footerText', 'نص حقوق النشر')
      ]
    }
  ];

  /* ---------------- Field rendering ---------------- */
  function fid(path) { return 'f-' + path.replace(/[^\w]/g, '-'); }
  function hint(f) { return f.hint ? '<small class="hint">' + esc(f.hint) + '</small>' : ''; }

  function renderFields(fields, base, cols) {
    return '<div class="fields' + (cols === 2 ? ' cols-2' : '') + '">' +
      fields.map(function (f) { return renderField(f, base + '.' + f.key); }).join('') + '</div>';
  }

  function textControl(f, path, value, dir, cls) {
    var attrs = ' data-path="' + esc(path) + '" dir="' + dir + '"' + (cls ? ' class="' + cls + '"' : '');
    if (f.type === 'textarea') return '<textarea' + attrs + ' rows="' + (f.rows || 4) + '">' + esc(value) + '</textarea>';
    var type = f.type === 'number' ? 'number' : 'text';
    return '<input type="' + type + '"' + attrs + (f.type === 'number' ? ' step="any" data-kind="number"' : '') + ' value="' + esc(value) + '">';
  }

  function renderField(f, path) {
    var value = getPath(state.data, path);
    var id = fid(path);
    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'number': {
        if (f.i18n) {
          var v = value && typeof value === 'object' ? value : { ar: value == null ? '' : value, en: '' };
          var pair = ['ar', 'en'].map(function (lg) {
            var val = v[lg] == null ? '' : v[lg];
            return '<div class="i18n-input ' + lg + (val === '' ? ' is-empty' : '') + '">' +
              '<span class="lang-tag">' + (lg === 'ar' ? 'AR' : 'EN') + '</span>' +
              textControl(f, path + '.' + lg, val, lg === 'ar' ? 'rtl' : 'ltr') + '</div>';
          }).join('');
          return '<div class="field"><span class="field-label">' + esc(f.label) + '</span><div class="i18n-pair">' + pair + '</div>' + hint(f) + '</div>';
        }
        return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' +
          textControl(f, path, value == null ? '' : value, f.dir || 'auto').replace('<input ', '<input id="' + id + '" ').replace('<textarea ', '<textarea id="' + id + '" ') +
          hint(f) + '</div>';
      }
      case 'select': {
        var list = typeof f.options === 'function' ? f.options() : f.options;
        if (value && !list.some(function (o) { return String(o[0]) === String(value); })) list = list.concat([[value, value]]);
        var opts = list.map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
        }).join('');
        return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>' +
          '<select id="' + id + '" data-path="' + esc(path) + '"' + (f.numeric ? ' data-kind="number"' : '') + '>' + opts + '</select>' + hint(f) + '</div>';
      }
      case 'toggle':
        return '<div class="field"><span class="field-label">&nbsp;</span><label class="switch"><input type="checkbox" data-path="' + esc(path) + '" data-kind="bool"' +
          ((f.off ? value === true : value !== false) ? ' checked' : '') + '><span class="track"></span>' + esc(f.label) + '</label>' + hint(f) + '</div>';
      case 'projectLink': {
        var m = /^(sections\.\d+\.data\.items)\.(\d+)\./.exec(path);
        return '<div class="field"><button type="button" class="btn sm" data-action="preview-project" data-path="' + esc(m ? m[1] + '.' + m[2] : '') + '">' +
          icon('external') + 'معاينة صفحة المشروع</button></div>';
      }
      case 'color': {
        var c = /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000';
        var presets = f.presets ? '<div class="presets">' + f.presets.map(function (p) {
          return '<button type="button" class="preset" style="background:' + p + '" data-action="preset" data-path="' + esc(path) + '" data-value="' + p + '" title="' + p + '"></button>';
        }).join('') + '</div>' : '';
        return '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label><div class="color-row">' +
          '<input type="color" data-path="' + esc(path) + '" value="' + c + '" aria-label="' + esc(f.label) + '">' +
          '<input type="text" id="' + id + '" data-path="' + esc(path) + '" data-kind="hex" value="' + esc(value || '') + '" maxlength="7" placeholder="#RRGGBB">' +
          '</div>' + presets + hint(f) + '</div>';
      }
      case 'icon': {
        var grid = Object.keys(ICON_NAMES).map(function (n) {
          return '<label class="icon-opt"><input type="radio" name="' + id + '" data-path="' + esc(path) + '" value="' + n + '"' + (n === value ? ' checked' : '') + '>' +
            '<span>' + icon(n) + esc(ICON_NAMES[n]) + '</span></label>';
        }).join('');
        return '<div class="field"><span class="field-label">' + esc(f.label) + '</span><div class="icon-grid" role="radiogroup">' + grid + '</div></div>';
      }
      case 'image': {
        var src = value || '';
        return '<div class="field"><span class="field-label">' + esc(f.label) + '</span><div class="img-field">' +
          '<div class="img-thumb' + (f.contain ? ' contain' : '') + '">' + (src ? '<img src="' + esc(src) + '" alt="">' : 'لا توجد صورة') + '</div>' +
          '<div class="img-controls">' +
          '<input type="text" dir="ltr" data-path="' + esc(path) + '" data-kind="image" value="' + esc(src.indexOf('data:') === 0 ? '' : src) + '" placeholder="' + (src.indexOf('data:') === 0 ? 'صورة مرفوعة ✓' : 'assets/images/... أو https://...') + '">' +
          '<div class="row"><label class="btn sm file-btn">' + icon('upload') + 'رفع صورة<input type="file" accept="image/*" data-upload="' + esc(path) + '" data-maxw="' + (f.maxW || 1600) + '"' + (f.keepAlpha ? ' data-alpha="1"' : '') + (f.square ? ' data-square="1"' : '') + '></label>' +
          (src ? '<button type="button" class="btn sm danger" data-action="clear" data-path="' + esc(path) + '">' + icon('trash') + 'حذف</button>' : '') + '</div>' +
          '<small class="hint">تُضغط الصور المرفوعة وتُحوّل إلى WebP تلقائيًا (أقصى عرض ' + (f.maxW || 1600) + 'px).</small>' +
          '</div></div></div>';
      }
      case 'group':
        return '<fieldset class="group"><legend>' + esc(f.label) + '</legend>' + (f.hint ? '<p class="hint" style="margin:0 0 10px;color:var(--muted);font-size:12.5px">' + esc(f.hint) + '</p>' : '') +
          renderFields(f.fields, path, f.cols) + '</fieldset>';
      case 'list':
        return renderList(f, path, value || []);
      default:
        return '';
    }
  }

  function itemTitle(f, item, i) {
    var v = item && item[f.titleKey];
    var a = ar(v);
    var e = v && typeof v === 'object' ? v.en : '';
    if (!a) return '<span class="muted">' + esc(f.item) + ' ' + (i + 1) + '</span>';
    return '<bdi>' + esc(a) + '</bdi>' + (e && e !== a ? ' <span class="muted">· <bdi dir="ltr">' + esc(e) + '</bdi></span>' : '');
  }

  function renderList(f, path, arr) {
    state.lists[path] = f;
    var items = arr.map(function (item, i) {
      var ip = path + '.' + i;
      return '<details class="list-item" data-item="' + esc(ip) + '"' + (state.open[ip] ? ' open' : '') + '>' +
        '<summary><span class="item-num">' + (i + 1) + '</span><span class="item-title">' + itemTitle(f, item, i) + '</span>' +
        '<span class="item-actions">' +
        '<button type="button" class="icon-btn" data-action="move" data-list="' + esc(path) + '" data-index="' + i + '" data-dir="-1" title="تحريك لأعلى"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
        '<button type="button" class="icon-btn" data-action="move" data-list="' + esc(path) + '" data-index="' + i + '" data-dir="1" title="تحريك لأسفل"' + (i === arr.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
        '<button type="button" class="icon-btn" data-action="dup" data-list="' + esc(path) + '" data-index="' + i + '" title="تكرار">' + icon('layers') + '</button>' +
        '<button type="button" class="icon-btn danger" data-action="remove" data-list="' + esc(path) + '" data-index="' + i + '" title="حذف">' + icon('trash') + '</button>' +
        '</span>' + icon('down', 'chev') + '</summary>' +
        '<div class="item-body">' + renderFields(f.fields, ip) + '</div></details>';
    }).join('');
    return '<div class="list-field"><div class="list-head"><span class="field-label">' + esc(f.label) + '</span><span class="count">' + arr.length + '</span></div>' + hint(f) +
      items +
      '<button type="button" class="btn dashed" data-action="add" data-list="' + esc(path) + '">' + icon('plus') + 'إضافة ' + esc(f.item) + '</button></div>';
  }

  /* ---------------- Views ---------------- */
  function sectionIndex(id) {
    for (var i = 0; i < state.data.sections.length; i++) if (state.data.sections[i].id === id) return i;
    return -1;
  }

  var VIEWS = {
    sections: function () {
      var secs = state.data.sections;
      var items = secs.map(function (s, i) {
        var meta = TYPES[s.type] || { name: s.type, icon: 'layers' };
        var on = s.visible !== false;
        return '<li class="sort-item' + (on ? '' : ' is-off') + '" draggable="true" data-index="' + i + '">' +
          '<span class="drag" title="اسحب لإعادة الترتيب">' + icon('grip') + '</span>' +
          '<span class="sort-order">' + (i + 1) + '</span>' +
          '<span class="sort-icon">' + icon(meta.icon) + '</span>' +
          '<div class="sort-text"><b>' + esc(ar(s.label)) + '</b><small>' + esc(meta.name) + ' • <bdi dir="ltr">' + esc(I18N.tr(s.label, 'en')) + '</bdi></small></div>' +
          '<label class="switch" title="إظهار/إخفاء"><input type="checkbox" data-path="sections.' + i + '.visible" data-kind="bool"' + (on ? ' checked' : '') + ' aria-label="إظهار ' + esc(ar(s.label)) + '"><span class="track"></span></label>' +
          '<button type="button" class="icon-btn" data-action="sec-move" data-index="' + i + '" data-dir="-1" title="لأعلى"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
          '<button type="button" class="icon-btn" data-action="sec-move" data-index="' + i + '" data-dir="1" title="لأسفل"' + (i === secs.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
          '<button type="button" class="btn sm" data-action="go" data-view="section:' + esc(s.id) + '">' + icon('edit') + 'تحرير</button>' +
          '</li>';
      }).join('');
      return '<div class="card"><h2>' + icon('layers') + 'ترتيب الأقسام</h2>' +
        '<p class="card-desc">اسحب الأقسام لتغيير ترتيبها في الصفحة، واستخدم المفتاح لإظهار أو إخفاء أي قسم. قائمة التنقل تتحدث تلقائيًا.</p>' +
        '<ul class="sortable" id="sortable">' + items + '</ul></div>';
    },

    section: function (id) {
      var i = sectionIndex(id);
      if (i < 0) return '<div class="card">القسم غير موجود.</div>';
      var s = state.data.sections[i];
      var meta = TYPES[s.type];
      if (!meta) return '<div class="card">نوع قسم غير مدعوم: ' + esc(s.type) + '</div>';
      var base = 'sections.' + i;
      return '<div class="card"><h2>' + icon('settings') + 'إعدادات القسم</h2><p class="card-desc">الاسم يظهر في قائمة التنقل.</p>' +
        '<div class="fields cols-2">' + renderField(L('label', 'اسم القسم في القائمة'), base + '.label') +
        renderField(F('visible', 'إظهار القسم في الموقع', 'toggle'), base + '.visible') + '</div></div>' +
        '<div class="card"><h2>' + icon(meta.icon) + 'المحتوى</h2><p class="card-desc">' + esc(meta.desc) + ' كل نص له خانة عربي (AR) وخانة إنجليزي (EN).</p>' +
        renderFields(meta.fields, base + '.data') + '</div>';
    },

    settings: function () {
      return SETTINGS_CARDS.map(function (c) {
        return '<div class="card"><h2>' + icon(c.icon) + esc(c.title) + '</h2><p class="card-desc">' + esc(c.desc) + '</p>' +
          renderFields(c.fields, 'settings', c.cols) + '</div>';
      }).join('');
    },

    data: function () {
      var used = 0;
      try {
        for (var k in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, k)) used += (localStorage.getItem(k) || '').length + k.length;
        }
      } catch (e) { /* ignore */ }
      var usedKb = Math.round(used * 2 / 1024);
      var pct = Math.min(100, Math.round(used * 2 / (5 * 1024 * 1024) * 100));
      var isDefault = (lsGet(HASH_KEY) || cfg.adminPasswordHash) === cfg.adminPasswordHash;
      return '<div class="card"><h2>' + icon('database') + 'كيف يتم حفظ المحتوى؟</h2>' +
        '<p class="card-desc">حاليًا التعديلات تُحفظ في <b>هذا المتصفح فقط</b> (localStorage). لنشرها لكل زوار الموقع:</p>' +
        '<ol class="steps"><li>اضغط <b>تصدير data.json</b> بالأسفل.</li>' +
        '<li>استبدل ملف <code>data.json</code> في مشروعك على GitHub بالملف الجديد.</li>' +
        '<li>Vercel سيعيد النشر تلقائيًا خلال ثوانٍ، وتظهر التعديلات للجميع.</li></ol>' +
        '<p class="card-desc" style="margin:12px 0 0">لاحقًا يمكن ربط اللوحة بقاعدة بيانات (Upstash / Supabase) ليكون الحفظ فوريًا. راجع README.</p></div>' +

        '<div class="card"><h2>' + icon('download') + 'النسخ الاحتياطي</h2><div class="tools-grid">' +
        '<div class="tool"><b>' + icon('download') + 'تصدير data.json</b><p>تحميل كل المحتوى والإعدادات كملف.</p><button type="button" class="btn primary" data-action="export">تصدير الملف</button></div>' +
        '<div class="tool"><b>' + icon('upload') + 'استيراد ملف</b><p>تحميل ملف data.json سابق (يستبدل المحتوى الحالي كمسودة).</p><label class="btn file-btn">اختيار ملف<input type="file" accept="application/json,.json" id="importFile"></label></div>' +
        '<div class="tool"><b>' + icon('refresh') + 'تجاهل المسودة</b><p>الرجوع لآخر نسخة تم نشرها.</p><button type="button" class="btn" data-action="discard">تجاهل التغييرات</button></div>' +
        '<div class="tool"><b>' + icon('trash') + 'استعادة الافتراضي</b><p>حذف كل التعديلات المحفوظة في المتصفح والرجوع لمحتوى data.json.</p><button type="button" class="btn danger" data-action="reset">استعادة</button></div>' +
        '</div>' +
        '<div style="margin-top:16px" class="field"><span class="field-label">مساحة التخزين المستخدمة: ' + usedKb + ' KB من ~5 MB</span><div class="meter"><span style="width:' + pct + '%"></span></div>' +
        '<small class="hint">الصور المرفوعة تستهلك أغلب المساحة. للمواقع الكبيرة يفضل رفع الصور داخل مجلد assets/images واستخدام مسارها.</small></div></div>' +

        '<div class="card"><h2>' + icon('lock') + 'كلمة مرور اللوحة</h2>' +
        (isDefault ? '<p class="card-desc" style="color:var(--danger)">⚠ أنت تستخدم كلمة المرور الافتراضية (admin123). غيّرها الآن.</p>' : '<p class="card-desc">كلمة المرور محفوظة بشكل مشفّر (SHA-256) في هذا المتصفح.</p>') +
        '<form id="passForm" class="fields cols-2">' +
        '<label class="field"><span>كلمة المرور الجديدة</span><input type="password" id="newPass" minlength="6" required autocomplete="new-password"></label>' +
        '<label class="field"><span>تأكيد كلمة المرور</span><input type="password" id="newPass2" minlength="6" required autocomplete="new-password"></label>' +
        '<div><button class="btn primary" type="submit">تغيير كلمة المرور</button></div></form>' +
        '<p class="card-desc" style="margin:12px 0 0">ملاحظة: هذه حماية بسيطة على مستوى المتصفح. للحماية الحقيقية فعّل <b>Vercel Password Protection</b> أو اربط اللوحة بباك إند (راجع README).</p></div>';
    }
  };

  function viewMeta(view) {
    if (view.indexOf('section:') === 0) {
      var s = state.data.sections[sectionIndex(view.slice(8))];
      return { title: s ? 'قسم: ' + ar(s.label) : 'قسم', desc: s && TYPES[s.type] ? TYPES[s.type].desc : '' };
    }
    return {
      sections: { title: 'إدارة الأقسام', desc: 'الترتيب والإظهار والإخفاء' },
      settings: { title: 'الإعدادات العامة', desc: 'الهوية والألوان والخطوط وبيانات التواصل' },
      data: { title: 'البيانات والأمان', desc: 'النشر والنسخ الاحتياطي وكلمة المرور' }
    }[view] || { title: '', desc: '' };
  }

  function renderSidebar() {
    var item = function (view, ic, label, extra) {
      return '<button type="button" class="sb-item' + (state.view === view ? ' is-active' : '') + (extra || '') + '" data-action="go" data-view="' + esc(view) + '">' +
        icon(ic) + '<span class="grow">' + esc(label) + '</span></button>';
    };
    var secs = state.data.sections.map(function (s) {
      var meta = TYPES[s.type] || { icon: 'layers' };
      var off = s.visible === false;
      return '<button type="button" class="sb-item' + (state.view === 'section:' + s.id ? ' is-active' : '') + (off ? ' is-off' : '') + '" data-action="go" data-view="section:' + esc(s.id) + '">' +
        icon(meta.icon) + '<span class="grow">' + esc(ar(s.label)) + '</span>' + (off ? '<span class="eye">' + icon('eyeOff') + '</span>' : '') + '</button>';
    }).join('');
    $('#sbNav').innerHTML =
      '<div class="sb-group">عام</div>' +
      item('sections', 'layers', 'ترتيب وإظهار الأقسام') +
      item('settings', 'settings', 'الإعدادات العامة') +
      '<div class="sb-group">محتوى الأقسام</div>' + secs +
      '<div class="sb-group">النظام</div>' +
      item('data', 'database', 'البيانات والأمان');
    $('#sbSite').textContent = ar(state.data.settings.siteName);
  }

  function renderView(keepScroll) {
    var y = window.scrollY;
    state.lists = {};
    var view = state.view;
    var html = view.indexOf('section:') === 0 ? VIEWS.section(view.slice(8)) : (VIEWS[view] || VIEWS.sections)();
    $('#editor').innerHTML = html;
    var meta = viewMeta(view);
    $('#viewTitle').textContent = meta.title;
    $('#viewDesc').textContent = meta.desc;
    renderSidebar();
    if (view === 'sections') initSortable();
    if (view === 'data') initDataView();
    window.scrollTo(0, keepScroll ? y : 0);
  }

  function go(view) {
    state.view = view;
    try { history.replaceState(null, '', '#' + encodeURIComponent(view)); } catch (e) { /* ignore */ }
    $('#app').classList.remove('sb-open');
    renderView(false);
  }

  /* ---------------- Dirty / Save / Publish ---------------- */
  function isDirty() { return strip(state.data) !== state.publishedJson; }
  function updateSaveState() {
    var dirty = isDirty();
    var el = $('#saveState');
    el.classList.toggle('is-dirty', dirty);
    el.textContent = dirty ? 'تغييرات غير منشورة' : 'كل التغييرات منشورة';
  }
  var saveDraft = debounce(function () {
    ContentStore.saveDraft(state.data).catch(function (e) {
      console.error(e);
      toast(e && e.name === 'QuotaExceededError' ? 'مساحة التخزين ممتلئة، احذف أو صغّر بعض الصور' : 'تعذر حفظ المسودة', true);
    });
  }, 450);
  function changed() {
    updateSaveState();
    saveDraft();
  }

  function publish() {
    var btn = $('#saveBtn');
    btn.disabled = true;
    prepare(state.data);
    ContentStore.publish(state.data).then(function (saved) {
      state.data = saved;
      state.publishedJson = strip(saved);
      updateSaveState();
      renderView(true);
      toast('تم الحفظ والنشر ✓ (لنشره لكل الزوار: صدّر data.json)');
    }).catch(function (e) {
      console.error(e);
      toast(e && e.name === 'QuotaExceededError' ? 'مساحة التخزين ممتلئة، صغّر الصور المرفوعة' : 'فشل الحفظ: ' + (e.message || e), true);
    }).then(function () { btn.disabled = false; });
  }

  /* ---------------- Events ---------------- */
  function onInput(e) {
    var el = e.target;
    var path = el.getAttribute('data-path');
    if (!path) return;
    var kind = el.getAttribute('data-kind');
    var val;
    if (kind === 'bool') val = el.checked;
    else if (kind === 'number') val = el.value === '' ? 0 : parseFloat(el.value);
    else if (kind === 'hex') {
      val = el.value.trim();
      if (!/^#[0-9a-f]{6}$/i.test(val)) return;
      var picker = el.parentNode.querySelector('input[type="color"]');
      if (picker) picker.value = val;
    } else val = el.value;

    if (el.type === 'color') {
      var txt = el.parentNode.querySelector('[data-kind="hex"]');
      if (txt) txt.value = val;
    }
    if (el.type === 'radio' && !el.checked) return;

    setPath(state.data, path, val);

    var wrap = el.closest('.i18n-input');
    if (wrap) wrap.classList.toggle('is-empty', el.value === '');

    // تحديث عنوان عنصر القائمة مباشرة
    var item = el.closest('.list-item');
    if (item) {
      var ip = item.getAttribute('data-item');
      var listPath = ip.slice(0, ip.lastIndexOf('.'));
      var f = state.lists[listPath];
      var idx = +ip.slice(ip.lastIndexOf('.') + 1);
      if (f) $('.item-title', item).innerHTML = itemTitle(f, getPath(state.data, ip), idx);
    }
    if (/^sections\.\d+\.(visible|label)/.test(path)) {
      renderSidebar();
      var li = el.closest('.sort-item');
      if (li && kind === 'bool') li.classList.toggle('is-off', !val);
    }
    if (path === 'settings.colors.primary') applyAdminColor();
    if (path === 'settings.siteName.ar') $('#sbSite').textContent = val;
    changed();
  }

  function onClick(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var listPath = btn.getAttribute('data-list');
    var index = +btn.getAttribute('data-index');
    var arr = listPath ? getPath(state.data, listPath) : null;

    if (btn.closest('summary')) e.preventDefault();

    switch (action) {
      case 'go':
        go(btn.getAttribute('data-view'));
        return;
      case 'add': {
        var f = state.lists[listPath];
        if (!arr) { setPath(state.data, listPath, []); arr = getPath(state.data, listPath); }
        arr.push(clone(f.template || {}));
        state.open[listPath + '.' + (arr.length - 1)] = true;
        break;
      }
      case 'remove':
        if (!confirm('هل تريد حذف هذا العنصر؟')) return;
        arr.splice(index, 1);
        shiftOpen(listPath, index, -1);
        break;
      case 'dup':
        arr.splice(index + 1, 0, clone(arr[index]));
        shiftOpen(listPath, index + 1, 1);
        state.open[listPath + '.' + (index + 1)] = true;
        break;
      case 'move': {
        var to = index + (+btn.getAttribute('data-dir'));
        if (to < 0 || to >= arr.length) return;
        var tmp = arr[index]; arr[index] = arr[to]; arr[to] = tmp;
        var a = state.open[listPath + '.' + index], b = state.open[listPath + '.' + to];
        state.open[listPath + '.' + index] = b; state.open[listPath + '.' + to] = a;
        break;
      }
      case 'sec-move': {
        var secs = state.data.sections;
        var t2 = index + (+btn.getAttribute('data-dir'));
        if (t2 < 0 || t2 >= secs.length) return;
        secs.splice(t2, 0, secs.splice(index, 1)[0]);
        break;
      }
      case 'preview-project': {
        prepare(state.data);
        var proj = getPath(state.data, btn.getAttribute('data-path'));
        if (proj) openPreview('project', { p: proj.slug });
        renderView(true);
        return;
      }
      case 'clear':
        setPath(state.data, btn.getAttribute('data-path'), '');
        break;
      case 'preset':
        setPath(state.data, btn.getAttribute('data-path'), btn.getAttribute('data-value'));
        applyAdminColor();
        break;
      case 'export':
        exportJson();
        return;
      case 'discard':
        if (!confirm('سيتم تجاهل كل التغييرات غير المنشورة. متابعة؟')) return;
        state.data = JSON.parse(state.publishedJson);
        ContentStore.saveDraft(state.data);
        toast('تم الرجوع لآخر نسخة منشورة');
        break;
      case 'reset':
        if (!confirm('سيتم حذف كل التعديلات المحفوظة في هذا المتصفح والرجوع لمحتوى data.json. متابعة؟')) return;
        ContentStore.reset().then(ContentStore.loadDefaults).then(function (d) {
          state.data = d;
          state.publishedJson = strip(d);
          updateSaveState();
          applyAdminColor();
          renderView(true);
          toast('تمت الاستعادة');
        });
        return;
      default:
        return;
    }
    renderView(true);
    changed();
  }

  function shiftOpen(listPath, from, delta) {
    var prefix = listPath + '.';
    var next = {};
    Object.keys(state.open).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) { next[k] = state.open[k]; return; }
      var rest = k.slice(prefix.length);
      var m = /^(\d+)(.*)$/.exec(rest);
      if (!m) return;
      var n = +m[1];
      if (delta < 0 && n === from) return;
      next[prefix + (n >= from ? n + delta : n) + m[2]] = state.open[k];
    });
    state.open = next;
  }

  function onToggle(e) {
    var d = e.target;
    if (d.classList && d.classList.contains('list-item')) state.open[d.getAttribute('data-item')] = d.open;
  }

  /* ---------------- Images ---------------- */
  function processImage(file, opts) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error('الملف المختار ليس صورة'));
      if (file.type === 'image/svg+xml') {
        if (file.size > 300 * 1024) return reject(new Error('ملف SVG كبير جدًا (الحد 300KB)'));
        var r = new FileReader();
        r.onload = function () { resolve(r.result); };
        r.onerror = function () { reject(new Error('تعذر قراءة الملف')); };
        return r.readAsDataURL(file);
      }
      if (file.size > 15 * 1024 * 1024) return reject(new Error('الصورة أكبر من 15MB'));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
        if (opts.square) { var m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
        var scale = Math.min(1, opts.maxW / sw, opts.maxW / sh);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        var out = canvas.toDataURL('image/webp', 0.82);
        if (out.indexOf('data:image/webp') !== 0) {
          out = opts.alpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
        }
        URL.revokeObjectURL(url);
        resolve(out);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة')); };
      img.src = url;
    });
  }

  function onChange(e) {
    var el = e.target;
    var path = el.getAttribute('data-upload');
    if (path && el.files && el.files[0]) {
      var file = el.files[0];
      toast('جاري ضغط الصورة...');
      processImage(file, { maxW: +el.getAttribute('data-maxw') || 1600, alpha: el.hasAttribute('data-alpha'), square: el.hasAttribute('data-square') })
        .then(function (dataUrl) {
          setPath(state.data, path, dataUrl);
          renderView(true);
          changed();
          toast('تم رفع الصورة (' + Math.round(dataUrl.length * 0.75 / 1024) + ' KB)');
        })
        .catch(function (err) { toast(err.message, true); });
      return;
    }
    // الحقول النصية تُعالج في input، هنا نعيد رسم الصورة بعد تغيير الرابط
    if (el.getAttribute('data-kind') === 'image') renderView(true);
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') return;
  }

  /* ---------------- Sortable sections ---------------- */
  function initSortable() {
    var list = $('#sortable');
    if (!list) return;
    var dragIndex = null;
    list.addEventListener('dragstart', function (e) {
      var li = e.target.closest('.sort-item');
      if (!li) return;
      dragIndex = +li.getAttribute('data-index');
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(dragIndex)); } catch (err) { /* ignore */ }
    });
    list.addEventListener('dragend', function () {
      $$('.sort-item', list).forEach(function (li) { li.classList.remove('dragging', 'drop-before', 'drop-after'); });
    });
    list.addEventListener('dragover', function (e) {
      var li = e.target.closest('.sort-item');
      if (!li || dragIndex === null) return;
      e.preventDefault();
      var r = li.getBoundingClientRect();
      var after = e.clientY > r.top + r.height / 2;
      $$('.sort-item', list).forEach(function (x) { x.classList.remove('drop-before', 'drop-after'); });
      li.classList.add(after ? 'drop-after' : 'drop-before');
    });
    list.addEventListener('drop', function (e) {
      var li = e.target.closest('.sort-item');
      if (!li || dragIndex === null) return;
      e.preventDefault();
      var target = +li.getAttribute('data-index');
      var after = li.classList.contains('drop-after');
      var secs = state.data.sections;
      var moved = secs.splice(dragIndex, 1)[0];
      var to = target + (after ? 1 : 0);
      if (dragIndex < to) to--;
      secs.splice(to, 0, moved);
      dragIndex = null;
      renderView(true);
      changed();
    });
  }

  /* ---------------- Data view ---------------- */
  function exportJson() {
    var data = clone(state.data);
    delete data.updatedAt;
    var blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('تم تصدير data.json، ارفعه مكان الملف القديم في المشروع');
  }

  function initDataView() {
    var imp = $('#importFile');
    imp.addEventListener('change', function () {
      var file = imp.files[0];
      if (!file) return;
      file.text().then(function (txt) {
        var parsed = JSON.parse(txt);
        if (!parsed || !parsed.settings || !Array.isArray(parsed.sections)) throw new Error('الملف لا يحتوي على بنية المحتوى الصحيحة');
        return ContentStore.normalize(parsed);
      }).then(function (d) {
        state.data = d;
        applyAdminColor();
        renderView(true);
        changed();
        toast('تم الاستيراد كمسودة، اضغط "حفظ ونشر" لاعتماده');
      }).catch(function (err) {
        toast('فشل الاستيراد: ' + err.message, true);
      });
    });

    $('#passForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var p1 = $('#newPass').value, p2 = $('#newPass2').value;
      if (p1.length < 6) return toast('كلمة المرور يجب ألا تقل عن 6 أحرف', true);
      if (p1 !== p2) return toast('كلمتا المرور غير متطابقتين', true);
      sha256(p1).then(function (h) {
        lsSet(HASH_KEY, h);
        try { sessionStorage.setItem(SESSION_KEY, h); } catch (err) { /* ignore */ }
        toast('تم تغيير كلمة المرور ✓');
        renderView(true);
        $('#notice').hidden = true;
      });
    });
  }

  /* ---------------- Preview ---------------- */
  var DEVICES = [['desktop', 'monitor', 'كمبيوتر'], ['tablet', 'tablet', 'تابلت'], ['mobile', 'mobile', 'موبايل']];
  // "./" وليس index.html: الـ cleanUrls في Vercel يعيد توجيه index.html
  var preview = { page: './', params: {} };
  function previewUrl() {
    var q = new URLSearchParams(preview.params);
    q.set('preview', '1');
    q.set('lang', state.previewLang);
    return preview.page + '?' + q.toString();
  }
  function openPreview(page, params) {
    preview.page = typeof page === 'string' ? page : './';
    preview.params = params || {};
    prepare(state.data);
    ContentStore.saveDraft(state.data).then(function () {
      var frame = $('#previewFrame');
      $('#previewModal').hidden = false;
      document.body.style.overflow = 'hidden';
      frame.src = previewUrl();
      $('#pvOpen').href = previewUrl();
    }).catch(function () { toast('تعذر حفظ المسودة للمعاينة', true); });
  }
  function closePreview() {
    $('#previewModal').hidden = true;
    document.body.style.overflow = '';
    $('#previewFrame').src = 'about:blank';
  }
  function initPreview() {
    $('#deviceSeg').innerHTML = DEVICES.map(function (d) {
      return '<button type="button" data-device="' + d[0] + '"' + (d[0] === state.device ? ' class="is-on"' : '') + ' title="' + d[2] + '">' + icon(d[1]) + '<span>' + d[2] + '</span></button>';
    }).join('');
    $('#deviceSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      state.device = b.getAttribute('data-device');
      $('#frameWrap').setAttribute('data-device', state.device);
      $$('#deviceSeg button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    });
    $('#langSeg').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      state.previewLang = b.getAttribute('data-lang');
      $$('#langSeg button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $('#previewFrame').src = previewUrl();
      $('#pvOpen').href = previewUrl();
    });
    $('#pvReload').innerHTML = icon('refresh');
    $('#pvOpen').innerHTML = icon('external');
    $('#pvClose').innerHTML = icon('close');
    $('#pvReload').addEventListener('click', function () {
      ContentStore.saveDraft(state.data).then(function () { $('#previewFrame').contentWindow.location.reload(); });
    });
    $('#pvClose').addEventListener('click', closePreview);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#previewModal').hidden) closePreview();
    });
  }

  /* ---------------- Theme ---------------- */
  function applyAdminColor() {
    var c = state.data && state.data.settings.colors && state.data.settings.colors.primary;
    if (!/^#[0-9a-f]{6}$/i.test(c || '')) return;
    document.documentElement.style.setProperty('--primary', c);
    var n = parseInt(c.slice(1), 16);
    var lum = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
    document.documentElement.style.setProperty('--on-primary', lum > 0.6 ? '#111214' : '#ffffff');
  }
  function syncThemeBtn() {
    var dark = I18N.effectiveTheme() === 'dark';
    $('#themeToggle').innerHTML = icon(dark ? 'sun' : 'moon') + (dark ? 'الوضع الفاتح' : 'الوضع الداكن');
  }

  /* ---------------- Auth ---------------- */
  var API_MODE = cfg.dataSource === 'api';
  function currentHash() { return lsGet(HASH_KEY) || cfg.adminPasswordHash; }
  function isLoggedIn() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      return API_MODE ? s === 'api' && !!sessionStorage.getItem(ContentStore.keys.token) : s === currentHash();
    } catch (e) { return false; }
  }
  // وضع الـ API: كلمة المرور = ADMIN_TOKEN على الخادم ويتم التحقق منها هناك
  function apiLogin(pass) {
    return fetch(cfg.apiBase + '/content?draft=1', { headers: { Authorization: 'Bearer ' + pass } }).then(function (r) {
      if (r.status === 401 || r.status === 403) throw new Error('wrong');
      ContentStore.setApiToken(pass);
      sessionStorage.setItem(SESSION_KEY, 'api');
    });
  }
  function showLogin() {
    $('#login').hidden = false;
    $('#app').hidden = true;
    $('#loginLogo').innerHTML = '<img src="assets/images/logo-mark.webp" alt="">';
    if (!window.crypto || !crypto.subtle) {
      $('#loginError').textContent = 'افتح اللوحة عبر https أو localhost لتفعيل تسجيل الدخول.';
    }
    $('#loginForm').onsubmit = function (e) {
      e.preventDefault();
      if (API_MODE) {
        apiLogin($('#loginPass').value).then(function () {
          $('#login').hidden = true;
          startApp();
        }).catch(function () {
          $('#loginError').textContent = 'كلمة المرور غير صحيحة أو الخادم غير متاح';
        });
        return;
      }
      sha256($('#loginPass').value).then(function (h) {
        if (h !== currentHash()) {
          $('#loginError').textContent = 'كلمة المرور غير صحيحة';
          $('#loginPass').select();
          return;
        }
        try { sessionStorage.setItem(SESSION_KEY, h); } catch (err) { /* ignore */ }
        $('#login').hidden = true;
        startApp();
      }).catch(function () {
        $('#loginError').textContent = 'المتصفح لا يدعم التشفير على هذا الرابط (استخدم https أو localhost).';
      });
    };
    setTimeout(function () { $('#loginPass').focus(); }, 50);
  }

  /* ---------------- Boot ---------------- */
  var started = false;
  function startApp() {
    if (started) return;
    started = true;
    Promise.all([ContentStore.load({ draft: true }), ContentStore.load()]).then(function (res) {
      state.data = res[0];
      state.publishedJson = strip(res[1]);
      $('#app').hidden = false;

      $('#sbLogo').innerHTML = '<img src="assets/images/logo-mark.webp" alt="">';
      $('#sbToggle').innerHTML = icon('menu');
      $('#openSite').innerHTML = icon('external') + 'فتح الموقع';
      $('#logoutBtn').innerHTML = icon('logout') + 'تسجيل الخروج';
      $('#previewBtn').innerHTML = icon('eye') + '<span>معاينة</span>';
      $('#saveBtn').innerHTML = icon('check') + '<span>حفظ ونشر</span>';
      syncThemeBtn();
      applyAdminColor();

      if (!API_MODE && currentHash() === cfg.adminPasswordHash) {
        var n = $('#notice');
        n.hidden = false;
        n.innerHTML = '⚠ أنت تستخدم كلمة المرور الافتراضية. <a href="#data" data-action="go" data-view="data">غيّرها من هنا</a>.';
      }

      var editor = $('#editor');
      editor.addEventListener('input', onInput);
      editor.addEventListener('change', function (e) {
        if (e.target.matches('select, input[type="checkbox"], input[type="radio"]')) onInput(e);
        onChange(e);
      });
      editor.addEventListener('toggle', onToggle, true);
      document.addEventListener('click', onClick);

      $('#saveBtn').addEventListener('click', publish);
      $('#previewBtn').addEventListener('click', function () { openPreview(); });
      $('#sbToggle').addEventListener('click', function () { $('#app').classList.toggle('sb-open'); });
      $('#sbBackdrop').addEventListener('click', function () { $('#app').classList.remove('sb-open'); });
      $('#logoutBtn').addEventListener('click', function () {
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
        location.reload();
      });
      $('#themeToggle').addEventListener('click', function () {
        var next = I18N.effectiveTheme() === 'dark' ? 'light' : 'dark';
        lsSet(THEME_KEY, next);
        I18N.applyTheme(next);
        syncThemeBtn();
      });
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); publish(); }
      });
      window.addEventListener('beforeunload', function (e) {
        if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
      });
      initPreview();

      var hash = decodeURIComponent(location.hash.slice(1));
      if (hash === 'settings' || hash === 'data' || hash === 'sections' || (hash.indexOf('section:') === 0 && sectionIndex(hash.slice(8)) >= 0)) {
        state.view = hash;
      }
      renderView(false);
      updateSaveState();
    }).catch(function (err) {
      console.error(err);
      $('#app').hidden = false;
      $('#editor').innerHTML = '<div class="card"><h2>تعذر تحميل المحتوى</h2><p class="card-desc">' + esc(err.message) +
        '<br>تأكد من تشغيل المشروع عبر خادم (مثل <code>npx serve .</code>) وليس بفتح الملف مباشرة.</p></div>';
    });
  }

  function boot() {
    if (isLoggedIn()) startApp();
    else showLogin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
