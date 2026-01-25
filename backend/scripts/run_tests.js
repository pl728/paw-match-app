#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var { spawn } = require('child_process');
var resetDatabase = require('./reset_db').resetDatabase;

async function runTests() {
    if (!process.env.TEST_DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL is required (e.g., mysql://user:pass@localhost:3306/paw_match_test)');
    }

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await resetDatabase(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    console.log('Test database reset complete.');

    await new Promise(function (resolve, reject) {
        var child = spawn('npx', ['jest'], { stdio: 'inherit', shell: false });
        child.on('close', function (code) {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('jest failed with exit code ' + code));
            }
        });
        child.on('error', reject);
    });
}

if (require.main === module) {
    runTests().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
