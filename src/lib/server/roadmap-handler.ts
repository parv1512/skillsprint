import { projectIntakeSchema } from "../domain/validation";
import type { ProjectIntake, Roadmap } from "../domain/types";
import { RoadmapError } from "../ai/roadmap";

const MAX_REQUEST_BYTES = 8192;
export async function handleRoadmapRequest(request: Request, generate: (intake: ProjectIntake) => Promise<Roadmap>) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  // Next.js may use localhost in request.url while preserving 127.0.0.1 in Host.
  // Compare to the actual incoming host, never to a client-selected forwarded host.
  const requestUrl = new URL(request.url);
  const expectedOrigin = `${requestUrl.protocol}//${request.headers.get("host") ?? requestUrl.host}`;
  if (!origin || origin !== expectedOrigin) return Response.json({ error: "Please generate a roadmap from this workspace.", code: "ORIGIN_REJECTED" }, { status: 403, headers });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Send project details as JSON.", code: "INVALID_CONTENT_TYPE" }, { status: 415, headers });
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return Response.json({ error: "Your project details are too long.", code: "TOO_LARGE" }, { status: 413, headers });
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return Response.json({ error: "The project details could not be read.", code: "INVALID_JSON" }, { status: 400, headers }); }
  const intake = projectIntakeSchema.safeParse(body);
  if (!intake.success) return Response.json({ error: "Check your project details and try again.", code: "INVALID_INPUT", fields: intake.error.flatten().fieldErrors }, { status: 400, headers });
  try { return Response.json({ roadmap: await generate(intake.data) }, { headers }); }
  catch (error) {
    if (error instanceof RoadmapError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
    return Response.json({ error: "Something went wrong creating your roadmap. Please try again.", code: "INTERNAL_ERROR" }, { status: 500, headers });
  }
}
