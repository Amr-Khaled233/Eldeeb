/**
 * إعدادات التشغيل العامة للموقع ولوحة التحكم.
 * ------------------------------------------------------------------
 * dataSource:
 *   'local' → المحتوى الافتراضي من data.json + التعديلات محفوظة في localStorage (الوضع الحالي)
 *   'api'   → المحتوى يُقرأ ويُحفظ من API حقيقي (مثال جاهز في docs/api-example)
 */
window.APP_CONFIG = {
  dataSource: 'local',
  dataUrl: 'data.json',
  apiBase: '/api',
  storagePrefix: 'bc',
  // SHA-256 لكلمة مرور لوحة التحكم الافتراضية: admin123
  // (غيّرها من داخل اللوحة ← "البيانات والأمان")
  adminPasswordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};
