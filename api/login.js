// POST /api/login  { password }  → { token }
const { createToken, checkPassword, send, readJson } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'method_not_allowed' });
  }
  if (!process.env.ADMIN_PASSWORD) return send(res, 503, { error: 'password_not_configured' });
  try {
    const body = await readJson(req);
    if (!checkPassword(body.password)) {
      await new Promise((r) => setTimeout(r, 700)); // إبطاء محاولات التخمين
      return send(res, 401, { error: 'wrong_password' });
    }
    return send(res, 200, { token: createToken() }, { 'Cache-Control': 'no-store' });
  } catch (err) {
    return send(res, 400, { error: 'bad_request' });
  }
};
