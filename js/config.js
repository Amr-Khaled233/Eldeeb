/**
 * إعدادات التشغيل
 * ------------------------------------------------------------------
 * dataSource:
 *   'auto'  → لو قاعدة البيانات مربوطة على Vercel يُحفظ كل شيء فيها،
 *             وإلا (تشغيل محلي) يُحفظ في المتصفح. (الافتراضي)
 *   'api'   → قاعدة البيانات فقط
 *   'local' → data.json + المتصفح فقط
 */
window.APP_CONFIG = {
  dataSource: 'auto',
  dataUrl: 'data.json',
  apiBase: '/api',
  storagePrefix: 'bc',
  // كلمة مرور التشغيل المحلي فقط (admin123). على Vercel تُستخدم ADMIN_PASSWORD من إعدادات المشروع.
  adminPasswordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};
