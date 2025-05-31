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
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  
  const dbPath = process.env.DATABASE_URL.replace('file:', '');
  const sqlite = new Database(dbPath);
  db = drizzle({ client: sqlite, schema });
} else {
  // PostgreSQL setup for development
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const ws = require("ws");
  
  neonConfig.webSocketConstructor = ws;
  
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, pool };