import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4516;

app.use(express.json());

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set; database requests will fail.');
}

app.get('/', function (req, res) {
    res.send("Paw Match API is running!")
});

app.get('/health', async function (req, res) {
    try {
        const result = await db.query('SELECT 1 AS ok');
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

const swaggerPath = path.join(__dirname, 'swagger-output.json');
let swaggerDocument = null;
try {
    const raw = fs.readFileSync(swaggerPath, 'utf8');
    swaggerDocument = JSON.parse(raw);
} catch (err) {
    console.warn('Swagger spec not found. Run `npm start` or `npm run swagger` to generate it.');
}

if (swaggerDocument) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/openapi.json', function (req, res) {
        res.json(swaggerDocument);
    });
}


app.use(function (err, req, res, next) {
    console.error('Unhandled error', err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: 'Internal server error' });
});

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    app.listen(PORT, function () {
        console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
    });
}

export default app;
