import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// En local se lee api/.env o el .env de la raíz; en Docker las variables llegan por env_file.
dotenv.config({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')], quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().min(1).default('2h'),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Variables de entorno inválidas o faltantes:\n${issues}`);
}

const parsed = result.data;

export const env = Object.freeze({
  nodeEnv: parsed.NODE_ENV,
  isProduction: parsed.NODE_ENV === 'production',
  isTest: parsed.NODE_ENV === 'test',
  port: parsed.API_PORT,
  db: Object.freeze({
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    name: parsed.POSTGRES_DB,
    user: parsed.POSTGRES_USER,
    password: parsed.POSTGRES_PASSWORD,
  }),
  jwt: Object.freeze({
    secret: parsed.JWT_SECRET,
    expiresIn: parsed.JWT_EXPIRES_IN,
  }),
  corsOrigins: Object.freeze(parsed.CORS_ORIGIN),
});
