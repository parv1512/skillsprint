import "server-only";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { handleRoadmapRequest } from "@/lib/server/roadmap-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Authentication is connected in Phase 4. Do not expose a paid API endpoint publicly before then.
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Project generation is available in the local workspace until sign-in is connected.", code: "AUTH_PENDING" }, { status: 503 });
  return handleRoadmapRequest(request, (intake) => generateRoadmap(intake, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL }));
}
