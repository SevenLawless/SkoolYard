import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export interface DatabaseConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
}

/**
 * Initialize database connection pool
 * Supports both local MySQL and Railway MySQL via DATABASE_URL or individual config
 */
export function initDatabase(config?: DatabaseConfig): mysql.Pool {
  if (pool) {
    return pool;
  }

  const connectionLimit = config?.connectionLimit || 10;

  // Check if DATABASE_URL is provided (Railway format)
  if (process.env.DATABASE_URL) {
    try {
      // Parse Railway MySQL connection string
      // Format: mysql://user:password@host:port/database
      const url = new URL(process.env.DATABASE_URL);
      pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading '/'
        waitForConnections: true,
        connectionLimit,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
      console.log('Database pool created from DATABASE_URL');
      return pool;
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
      throw new Error('Invalid DATABASE_URL format');
    }
  }

  // Use individual config or environment variables (local MySQL Workbench)
  pool = mysql.createPool({
    host: config?.host || process.env.DB_HOST || 'localhost',
    port: config?.port || parseInt(process.env.DB_PORT || '3306'),
    user: config?.user || process.env.DB_USER || 'root',
    password: config?.password || process.env.DB_PASSWORD || '',
    database: config?.database || process.env.DB_NAME || 'schoolyard',
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  console.log('Database pool created with individual config');
  return pool;
}

/**
 * Get the database connection pool
 * Initializes if not already initialized
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    return initDatabase();
  }
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close the database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

