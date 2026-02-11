#!/usr/bin/env node
'use strict';

// Load environment variables from the .env file so the script
// can access the database URL when run from the command line
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Resets the database by dropping it, recreating it,
// and then running the schema and seed SQL files
export async function resetDatabase(databaseUrl, label) {
    if (!databaseUrl) {
        throw new Error(label + ' is required (e.g., mysql://user:pass@localhost:3306/paw_match)');
    }

    // Make sure a database URL was provided
    const url = new URL(databaseUrl);
    // Get the database name from the URL path
    const dbName = url.pathname.replace(/^\//, '');
    if (!dbName) {
        throw new Error(label + ' must include a database name');
    }

    // Create a connection without selecting a database
    // so that the database can be dropped and recreated.
    const adminConnection = await mysql.createConnection({
        host: url.hostname || 'localhost',
        port: url.port ? Number(url.port) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        multipleStatements: true
    });

    try {
        // Drop the database if it exists, then create it again
        await adminConnection.query('DROP DATABASE IF EXISTS ??', [dbName]);
        await adminConnection.query('CREATE DATABASE ??', [dbName]);
    } finally {
        // Always close the admin connection
        await adminConnection.end();
    }

    // Build file paths to the schema and seed SQL files
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    // Read the SQL files into memory.
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const seedSql = await fs.readFile(seedPath, 'utf8');

    // Create a connection to the newly created database.
    // This connection is used to run the schema and seed files.
    const appConnection = await mysql.createConnection({
        host: url.hostname || 'localhost',
        port: url.port ? Number(url.port) : 3306,
        user: url.username || 'root',
        password: url.password || '',
        database: dbName,
        multipleStatements: true
    });

    try {
        // Only run the SQL if the files are not empty
        if (schemaSql.trim()) {
            await appConnection.query(schemaSql);
        }
        // Run the seed file to insert starter data
        if (seedSql.trim()) {
            await appConnection.query(seedSql);
        }
    } finally {
        // Always close the database connection
        await appConnection.end();
    }
}

// This function runs the reset using the DATABASE_URL
async function main() {
    await resetDatabase(process.env.DATABASE_URL, 'DATABASE_URL');
    console.log('Database reset complete.');
}

// This makes sure the script only runs automatically
// when executed directly from the command line
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
