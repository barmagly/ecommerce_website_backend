# Changelog

## [1.1.0] - 2024-12-19

### Added
- دعم إرسال الإيميل عبر Hostinger SMTP
- ملف `utils/emailConfig.js` لإدارة إعدادات الإيميل
- دعم متعدد لخدمات الإيميل (Gmail و Hostinger)
- ملف اختبار `test-email.js` لاختبار إعدادات الإيميل
- ملف `README_EMAIL_SETUP.md` لتوثيق إعداد الإيميل

### Changed
- تحديث `controller/user.js` لاستخدام نظام الإيميل الجديد
- تحديث `controller/order.js` لاستخدام نظام الإيميل الجديد
- تحسين تنسيق الإيميلات مع HTML
- إضافة معالجة أفضل للأخطاء في إرسال الإيميل

### Removed
- إزالة إعدادات nodemailer المكررة من الملفات
- إزالة الكود القديم لإرسال الإيميل

### Environment Variables
- `EMAIL_SERVICE`: نوع خدمة الإيميل (gmail/hostinger)
- `EMAIL`: عنوان الإيميل
- `PASSWORD`: كلمة مرور الإيميل
- `SMTP_HOST`: خادم SMTP (اختياري)
- `SMTP_PORT`: منفذ SMTP (اختياري)
- `EMAIL_FROM_NAME`: اسم المرسل (اختياري)

### Migration Guide
1. أضف المتغيرات الجديدة إلى ملف `.env`
2. تأكد من إعداد إيميل Hostinger بشكل صحيح
3. اختبر الإيميل باستخدام `npm run test:email`
4. راجع ملف `README_EMAIL_SETUP.md` للحصول على تعليمات مفصلة 