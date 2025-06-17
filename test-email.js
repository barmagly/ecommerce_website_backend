require('dotenv').config();
const { sendMail } = require('./utils/emailConfig');

async function testEmail() {
    try {
        console.log('Testing email configuration...');
        console.log('Email Service:', process.env.EMAIL_SERVICE || 'hostinger');
        console.log('Email:', process.env.EMAIL);
        
        await sendMail(
            process.env.EMAIL, // إرسال إلى نفس الإيميل للاختبار
            'اختبار إعدادات الإيميل',
            `<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>اختبار إعدادات الإيميل</h2>
                <p>هذا إيميل اختبار للتأكد من أن إعدادات SMTP تعمل بشكل صحيح.</p>
                <p>إذا تلقيت هذا الإيميل، فهذا يعني أن الإعدادات صحيحة! ✅</p>
                <p>مع تحياتنا،<br>فريق ميزانو ❤️</p>
            </div>`,
            'هذا إيميل اختبار للتأكد من أن إعدادات SMTP تعمل بشكل صحيح.'
        );
        
        console.log('✅ Email test successful!');
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        console.error('Full error:', error);
    }
}

// تشغيل الاختبار إذا تم تشغيل الملف مباشرة
if (require.main === module) {
    testEmail();
}

module.exports = testEmail; 