import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Build DATABASE_URL from individual components if not set
function buildDatabaseUrl() {
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || 'menuisland';
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE || 'menuisland';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

const databaseUrl = process.env.DATABASE_URL || buildDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set or PostgreSQL connection details (PGHOST, PGUSER, etc.) must be provided"
  );
}

console.log('Database connection:', {
  url: databaseUrl.replace(/:[^:@]*@/, ':***@'), // Hide password in logs
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'menuisland'
});

// Check if we're using Neon (contains neon.tech) or local PostgreSQL
const isNeonDatabase = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon.') || databaseUrl.includes('pooler.');

let pool: any;
let db: any;

if (isNeonDatabase) {
  // Use Neon serverless for cloud databases
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema });
} else {
  // Use standard PostgreSQL driver for local databases
  pool = new PgPool({ connectionString: databaseUrl });
  db = drizzlePg({ client: pool, schema });
}

export { pool, db };