// أدوات مشتركة لدوال Vercel (الملفات التي تبدأ بـ _ لا تُنشر كـ endpoints)
const crypto = require('crypto');

const KEYS = {
  content: 'eldeeb:content',
  draft: 'eldeeb:content:draft'
};

let redis = null;

/** قاعدة البيانات: Upstash Redis (تُضاف متغيراتها تلقائيًا عند ربطها من Vercel Storage) */
function getDb() {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  }
  // للتجربة المحلية فقط: DEV_MEMORY_DB=1
  if (process.env.DEV_MEMORY_DB === '1') {
    const mem = new Map();
    redis = {
      async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
      async set(k, v) { mem.set(k, JSON.stringify(v)); return 'OK'; },
      async del(...k) { k.forEach((x) => mem.delete(x)); return k.length; }
    };
    return redis;
  }
  return null;
}

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

/** توكن دخول صالح 12 ساعة */
function createToken() {
  const exp = String(Date.now() + 12 * 60 * 60 * 1000);
  return exp + '.' + sign(exp);
}

function verifyToken(token) {
  if (!token || !secret()) return false;
  const [exp, sig] = String(token).split('.');
  if (!exp || !sig) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Date.now();
}

function authorized(req) {
  const header = req.headers.authorization || '';
  return verifyToken(header.replace(/^Bearer\s+/i, ''));
}

function checkPassword(password) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(password || '')).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function query(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

module.exports = { KEYS, getDb, hasBlob, createToken, authorized, checkPassword, send, readJson, query };
