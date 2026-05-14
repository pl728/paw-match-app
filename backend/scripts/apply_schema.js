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

export async function applySchema(databaseUrl = process.env.DATABASE_URL) {
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.replace(/^\//, '');
    if (!dbName) {
        throw new Error('DATABASE_URL must include a database name');
    }

    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    if (!schemaSql.trim()) {
        return;
    }

    const connection = await mysql.createConnection({
        host: url.hostname || 'localhost',
        port: url.port ? Number(url.port) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        database: dbName,
        multipleStatements: true
    });

    try {
        await connection.query(schemaSql);
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = 'users'
               AND COLUMN_NAME = 'email_verified_at'`,
            [dbName]
        );
        if (columns.length === 0) {
            await connection.query('ALTER TABLE users ADD COLUMN email_verified_at DATETIME DEFAULT NULL AFTER email');
        }
    } finally {
        await connection.end();
    }
}

async function main() {
    await applySchema();
    console.log('Database schema applied.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
