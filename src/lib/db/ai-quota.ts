import "server-only";
import {createHash, randomUUID} from "node:crypto";
import {sql} from "drizzle-orm";
import {readAIBudgetLimits, type QuotaRefusalReason} from "../server/ai-budget";
import {getDatabase} from "./client";
import {aiUsage} from "./schema";

export const aiUsageKey = (subject:string) => createHash("sha256").update(subject).digest("hex");
class QuotaRefusal extends Error {
  readonly quotaRefusal = true;
  constructor(readonly reason: QuotaRefusalReason) { super(reason); this.name = "QuotaRefusal"; }
}
function findQuotaRefusal(error: unknown): QuotaRefusal | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current === "object" && current !== null && "quotaRefusal" in current && (current as QuotaRefusal).quotaRefusal === true) return current as QuotaRefusal;
    current = current instanceof Error ? current.cause : undefined;
  }
  return null;
}
export const databaseAILeases = {
  async acquire(subject:string) {
    const limits = readAIBudgetLimits();
    const namespace = process.env.AI_BUDGET_NAMESPACE?.trim() || "live";
    const key = aiUsageKey(subject);
    const dailyKey = `budget:${namespace}:student:${key}`;
    const globalKey = `budget:${namespace}:global`;
    const token: string = randomUUID();
    try {
      return await getDatabase().transaction(async tx => {
        await tx.execute(sql`
          INSERT INTO ${aiUsage} (key, window_started, attempts)
          VALUES (${globalKey}, now(), 0), (${dailyKey}, now(), 0)
          ON CONFLICT (key) DO NOTHING`);
        const locked = await tx.execute(sql`
          SELECT key, attempts, window_started <= now() - interval '24 hours' AS reset_due
          FROM ${aiUsage}
          WHERE key IN (${globalKey}, ${dailyKey})
          ORDER BY key
          FOR UPDATE`);
        const rows = locked.rows as {key: string; attempts: number | string; reset_due: boolean | string}[];
        const spent = (budgetKey: string) => {
          const row = rows.find(item => item.key === budgetKey);
          if (!row) throw new Error("AI budget row was not created.");
          return row.reset_due === true || row.reset_due === "t" ? 0 : Number(row.attempts);
        };
        // Shared cap first, so a crowd of new accounts stops before any one account's allowance matters.
        if (spent(globalKey) >= limits.global) throw new QuotaRefusal("site");
        if (spent(dailyKey) >= limits.student) throw new QuotaRefusal("account");
        await tx.execute(sql`
          UPDATE ${aiUsage} SET
            window_started = CASE WHEN window_started <= now() - interval '24 hours' THEN now() ELSE window_started END,
            attempts = CASE WHEN window_started <= now() - interval '24 hours' THEN 1 ELSE attempts + 1 END
          WHERE key IN (${globalKey}, ${dailyKey})`);
        // One atomic upsert serializes callers from different Vercel instances.
        const result = await tx.execute(sql`
          INSERT INTO ${aiUsage} (key, window_started, attempts, lease_token, lease_expires)
          VALUES (${key}, now(), 1, ${token}, now() + interval '150 seconds')
          ON CONFLICT (key) DO UPDATE SET
            window_started = CASE WHEN ${aiUsage.windowStarted} <= now() - interval '10 minutes' THEN now() ELSE ${aiUsage.windowStarted} END,
            attempts = CASE WHEN ${aiUsage.windowStarted} <= now() - interval '10 minutes' THEN 1 ELSE ${aiUsage.attempts} + 1 END,
            lease_token = ${token}, lease_expires = now() + interval '150 seconds'
          WHERE (${aiUsage.leaseExpires} IS NULL OR ${aiUsage.leaseExpires} <= now())
            AND (${aiUsage.windowStarted} <= now() - interval '10 minutes' OR ${aiUsage.attempts} < 30)
          RETURNING key`);
        if (!result.rows.length) throw new QuotaRefusal("busy");
        return token;
      });
    } catch (error) {
      const refusal = findQuotaRefusal(error);
      if (refusal) return {ok: false as const, reason: refusal.reason};
      throw error;
    }
  },
  async release(subject:string,token:string) {
    await getDatabase().execute(sql`UPDATE ${aiUsage} SET lease_token = NULL, lease_expires = NULL WHERE key = ${aiUsageKey(subject)} AND lease_token = ${token}`);
  },
};
