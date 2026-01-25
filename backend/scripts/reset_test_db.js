#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var resetDatabase = require('./reset_db').resetDatabase;

async function main() {
    await resetDatabase(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    console.log('Test database reset complete.');
}

if (require.main === module) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = { resetTestDatabase: main };
