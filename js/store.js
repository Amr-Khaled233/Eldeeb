/**
 * ContentStore: طبقة البيانات الوحيدة التي يتعامل معها الموقع ولوحة التحكم.
 * ------------------------------------------------------------------
 * كل القراءة والكتابة تمر من هنا عبر "Adapter".
 * لإضافة باك إند حقيقي لاحقًا (Vercel + Upstash Redis / Supabase ...):
 *   1) نفّذ endpoints: GET/PUT /api/content  (انظر docs/api-example)
 *   2) غيّر dataSource إلى 'api' في js/config.js
 * بدون أي تعديل في script.js أو admin.js.
 */
(function (global) {
  'use strict';

  var cfg = Object.assign(
    { dataSource: 'local', dataUrl: 'data.json', apiBase: '/api', storagePrefix: 'bc' },
    global.APP_CONFIG || {}
  );

  var KEYS = {
    published: cfg.storagePrefix + ':content:published',
    draft: cfg.storagePrefix + ':content:draft',
    token: cfg.storagePrefix + ':api:token'
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  // هوية عنصر في قائمة (لمطابقة العنصر المحفوظ مع الافتراضي وإضافة الحقول الجديدة له)
  function identity(o) {
    var v = o.slug || o.id || o.title || o.name || o.text || o.label;
    return v == null ? null : JSON.stringify(isObj(v) ? v.ar : v);
  }
  function mergeArray(base, over) {
    return over.map(function (item, i) {
      var b = base[i];
      if (isObj(item) && isObj(b) && identity(item) !== null && identity(item) === identity(b)) {
        return deepMerge(clone(b), item);
      }
      return item;
    });
  }
  // دمج عميق: الكائنات تُدمج، والمصفوفات تُستبدل بالمحفوظة (مع إكمال الحقول الناقصة للعناصر المطابقة)
  function deepMerge(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    Object.keys(over).forEach(function (k) {
      if (isObj(base[k]) && isObj(over[k])) base[k] = deepMerge(base[k], over[k]);
      else if (Array.isArray(base[k]) && Array.isArray(over[k])) base[k] = mergeArray(base[k], over[k]);
      else base[k] = over[k];
    });
    return base;
  }

  /** يضمن أن المحتوى المحفوظ قديمًا يحتوي على أي حقول/أقسام جديدة أُضيفت في data.json */
  function normalize(data, defaults) {
    if (!data || !Array.isArray(data.sections)) return clone(defaults);
    var out = clone(data);
    out.settings = deepMerge(clone(defaults.settings), out.settings || {});
    var ids = {};
    out.sections.forEach(function (s) { ids[s.id] = true; });
    // الأقسام الجديدة تُضاف في مكانها الافتراضي
    defaults.sections.forEach(function (s, i) {
      if (!ids[s.id]) out.sections.splice(Math.min(i, out.sections.length), 0, clone(s));
    });
    out.version = defaults.version;
    out.sections = out.sections.map(function (s) {
      var d = defaults.sections.filter(function (x) { return x.id === s.id; })[0];
      if (!d) return s;
      var merged = Object.assign(clone(d), s);
      merged.data = deepMerge(clone(d.data || {}), s.data || {});
      return merged;
    });
    return out;
  }

  function stamp(data) {
    var d = clone(data);
    d.updatedAt = new Date().toISOString();
    return d;
  }

  var ls = {
    get: function (k) {
      try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    },
    set: function (k, v) { localStorage.setItem(k, JSON.stringify(v)); }, // قد يرمي QuotaExceededError
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  var defaultsPromise = null;
  function fetchDefaults() {
    if (!defaultsPromise) {
      defaultsPromise = fetch(cfg.dataUrl, { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('تعذر تحميل ' + cfg.dataUrl + ' (' + r.status + ')');
        return r.json();
      });
      defaultsPromise.catch(function () { defaultsPromise = null; });
    }
    return defaultsPromise;
  }

  /* ---------------- Adapter: localStorage ---------------- */
  var LocalAdapter = {
    load: function (opts) {
      opts = opts || {};
      return fetchDefaults().then(function (defaults) {
        var stored = (opts.draft && ls.get(KEYS.draft)) || ls.get(KEYS.published);
        return stored ? normalize(stored, defaults) : clone(defaults);
      });
    },
    saveDraft: function (data) { ls.set(KEYS.draft, stamp(data)); return Promise.resolve(); },
    publish: function (data) {
      var d = stamp(data);
      ls.set(KEYS.published, d);
      ls.set(KEYS.draft, d);
      return Promise.resolve(d);
    },
    reset: function () { ls.del(KEYS.published); ls.del(KEYS.draft); return Promise.resolve(); }
  };

  /* ---------------- Adapter: REST API ---------------- */
  function apiHeaders() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var t = null;
    try { t = sessionStorage.getItem(KEYS.token); } catch (e) { /* ignore */ }
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function apiSend(method, path, body) {
    return fetch(cfg.apiBase + path, {
      method: method, headers: apiHeaders(), body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('API ' + method + ' ' + path + ' → ' + r.status);
      return r.status === 204 ? null : r.json();
    });
  }
  var ApiAdapter = {
    load: function (opts) {
      opts = opts || {};
      return Promise.all([
        fetchDefaults(),
        apiSend('GET', '/content' + (opts.draft ? '?draft=1' : '')).catch(function (e) {
          console.warn('[ContentStore] API غير متاح، سيتم استخدام data.json', e);
          return null;
        })
      ]).then(function (res) { return res[1] ? normalize(res[1], res[0]) : clone(res[0]); });
    },
    saveDraft: function (data) { return apiSend('PUT', '/content?draft=1', stamp(data)); },
    publish: function (data) { var d = stamp(data); return apiSend('PUT', '/content', d).then(function () { return d; }); },
    reset: function () { return apiSend('DELETE', '/content'); }
  };

  var adapter = cfg.dataSource === 'api' ? ApiAdapter : LocalAdapter;

  global.ContentStore = {
    config: cfg,
    keys: KEYS,
    load: function (opts) { return adapter.load(opts); },
    loadDefaults: function () { return fetchDefaults().then(clone); },
    saveDraft: function (data) { return adapter.saveDraft(data); },
    publish: function (data) { return adapter.publish(data); },
    reset: function () { return adapter.reset(); },
    normalize: function (data) { return fetchDefaults().then(function (d) { return normalize(data, d); }); },
    setApiToken: function (t) { try { sessionStorage.setItem(KEYS.token, t); } catch (e) { /* ignore */ } }
  };
})(window);
