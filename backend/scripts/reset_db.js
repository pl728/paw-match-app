#!/usr/bin/env node
'use strict';

import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export async function resetDatabase(databaseUrl, label) {
    if (!databaseUrl) {
        throw new Error(label + ' is required (e.g., mysql://user:pass@localhost:3306/paw_match)');
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.replace(/^\//, '');
    if (!dbName) {
        throw new Error(label + ' must include a database name');
    }

    const adminConnection = await mysql.createConnection({
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

    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const seedSql = await fs.readFile(seedPath, 'utf8');

    const appConnection = await mysql.createConnection({
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

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
