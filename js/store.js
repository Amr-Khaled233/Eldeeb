/**
 * ContentStore: طبقة البيانات الوحيدة التي يتعامل معها الموقع ولوحة التحكم.
 * ------------------------------------------------------------------
 * dataSource = 'auto' (الافتراضي):
 *   - على Vercel مع قاعدة بيانات مربوطة: القراءة والحفظ من /api (Upstash Redis + Vercel Blob)
 *   - بدون API (تشغيل محلي بـ npx serve): data.json + حفظ في المتصفح
 */
(function (global) {
  'use strict';

  var cfg = Object.assign(
    { dataSource: 'auto', dataUrl: 'data.json', apiBase: '/api', storagePrefix: 'bc' },
    global.APP_CONFIG || {}
  );

  var KEYS = {
    published: cfg.storagePrefix + ':content:published',
    draft: cfg.storagePrefix + ':content:draft',
    token: cfg.storagePrefix + ':api:token',
    localSession: cfg.storagePrefix + ':admin:session'
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

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
  function deepMerge(base, over) {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    Object.keys(over).forEach(function (k) {
      if (isObj(base[k]) && isObj(over[k])) base[k] = deepMerge(base[k], over[k]);
      else if (Array.isArray(base[k]) && Array.isArray(over[k])) base[k] = mergeArray(base[k], over[k]);
      else base[k] = over[k];
    });
    return base;
  }

  /** يكمل المحتوى المحفوظ بأي حقول جديدة، ويتجاهل الأقسام التي لم تعد موجودة */
  function normalize(data, defaults) {
    if (!data || !Array.isArray(data.sections)) return clone(defaults);
    var out = clone(data);
    out.settings = deepMerge(clone(defaults.settings), out.settings || {});
    out.sections = out.sections.filter(function (s) {
      return defaults.sections.some(function (x) { return x.id === s.id; });
    });
    var ids = {};
    out.sections.forEach(function (s) { ids[s.id] = true; });
    defaults.sections.forEach(function (s, i) {
      if (!ids[s.id]) out.sections.splice(Math.min(i, out.sections.length), 0, clone(s));
    });
    out.version = defaults.version;
    out.sections = out.sections.map(function (s) {
      var d = defaults.sections.filter(function (x) { return x.id === s.id; })[0];
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
    set: function (k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  var ss = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) { /* ignore */ } }
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

  function isJson(r) { return (r.headers.get('content-type') || '').indexOf('json') >= 0; }

  /* ---------------- اكتشاف الوضع ---------------- */
  var OFF = { mode: 'local', api: false, db: false, blob: false, auth: false };
  var statusPromise = null;
  function status() {
    if (cfg.dataSource === 'local') return Promise.resolve(OFF);
    if (!statusPromise) {
      statusPromise = fetch(cfg.apiBase + '/health', { cache: 'no-store' }).then(function (r) {
        return r.ok && isJson(r) ? r.json() : null;
      }).then(function (j) {
        if (!j || !j.ok) return OFF;
        return { mode: j.db ? 'api' : 'local', api: true, db: !!j.db, blob: !!j.blob, auth: !!j.auth };
      }).catch(function () { return OFF; });
    }
    return statusPromise;
  }

  /* ---------------- التوكن ---------------- */
  function token() { return ss.get(KEYS.token); }
  function tokenValid() {
    var t = token();
    return !!t && +String(t).split('.')[0] > Date.now();
  }
  function headers() {
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }
  function api(method, path, body) {
    return fetch(cfg.apiBase + path, {
      method: method, headers: headers(), body: body ? JSON.stringify(body) : undefined, cache: 'no-store'
    }).then(function (r) {
      return (isJson(r) ? r.json() : Promise.resolve({})).then(function (j) {
        if (!r.ok) {
          var err = new Error((j && j.error) || ('HTTP ' + r.status));
          err.status = r.status;
          throw err;
        }
        return j;
      });
    });
  }

  /* ---------------- Adapters ---------------- */
  var LocalAdapter = {
    load: function (opts) {
      return fetchDefaults().then(function (defaults) {
        var stored = (opts && opts.draft && ls.get(KEYS.draft)) || ls.get(KEYS.published);
        return stored ? normalize(stored, defaults) : clone(defaults);
      });
    },
    saveDraft: function (data) { ls.set(KEYS.draft, stamp(data)); return Promise.resolve(); },
    publish: function (data) {
      var d = stamp(data);
      ls.set(KEYS.published, d);
      ls.set(KEYS.draft, d);
      return Promise.resolve(d);
    }
  };

  var ApiAdapter = {
    load: function (opts) {
      var draft = opts && opts.draft;
      return Promise.all([
        fetchDefaults(),
        api('GET', '/content' + (draft ? '?draft=1' : '')).catch(function () { return null; })
      ]).then(function (res) { return res[1] ? normalize(res[1], res[0]) : clone(res[0]); });
    },
    saveDraft: function (data) { return api('PUT', '/content?draft=1', stamp(data)); },
    publish: function (data) {
      var d = stamp(data);
      return api('PUT', '/content', d).then(function () { return d; });
    }
  };

  function adapter() {
    return status().then(function (s) { return s.mode === 'api' ? ApiAdapter : LocalAdapter; });
  }

  /** الموقع العام: يقرأ من الـ API مباشرة (بدون طلب إضافي)، وإلا data.json + المتصفح */
  function loadPublic() {
    if (cfg.dataSource === 'local') return LocalAdapter.load({});
    return Promise.all([
      fetchDefaults(),
      fetch(cfg.apiBase + '/content', { headers: { Accept: 'application/json' } }).then(function (r) {
        if (!isJson(r)) return null;
        if (r.ok) return r.json().then(function (d) { return { data: d }; });
        return { api: true };
      }).catch(function () { return null; })
    ]).then(function (res) {
      if (res[1] && res[1].data) return normalize(res[1].data, res[0]);
      if (res[1] && res[1].api) return clone(res[0]);
      return LocalAdapter.load({});
    });
  }

  function sha256(text) {
    if (!global.crypto || !crypto.subtle) return Promise.reject(new Error('insecure_context'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  global.ContentStore = {
    config: cfg,
    keys: KEYS,
    status: status,
    load: function (opts) {
      return opts && opts.draft ? adapter().then(function (a) { return a.load(opts); }) : loadPublic();
    },
    loadPublished: function () { return adapter().then(function (a) { return a.load({}); }); },
    saveDraft: function (data) { return adapter().then(function (a) { return a.saveDraft(data); }); },
    publish: function (data) { return adapter().then(function (a) { return a.publish(data); }); },

    /** الدخول: على Vercel بكلمة المرور ADMIN_PASSWORD، ومحليًا بكلمة المرور في config.js */
    login: function (password) {
      return status().then(function (s) {
        if (s.api) {
          if (!s.auth) return { ok: false, reason: 'password_not_configured' };
          return api('POST', '/login', { password: password }).then(function (j) {
            ss.set(KEYS.token, j.token);
            return { ok: true };
          }).catch(function (e) {
            return { ok: false, reason: e.status === 401 ? 'wrong_password' : 'server_error' };
          });
        }
        return sha256(password).then(function (h) {
          if (h !== cfg.adminPasswordHash) return { ok: false, reason: 'wrong_password' };
          ss.set(KEYS.localSession, '1');
          return { ok: true };
        }, function () { return { ok: false, reason: 'insecure_context' }; });
      });
    },
    isLoggedIn: function () {
      return status().then(function (s) { return s.api ? tokenValid() : ss.get(KEYS.localSession) === '1'; });
    },
    logout: function () { ss.del(KEYS.token); ss.del(KEYS.localSession); },

    /** رفع صورة إلى Vercel Blob لو متاح، وإلا تبقى داخل المحتوى */
    uploadImage: function (dataUrl, name) {
      return status().then(function (s) {
        if (s.mode !== 'api' || !s.blob) return dataUrl;
        return api('POST', '/upload', { dataUrl: dataUrl, name: name }).then(function (j) { return j.url; });
      });
    }
  };
})(window);
