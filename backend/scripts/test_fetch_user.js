#!/usr/bin/env node
'use strict';

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available; use Node.js 18+.');
}

const apiBase = process.env.API_BASE || 'http://localhost:4516';
const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const payload = {
    email: 'demo_user+' + unique + '@test.com',
    password_hash: 'demo_hash',
    role: 'adopter'
};

async function requestJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const err = new Error('Request failed: ' + res.status);
        err.response = data;
        throw err;
    }
    return data;
}

async function printDbStats() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set for DB stats.');
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        const tablesResult = await connection.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'"
        );
        const tables = tablesResult[0].map(function (row) {
            return row.TABLE_NAME;
        });

        console.log('Tables:', tables.length);
        for (let i = 0; i < tables.length; i += 1) {
            const table = tables[i];
            const countResult = await connection.query('SELECT COUNT(*) AS count FROM `' + table + '`');
            console.log(table + ':', countResult[0][0].count);
        }
    } finally {
        await connection.end();
    }
}

async function run() {
    const created = await requestJson(apiBase + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    console.log('Created user:', created);

    const fetched = await requestJson(apiBase + '/users/' + created.id);
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
