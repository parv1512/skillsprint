import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { normalizeDatabaseUrl } from "./src/lib/db/config";
loadEnvConfig(process.cwd());
export default defineConfig({ schema: "./src/lib/db/schema.ts", out: "./drizzle", dialect: "postgresql", dbCredentials: { url: process.env.DATABASE_URL ? normalizeDatabaseUrl(process.env.DATABASE_URL) : "" } });
