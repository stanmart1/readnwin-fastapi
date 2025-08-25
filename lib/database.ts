import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  host: 'localhost',
});

// Database functions now handled by FastAPI backend
export async function query(sql: string, params?: any[]): Promise<any> {
  console.warn('Direct database queries deprecated - use API client instead');
  return { rows: [] };
}

export async function getConnection(): Promise<any> {
  console.warn('Direct database connections deprecated - use API client instead');
  return null;
}