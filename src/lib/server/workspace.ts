import "server-only";
import { getIdentity } from "../auth";
import { repositoryFor } from "../db/repository";
import { generateLearning } from "../ai/learning";
import { handleWorkspace, safeFailure } from "./workspace-handler";
import { WorkspaceError } from "./errors";

const usage = new Map<string, {started: number; count: number; busy: boolean}>();
export async function withAIQuota<T>(subject: string, work: () => Promise<T>): Promise<T> {
  const now = Date.now();
  for (const [key, entry] of usage) if (!entry.busy && now - entry.started > 600000) usage.delete(key);
  const entry = usage.get(subject) ?? {started: now, count: 0, busy: false};
  if (entry.busy || entry.count >= 30 || usage.size >= 2000 && !usage.has(subject)) throw new WorkspaceError("Please wait before requesting more AI help.", 429);
  entry.busy = true; entry.count++; usage.set(subject, entry);
  try { return await work(); } finally { entry.busy = false; }
}
export async function workspaceRoute(request: Request, operation: Parameters<typeof handleWorkspace>[1], id?: string) {
  try {
    const subject = await getIdentity();
    return handleWorkspace(request, operation, { identity: async () => subject, repository: repositoryFor, generate: input => withAIQuota(subject!, () => generateLearning(input, {apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL})) }, id);
  } catch(error) { return safeFailure(error); }
}
