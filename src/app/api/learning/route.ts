import "server-only";
import { generateLearning } from "@/lib/ai/learning";
import { handleLearningRequest } from "@/lib/server/learning-handler";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Learning assistance is local-only until sign-in is connected.", code: "AUTH_PENDING" }, { status: 503 });
  return handleLearningRequest(request, (input) => generateLearning(input, { apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL }));
}
