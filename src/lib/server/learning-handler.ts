import { learningRequestSchema, type LearningRequest } from "../domain/learning";
import { RoadmapError } from "../ai/roadmap";

export async function handleLearningRequest(request: Request, generate: (input: LearningRequest) => Promise<unknown>) {
  const headers = { "Cache-Control": "no-store" };
  const url = new URL(request.url);
  if (request.headers.get("origin") !== `${url.protocol}//${request.headers.get("host") ?? url.host}`) return Response.json({ error: "Use learning assistance from this workspace." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Send learning details as JSON." }, { status: 415, headers });
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 300_000) { await reader.cancel(); return Response.json({ error: "This request is too large. Shorten the code or conversation." }, { status: 413, headers }); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return Response.json({ error: "The learning details couldn’t be read." }, { status: 400, headers }); }
  const input = learningRequestSchema.safeParse(body);
  if (!input.success) return Response.json({ error: "Check your question, answer, and milestone." }, { status: 400, headers });
  try { return Response.json({ result: await generate(input.data) }, { headers }); }
  catch (error) {
    if (error instanceof RoadmapError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
    return Response.json({ error: "Learning assistance failed. Please try again." }, { status: 500, headers });
  }
}
