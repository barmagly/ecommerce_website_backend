# إعداد الإيميل مع Hostinger

## المتغيرات المطلوبة في ملف .env

```env
# نوع خدمة الإيميل (gmail أو hostinger)
EMAIL_SERVICE=hostinger

# إعدادات الإيميل
EMAIL=your-email@yourdomain.com
PASSWORD=your-email-password

# إعدادات SMTP لـ Hostinger (اختيارية)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587

# اسم المرسل (اختياري)
EMAIL_FROM_NAME=Mizanoo
```

## خطوات الإعداد مع Hostinger

### 1. الحصول على إعدادات SMTP من Hostinger

1. ادخل إلى لوحة تحكم Hostinger
2. اذهب إلى "Email" > "Email Accounts"
3. أنشئ حساب إيميل جديد أو استخدم حساب موجود
4. اذهب إلى "Email" > "Email Configuration"
5. احصل على إعدادات SMTP التالية:
   - SMTP Host: `smtp.hostinger.com`
   - SMTP Port: `587`
   - Username: `your-email@yourdomain.com`
   - Password: `your-email-password`

### 2. تحديث ملف .env

```env
EMAIL_SERVICE=hostinger
EMAIL=your-email@yourdomain.com
PASSWORD=your-email-password
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
EMAIL_FROM_NAME=Mizanoo
```

### 3. اختبار الإعداد

بعد تحديث الإعدادات، يمكنك اختبار الإيميل من خلال:

1. تسجيل مستخدم جديد
2. طلب إعادة تعيين كلمة المرور
3. إنشاء طلب جديد

## ملاحظات مهمة

- تأكد من أن كلمة مرور الإيميل صحيحة
- قد تحتاج إلى تفعيل "Less secure app access" في إعدادات الإيميل
- تأكد من أن المنفذ 587 مفتوح في الخادم
- إذا واجهت مشاكل، جرب المنفذ 465 مع `secure: true`

## العودة إلى Gmail

إذا أردت العودة إلى Gmail، ما عليك سوى تغيير:

```env
EMAIL_SERVICE=gmail
EMAIL=your-gmail@gmail.com
PASSWORD=your-gmail-password
```

## استكشاف الأخطاء

### مشكلة: "Authentication failed"
- تأكد من صحة كلمة المرور
- تأكد من تفعيل SMTP في إعدادات الإيميل

### مشكلة: "Connection timeout"
- تأكد من صحة SMTP_HOST و SMTP_PORT
- تأكد من أن المنفذ مفتوح

### مشكلة: "Invalid login"
- تأكد من صحة عنوان الإيميل
- تأكد من أن الإيميل مفعل في Hostinger 