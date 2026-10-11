import "server-only";
import {createHash, randomUUID} from "node:crypto";
import {sql} from "drizzle-orm";
import {getDatabase} from "./client";
import {aiUsage} from "./schema";

export const aiUsageKey = (subject:string) => createHash("sha256").update(subject).digest("hex");
export const databaseAILeases = {
  async acquire(subject:string) {
    const key=aiUsageKey(subject), token=randomUUID();
    // One atomic upsert serializes callers from different Vercel instances.
    const result=await getDatabase().execute(sql`
      INSERT INTO ${aiUsage} (key, window_started, attempts, lease_token, lease_expires)
      VALUES (${key}, now(), 1, ${token}, now() + interval '150 seconds')
      ON CONFLICT (key) DO UPDATE SET
        window_started = CASE WHEN ${aiUsage.windowStarted} <= now() - interval '10 minutes' THEN now() ELSE ${aiUsage.windowStarted} END,
        attempts = CASE WHEN ${aiUsage.windowStarted} <= now() - interval '10 minutes' THEN 1 ELSE ${aiUsage.attempts} + 1 END,
        lease_token = ${token}, lease_expires = now() + interval '150 seconds'
      WHERE (${aiUsage.leaseExpires} IS NULL OR ${aiUsage.leaseExpires} <= now())
        AND (${aiUsage.windowStarted} <= now() - interval '10 minutes' OR ${aiUsage.attempts} < 30)
      RETURNING key`);
    return result.rows.length ? token : null;
  },
  async release(subject:string,token:string) {
    await getDatabase().execute(sql`UPDATE ${aiUsage} SET lease_token = NULL, lease_expires = NULL WHERE key = ${aiUsageKey(subject)} AND lease_token = ${token}`);
  },
};
