import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { normalizeDatabaseUrl } from "./config";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDatabase() {
  if (database) return database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Persistent storage is not configured.");
  // TLS configuration comes from the Tiger Data connection URL. Never disable certificate validation.
  const pool = new Pool({ connectionString: normalizeDatabaseUrl(connectionString), max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000, statement_timeout: 15000, query_timeout: 20000 });
  pool.on("error", () => console.error("A database connection became unavailable."));
  return database = drizzle(pool, { schema });
}
