import { createEmailVerificationToken } from '../dao/email_verification_tokens.js';
import { sendEmail } from './email.js';

function getFrontendBaseUrl() {
    return (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getVerificationExpiryDate() {
    const hours = Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || 24);
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char];
    });
}

function buildVerificationEmailBody({ username, verificationUrl }) {
    return `
        <p>Hello ${escapeHtml(username)},</p>
        <p>Thanks for creating a Paw Match account. Verify your email address to finish setting up your account.</p>
        <p><a href="${escapeHtml(verificationUrl)}">Verify your email address</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
    `;
}

export async function sendVerificationEmail(user) {
    const expiresAt = getVerificationExpiryDate();
    const token = await createEmailVerificationToken(user.id, expiresAt);
    const verificationUrl = `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: user.email,
        subject: 'Verify your Paw Match email',
        body: buildVerificationEmailBody({
            username: user.username,
            verificationUrl: verificationUrl
        })
    });
}
