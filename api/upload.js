// POST /api/upload  { dataUrl, name }  → { url }
// يرفع الصورة (المضغوطة WebP من اللوحة) إلى Vercel Blob
const { hasBlob, authorized, send, readJson } = require('./_lib');

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/svg+xml': 'svg', 'image/gif': 'gif' };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'method_not_allowed' });
  }
  if (!authorized(req)) return send(res, 401, { error: 'unauthorized' });
  if (!hasBlob()) return send(res, 501, { error: 'blob_not_configured' });

  try {
    const body = await readJson(req);
    const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(String(body.dataUrl || ''));
    if (!m || !TYPES[m[1]]) return send(res, 400, { error: 'invalid_image' });
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > MAX_BYTES) return send(res, 413, { error: 'too_large' });

    const base = String(body.name || 'image').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
    const { put } = require('@vercel/blob');
    const blob = await put('uploads/' + base + '.' + TYPES[m[1]], buffer, {
      access: 'public',
      contentType: m[1],
      addRandomSuffix: true
    });
    return send(res, 200, { url: blob.url });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: 'upload_failed' });
  }
};
