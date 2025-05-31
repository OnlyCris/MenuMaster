import Database from 'better-sqlite3';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if using SQLite (file: prefix) or PostgreSQL
const isSQLite = process.env.DATABASE_URL.startsWith('file:');

let db: any;
let pool: any;

if (isSQLite) {
  // SQLite setup for production
  const dbPath = process.env.DATABASE_URL.replace('file:', '');
  const sqlite = new Database(dbPath);
  db = drizzleSQLite({ client: sqlite, schema });
} else {
  // PostgreSQL setup for development
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { db, pool };