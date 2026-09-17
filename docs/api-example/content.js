/**
 * مثال API لحفظ المحتوى في Upstash Redis (Vercel Marketplace)
 * ------------------------------------------------------------
 * الاستخدام:
 *   1) انسخ هذا الملف إلى:  /api/content.js
 *   2) أنشئ package.json في جذر المشروع يحتوي:
 *        { "private": true, "dependencies": { "@upstash/redis": "^1.34.0" } }
 *   3) من Vercel: Storage → Upstash (Redis) → Connect to project
 *      (يضيف KV_REST_API_URL و KV_REST_API_TOKEN تلقائيًا)
 *   4) أضف ADMIN_TOKEN من Settings → Environment Variables
 *   5) في js/config.js غيّر dataSource إلى 'api'
 *
 * Endpoints:
 *   GET    /api/content            → المحتوى المنشور (عام)
 *   GET    /api/content?draft=1    → المسودة (يتطلب Authorization)
 *   PUT    /api/content            → نشر (يتطلب Authorization)
 *   PUT    /api/content?draft=1    → حفظ مسودة (يتطلب Authorization)
 *   DELETE /api/content            → استعادة الافتراضي (يتطلب Authorization)
 */
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

const KEY = 'site:content';
const DRAFT_KEY = 'site:content:draft';
const MAX_BYTES = 4 * 1024 * 1024;

function authorized(req) {
  const expected = process.env.ADMIN_TOKEN;
  const header = req.headers.authorization || '';
  return Boolean(expected) && header === `Bearer ${expected}`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const isDraft = req.query.draft === '1';

  try {
    if (req.method === 'GET') {
      if (isDraft && !authorized(req)) return res.status(401).json({ error: 'unauthorized' });
      let data = await redis.get(isDraft ? DRAFT_KEY : KEY);
      if (!data && isDraft) data = await redis.get(KEY);
      if (!data) return res.status(404).json({ error: 'not_found' });
      res.setHeader('Cache-Control', isDraft ? 'no-store' : 's-maxage=30, stale-while-revalidate=300');
      return res.status(200).json(data);
    }

    if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'PUT') {
      const body = req.body;
      if (!body || typeof body !== 'object' || !body.settings || !Array.isArray(body.sections)) {
        return res.status(400).json({ error: 'invalid_content' });
      }
      if (JSON.stringify(body).length > MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      await redis.set(isDraft ? DRAFT_KEY : KEY, body);
      if (!isDraft) await redis.set(DRAFT_KEY, body);
      return res.status(204).end();
    }

    if (req.method === 'DELETE') {
      await redis.del(KEY, DRAFT_KEY);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, PUT, DELETE, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
};
