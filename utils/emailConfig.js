const nodemailer = require('nodemailer');

// إعدادات SMTP لـ Hostinger
const createHostingerTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// إعدادات SMTP لـ Gmail (للتوافق مع الإعدادات القديمة)
const createGmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
};

// إنشاء transporter بناءً على نوع الخدمة
const createTransporter = () => {
    const emailService = process.env.EMAIL_SERVICE || 'hostinger';
    
    if (emailService.toLowerCase() === 'gmail') {
        return createGmailTransporter();
    } else {
        return createHostingerTransporter();
    }
};

// إنشاء transporter افتراضي
const transporter = createTransporter();

// دالة لإرسال الإيميل
const sendMail = async (to, subject, html, text = null) => {
    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Mizanoo'}" <${process.env.EMAIL}>`,
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    transporter,
    sendMail,
    createTransporter,
    createHostingerTransporter,
    createGmailTransporter
}; 