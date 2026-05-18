import request from 'supertest';
import { getUserByUsername, markUserEmailVerified } from '../../dao/users.js';

export async function registerVerifiedUser(app, role = 'adopter', usernamePrefix = role) {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const username = usernamePrefix + '_' + unique;
    const password = 'password123';

    await request(app)
        .post('/auth/register')
        .send({ username: username, email: username + '@example.test', password: password, role: role })
        .expect(201);

    const user = await getUserByUsername(username);
    await markUserEmailVerified(user.id);

    const login = await request(app)
        .post('/auth/login')
        .send({ username: username, password: password })
        .expect(200);

    return {
        token: login.body.token,
        user: login.body.user,
        username: username,
        password: password
    };
}
