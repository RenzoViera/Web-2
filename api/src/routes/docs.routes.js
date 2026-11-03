import { readFileSync } from 'node:fs';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

const openapiPath = new URL('../../docs/openapi.yaml', import.meta.url);
const openapiDocument = parse(readFileSync(openapiPath, 'utf8'));

export const docsRoutes = Router();

docsRoutes.get('/openapi.json', (_req, res) => res.json(openapiDocument));
docsRoutes.use('/', swaggerUi.serve, swaggerUi.setup(openapiDocument, { customSiteTitle: 'MiniAula API' }));
