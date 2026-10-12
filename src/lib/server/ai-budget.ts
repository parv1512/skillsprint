export type QuotaRefusalReason = "busy" | "account" | "site";

const FALLBACK_STUDENT_DAILY = 15;
const FALLBACK_GLOBAL_DAILY = 45;

export function readAIBudgetLimits(env: Record<string, string | undefined> = process.env) {
  return {
    student: boundedInteger(env.AI_STUDENT_DAILY_LIMIT, FALLBACK_STUDENT_DAILY),
    global: boundedInteger(env.AI_GLOBAL_DAILY_LIMIT, FALLBACK_GLOBAL_DAILY),
  };
}

function boundedInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5000 ? parsed : fallback;
}

export function quotaRefusalMessage(reason: QuotaRefusalReason, limits = readAIBudgetLimits()) {
  if (reason === "site") return `SkillSprint has reached its shared limit of ${limits.global} AI requests per 24 hours. Saved work is unchanged.`;
  if (reason === "account") return `This account has reached its limit of ${limits.student} AI requests per 24 hours. Saved work is unchanged.`;
  return "Please wait before requesting more AI help.";
}
