import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db/index.js';
import usersRoutes from './routes/users.js';
import sheltersRoutes from './routes/shelters.js';
import petsRoutes from './routes/pets.js';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import shelterFollowsRoutes from './routes/shelter_follows.js';
import shelterPostsRoutes from './routes/shelter_posts.js';
import feedEventsRoutes from './routes/feed_events.js';
import emailNotificationsRoutes from './routes/email_notifications.js';

var app = express();
var PORT = process.env.PORT || 4516;

app.use(express.json());

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set; database requests will fail.');
}

app.get('/', function (req, res) {
    res.send("Paw Match API is running!")
});

app.get('/health', async function (req, res) {
    try {
        var result = await db.query('SELECT 1 AS ok');
        res.json({ ok: result.rows[0].ok === 1 });
    } catch (err) {
        console.error('Health check failed', err);
        res.status(500).json({ ok: false });
    }
});

// Core resources
app.use('/users', usersRoutes);
app.use('/shelters', sheltersRoutes);
app.use('/pets', petsRoutes);
app.use('/auth', authRoutes);

// Engagement & activity
app.use('/api/favorites', favoritesRoutes);
app.use('/api/shelter-follows', shelterFollowsRoutes);
app.use('/api/shelter-posts', shelterPostsRoutes);
app.use('/api/feed', feedEventsRoutes);

// Preferences & notifications
app.use('/api/email-notifications', emailNotificationsRoutes);


app.use(function (err, req, res, next) {
    console.error('Unhandled error', err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: 'Internal server error' });
});

var isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
    app.listen(PORT, function () {
        console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
    });
}

export default app;
