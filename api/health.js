// GET /api/health → حالة الربط (بدون أي بيانات سرية)
const { getDb, hasBlob, send } = require('./_lib');

module.exports = function handler(req, res) {
  return send(res, 200, {
    ok: true,
    db: Boolean(getDb()),
    blob: hasBlob(),
    auth: Boolean(process.env.ADMIN_PASSWORD)
  }, { 'Cache-Control': 'no-store' });
};
