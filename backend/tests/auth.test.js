import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { createEmailVerificationToken } from '../dao/email_verification_tokens.js';
import { getUserByUsername, markUserEmailVerified } from '../dao/users.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('auth endpoints', function () {
    it('registers a user and sends verification without returning a token', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth1_' + unique;

        const res = await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        expect(res.body).not.toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.username).toBe(username);
        expect(res.body.user.role).toBe('adopter');
        expect(res.body.user.email_verified).toBe(false);
    });

    it('rejects login for an unverified user', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth2_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({ username: username, password: 'password123' })
            .expect(403);

        expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('verifies a user email token', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'authverify_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const user = await getUserByUsername(username);
        const token = await createEmailVerificationToken(user.id, new Date(Date.now() + 60 * 60 * 1000));

        const res = await request(app)
            .get('/auth/verify-email')
            .query({ token: token })
            .expect(200);

        expect(res.body.user.email_verified).toBe(true);

        const login = await request(app)
            .post('/auth/login')
            .send({ username: username, password: 'password123' })
            .expect(200);

        expect(login.body).toHaveProperty('token');
        expect(login.body).toHaveProperty('user');
        expect(login.body.user.username).toBe(username);
    });

    it('rejects expired verification tokens', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'authexpired_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const user = await getUserByUsername(username);
        const token = await createEmailVerificationToken(user.id, new Date(Date.now() - 60 * 1000));

        await request(app)
            .get('/auth/verify-email')
            .query({ token: token })
            .expect(400);
    });

    it('resends verification emails with a neutral response', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'authresend_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/send-verification-email')
            .send({ username: username })
            .expect(200);

        expect(res.body.message).toContain('verification email');
    });

    it('rejects duplicate registrations', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth3_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(409);

        expect(res.body.error).toBe('Username and email already exist');
        expect(res.body.code).toBe('USERNAME_EMAIL_EXISTS');
        expect(res.body.fields).toEqual(expect.arrayContaining(['username', 'email']));
    });

    it('reports duplicate username separately from email', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'authusername_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '_new@example.test', password: 'password123' })
            .expect(409);

        expect(res.body.error).toBe('Username already exists');
        expect(res.body.code).toBe('USERNAME_EXISTS');
        expect(res.body.fields).toEqual(['username']);
    });

    it('reports duplicate email separately from username', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'authemail_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/register')
            .send({ username: username + '_new', email: username + '@example.test', password: 'password123' })
            .expect(409);

        expect(res.body.error).toBe('Email address already exists');
        expect(res.body.code).toBe('EMAIL_EXISTS');
        expect(res.body.fields).toEqual(['email']);
    });

    it('rejects invalid login', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth4_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, email: username + '@example.test', password: 'password123' })
            .expect(201);

        const user = await getUserByUsername(username);
        await markUserEmailVerified(user.id);

        await request(app)
            .post('/auth/login')
            .send({ username: username, password: 'wrongpassword' })
            .expect(401);
    });
});
