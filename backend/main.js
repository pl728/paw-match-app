var express = require('express');
var db = require('./db');
var usersRoutes = require('./routes/users');
var sheltersRoutes = require('./routes/shelters');
var petsRoutes = require('./routes/pets');

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

app.use('/users', usersRoutes);
app.use('/shelters', sheltersRoutes);
app.use('/pets', petsRoutes);

app.use(function (err, req, res, next) {
    console.error('Unhandled error', err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
    app.listen(PORT, function () {
        console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
    });
}

module.exports = app;
