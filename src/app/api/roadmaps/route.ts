import "server-only";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { handleRoadmapRequest } from "@/lib/server/roadmap-handler";
import { getIdentity } from "@/lib/auth";
import { withAIQuota } from "@/lib/server/workspace";
import { safeFailure } from "@/lib/server/workspace-handler";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const subject = await getIdentity();
    if (!subject) return Response.json({error: "Sign in to create a project."}, {status: 401, headers: {"Cache-Control": "no-store"}});
    return handleRoadmapRequest(request, intake => withAIQuota(subject, () => generateRoadmap(intake, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL })));
  } catch(error) { return safeFailure(error); }
}
