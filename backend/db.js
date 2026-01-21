var { Pool } = require('pg');

var pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', function(err) {
    console.error('Unexpected idle client error', err);
});

module.exports = {
    query: function(text, params) {
        return pool.query(text, params);
    },
    end: function() {
        return pool.end();
    }
};
