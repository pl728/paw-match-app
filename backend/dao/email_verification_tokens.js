import crypto from 'node:crypto';
import db from '../db/index.js';

export function hashVerificationToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createEmailVerificationToken(userId, expiresAt) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashVerificationToken(token);
    const tokenId = crypto.randomUUID();

    await db.query(
        'INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
        [tokenId, userId, tokenHash, expiresAt]
    );

    return token;
}

export async function getActiveEmailVerificationToken(token) {
    const tokenHash = hashVerificationToken(token);
    const result = await db.query(
        `SELECT id, user_id, token_hash, expires_at, used_at, created_at
         FROM email_verification_tokens
         WHERE token_hash = ?
           AND used_at IS NULL
           AND expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}

export async function markEmailVerificationTokenUsed(tokenId) {
    await db.query(
        'UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL',
        [tokenId]
    );
}
