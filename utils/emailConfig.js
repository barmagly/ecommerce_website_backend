const nodemailer = require('nodemailer');

const createHostingerTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const createGmailTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
};

const createTransporter = () => {
    const emailService = process.env.EMAIL_SERVICE || 'hostinger';
    
    if (emailService.toLowerCase() === 'gmail') {
        return createGmailTransporter();
    } else {
        return createHostingerTransporter();
    }
};

const transporter = createTransporter();

const sendMail = async (to, subject, html, attachments = null, text = null) => {
    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Mizanoo'}" <${process.env.EMAIL}>`,
            to,
            subject,
            html,
            text
        };
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

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