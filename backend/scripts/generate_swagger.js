import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerAutogen from 'swagger-autogen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const routesDir = path.join(projectRoot, 'routes');
const routeFiles = fs
    .readdirSync(routesDir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join(routesDir, name));

const endpointsFiles = [path.join(projectRoot, 'main.js')];
const outputFile = path.join(projectRoot, 'swagger-output.json');

const doc = {
    openapi: '3.0.0',
    info: {
        title: 'Paw Match API',
        version: '1.0.0',
        description: 'Auto-generated OpenAPI spec for the Paw Match API.'
    },
    servers: [
        {
            url: process.env.API_BASE_URL || 'http://localhost:4516'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    }
};

const swagger = swaggerAutogen({ openapi: '3.0.0', autoHeaders: true });

try {
    await swagger(outputFile, endpointsFiles, doc);
    // eslint-disable-next-line no-console
    console.log(`Swagger spec generated at ${outputFile}`);
} catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to generate Swagger spec', err);
    process.exit(1);
}
