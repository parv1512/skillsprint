import nextEnv from "@next/env";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { normalizeDatabaseUrl } from "../src/lib/db/config.ts";
nextEnv.loadEnvConfig(process.cwd());
let pool;
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing in .env.local.");
  pool = new pg.Pool({connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL), connectionTimeoutMillis: 10000, max: 1});
  await pool.query("select 1");
  const tls = await pool.query("select ssl from pg_stat_ssl where pid = pg_backend_pid()");
  console.log(`Database connection verified. TLS ${tls.rows[0]?.ssl ? "active" : "inactive (local connection only)"}.`);
  if (process.argv.includes("--migrate")) {
    await migrate(drizzle(pool), {migrationsFolder: "./drizzle"});
    console.log("SkillSprint additive migrations applied.");
  }
} catch(error) {
  console.error(process.env.DATABASE_URL ? `Database operation failed (${error.code ?? error.name ?? "connection error"}). Check connection, credentials, and trusted TLS certificates locally.` : "DATABASE_URL is missing in .env.local.");
  process.exitCode = 1;
} finally {await pool?.end();}
