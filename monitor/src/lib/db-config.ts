import sql from 'mssql';

// MSSQL configuration
export const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '49.0.65.19',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: process.env.DB_TIMEOUT ? parseInt(process.env.DB_TIMEOUT) : 30000,
  },
  pool: {
    min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 0,
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  },
};

// Create a connection pool
let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}
