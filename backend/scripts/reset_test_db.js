#!/usr/bin/env node
'use strict';

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resetDatabase } from './reset_db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export async function resetTestDatabase() {
    await resetDatabase(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    console.log('Test database reset complete.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    resetTestDatabase().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
