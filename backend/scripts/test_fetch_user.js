#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available; use Node.js 18+.');
}

var mysql = require('mysql2/promise');
var apiBase = process.env.API_BASE || 'http://localhost:4516';
var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
var payload = {
    email: 'demo_user+' + unique + '@test.com',
    password_hash: 'demo_hash',
    role: 'adopter'
};

async function requestJson(url, options) {
    var res = await fetch(url, options);
    var text = await res.text();
    var data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        var err = new Error('Request failed: ' + res.status);
        err.response = data;
        throw err;
    }
    return data;
}

async function printDbStats() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set for DB stats.');
    }

    var connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        var tablesResult = await connection.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
        );
        var tables = tablesResult[0].map(function (row) {
            return row.TABLE_NAME;
        });

        console.log('Tables:', tables.length);
        for (var i = 0; i < tables.length; i += 1) {
            var table = tables[i];
            var countResult = await connection.query('SELECT COUNT(*) AS count FROM `' + table + '`');
            console.log(table + ':', countResult[0][0].count);
        }
    } finally {
        await connection.end();
    }
}

async function run() {
    var created = await requestJson(apiBase + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    console.log('Created user:', created);

    var fetched = await requestJson(apiBase + '/users/' + created.id);
    console.log('Fetched user:', fetched);
    await printDbStats();
}

run().catch(function (err) {
    console.error(err.message);
    if (err.response) {
        console.error(err.response);
    }
    process.exit(1);
});
