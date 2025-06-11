import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Production-compatible import for pg module
let PgPool: any;

// Try multiple import strategies for maximum compatibility
async function loadPostgresPool() {
  try {
    // Method 1: Try dynamic import
    const pgModule = await import('pg');
    return pgModule.default?.Pool || pgModule.Pool;
  } catch (error1) {
    try {
      // Method 2: Try CommonJS require with createRequire
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      const pg = require('pg');
      return pg.Pool;
    } catch (error2) {
      try {
        // Method 3: Direct require (fallback)
        const pg = require('pg');
        return pg.Pool;
      } catch (error3) {
        console.error('All pg import methods failed:', { error1, error2, error3 });
        throw new Error('PostgreSQL driver not available. Please ensure pg is installed.');
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Neon (contains neon.tech) or local PostgreSQL
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') || 
                      process.env.DATABASE_URL.includes('neon.') || 
                      process.env.DATABASE_URL.includes('pooler.') || 
                      process.env.DATABASE_URL.includes('@ep-');

let pool: any;
let db: any;

// Initialize database connection
if (isNeonDatabase) {
  // Use Neon serverless for cloud databases
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
} else {
  // Load PostgreSQL Pool dynamically for local databases
  try {
    PgPool = await loadPostgresPool();
    pool = new PgPool({ connectionString: process.env.DATABASE_URL });
    db = drizzlePg({ client: pool, schema });
  } catch (error) {
    console.error('Failed to initialize PostgreSQL connection:', error);
    throw error;
  }
}

export { pool, db };