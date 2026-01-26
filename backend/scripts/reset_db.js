#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var fs = require('fs/promises');
var path = require('path');
var mysql = require('mysql2/promise');

async function resetDatabase(databaseUrl, label) {
    if (!databaseUrl) {
        throw new Error(label + ' is required (e.g., mysql://user:pass@localhost:3306/paw_match)');
    }

    var url = new URL(databaseUrl);
    var dbName = url.pathname.replace(/^\//, '');
    if (!dbName) {
        throw new Error(label + ' must include a database name');
    }

    var adminConnection = await mysql.createConnection({
        host: url.hostname || 'localhost',
        port: url.port ? Number(url.port) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        multipleStatements: true
    });

    try {
        await adminConnection.query('DROP DATABASE IF EXISTS ??', [dbName]);
        await adminConnection.query('CREATE DATABASE ??', [dbName]);
    } finally {
        await adminConnection.end();
    }

    var schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    var seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    var schemaSql = await fs.readFile(schemaPath, 'utf8');
    var seedSql = await fs.readFile(seedPath, 'utf8');

    var appConnection = await mysql.createConnection({
        host: url.hostname || 'localhost',
        port: url.port ? Number(url.port) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        database: dbName,
        multipleStatements: true
    });

    try {
        if (schemaSql.trim()) {
            await appConnection.query(schemaSql);
        }
        if (seedSql.trim()) {
            await appConnection.query(seedSql);
        }
    } finally {
        await appConnection.end();
    }
}

async function main() {
    await resetDatabase(process.env.DATABASE_URL, 'DATABASE_URL');
    console.log('Database reset complete.');
}

if (require.main === module) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = { resetDatabase: resetDatabase };
