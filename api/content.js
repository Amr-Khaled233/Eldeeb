// GET    /api/content            → المحتوى المنشور (عام)
// GET    /api/content?draft=1    → المسودة (للوحة التحكم)
// PUT    /api/content            → نشر
// PUT    /api/content?draft=1    → حفظ مسودة
const { KEYS, getDb, authorized, send, readJson, query } = require('./_lib');

const MAX_BYTES = 900 * 1024; // حد آمن لحجم المحتوى (الصور تُرفع لـ Blob منفصلة)

module.exports = async function handler(req, res) {
  const db = getDb();
  if (!db) return send(res, 503, { error: 'db_not_configured' });
  const isDraft = query(req).get('draft') === '1';

  try {
    if (req.method === 'GET') {
      if (isDraft && !authorized(req)) return send(res, 401, { error: 'unauthorized' });
      let data = await db.get(isDraft ? KEYS.draft : KEYS.content);
      if (!data && isDraft) data = await db.get(KEYS.content);
      if (!data) return send(res, 404, { error: 'not_found' }, { 'Cache-Control': 'no-store' });
      return send(res, 200, data, {
        'Cache-Control': isDraft ? 'no-store' : 'public, max-age=0, s-maxage=10, stale-while-revalidate=60'
      });
    }

    if (!authorized(req)) return send(res, 401, { error: 'unauthorized' });

    if (req.method === 'PUT') {
      const body = await readJson(req);
      if (!body || typeof body !== 'object' || !body.settings || !Array.isArray(body.sections)) {
        return send(res, 400, { error: 'invalid_content' });
      }
      if (Buffer.byteLength(JSON.stringify(body)) > MAX_BYTES) return send(res, 413, { error: 'too_large' });
      await db.set(isDraft ? KEYS.draft : KEYS.content, body);
      if (!isDraft) await db.set(KEYS.draft, body);
      return send(res, 200, { ok: true, updatedAt: body.updatedAt || null }, { 'Cache-Control': 'no-store' });
    }

    if (req.method === 'DELETE') {
      await db.del(KEYS.content, KEYS.draft);
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    return send(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: 'server_error' });
  }
};
