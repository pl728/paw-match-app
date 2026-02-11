#!/usr/bin/env node
'use strict';

// Load environment variables from the .env file so the script
// can access the database URL when run from the command line
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

var fs = require('fs/promises');
var path = require('path');
var mysql = require('mysql2/promise');

// Resets the database by dropping it, recreating it,
// and then running the schema and seed SQL files
async function resetDatabase(databaseUrl, label) {
    // Make sure a database URL was provided
    if (!databaseUrl) {
        throw new Error(label + ' is required (e.g., mysql://user:pass@localhost:3306/paw_match)');
    }

    // Make sure a database URL was provided
    var url = new URL(databaseUrl);
    // Get the database name from the URL path
    var dbName = url.pathname.replace(/^\//, '');
    if (!dbName) {
        throw new Error(label + ' must include a database name');
    }

    // Create a connection without selecting a database.
    // so that the database can be dropped and recreated.
    var adminConnection = await mysql.createConnection({
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
    var schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    var seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    // Read the SQL files into memory.
    var schemaSql = await fs.readFile(schemaPath, 'utf8');
    var seedSql = await fs.readFile(seedPath, 'utf8');

    // Create a connection to the newly created database.
    // This connection is used to run the schema and seed files.
    var appConnection = await mysql.createConnection({
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
if (require.main === module) {
    main().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}

// Export the function so it can be reused
module.exports = { resetDatabase: resetDatabase };
