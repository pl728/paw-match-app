#!/usr/bin/env node
'use strict';

import dotenv from 'dotenv';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resetDatabase } from './reset_db.js';

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export async function runTests() {
    if (!process.env.TEST_DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL is required (e.g., mysql://user:pass@localhost:3306/paw_match_test)');
    }

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await resetDatabase(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
    console.log('Test database reset complete.');

    await new Promise(function (resolve, reject) {
        var backendRoot = path.join(__dirname, '..');
        var configPath = path.join(backendRoot, 'jest.config.cjs');
        var jestBin = path.join(backendRoot, 'node_modules', 'jest', 'bin', 'jest.js');

        var child = spawn(process.execPath, ['--experimental-vm-modules', jestBin, '--config', configPath], {
            stdio: 'inherit',
            shell: false,
            cwd: backendRoot
        });
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

var isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    runTests().catch(function (err) {
        console.error(err.message);
        process.exit(1);
    });
}
