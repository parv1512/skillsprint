import "server-only";
import { getIdentity } from "../auth";
import { repositoryFor } from "../db/repository";
import { generateLearning } from "../ai/learning";
import { handleWorkspace, safeFailure } from "./workspace-handler";
import {databaseAILeases} from "../db/ai-quota";
import {withSharedAIQuota} from "./ai-quota";

export async function withAIQuota<T>(subject: string, work: () => Promise<T>): Promise<T> {
  return withSharedAIQuota(subject,work,databaseAILeases);
}
export async function workspaceRoute(request: Request, operation: Parameters<typeof handleWorkspace>[1], id?: string) {
  try {
    const subject = await getIdentity();
    return handleWorkspace(request, operation, { identity: async () => subject, repository: repositoryFor, generate: input => withAIQuota(subject!, () => generateLearning(input, {apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL})) }, id);
  } catch(error) { return safeFailure(error); }
}
