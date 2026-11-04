// Config de sequelize-cli (CommonJS). En Docker las variables llegan por env_file;
// en local se leen de api/.env o del .env de la raíz.
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({
  path: [path.resolve(__dirname, '..', '.env'), path.resolve(__dirname, '..', '..', '.env')],
  quiet: true,
});

const required = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'DB_HOST'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno para sequelize-cli: ${missing.join(', ')}`);
}

const base = {
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
  migrationStorageTableName: 'SequelizeMeta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeData',
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
