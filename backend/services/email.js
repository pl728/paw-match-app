import nodemailer from 'nodemailer';

function createTransport() {
    if (process.env.RESEND_API_KEY) {
        return nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: {
                user: 'resend',
                pass: process.env.RESEND_API_KEY
            }
        });
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

export async function sendEmail({ to, subject, body }) {
    if (process.env.EMAIL_DELIVERY_DISABLED === 'true') {
        return;
    }

    const transport = createTransport();
    await transport.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html: body
    });
}
