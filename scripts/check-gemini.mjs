// Read-only account check. Prints model availability and sanitized API error metadata.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY is missing; configure it in .env.local.");
const model = process.env.GEMINI_MODEL;
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
  headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(15000),
});
const body = await response.json();
if (!response.ok) {
  console.log(JSON.stringify({ status: response.status, apiStatus: body.error?.status ?? "unknown" }));
  process.exitCode = 1;
} else {
  const models = body.models ?? [];
  console.log(JSON.stringify({ status: response.status, configuredModel: model, available: models.some((item) => item.name === `models/${model}`), flashModels: models.filter((item) => item.name.includes("flash") && item.supportedGenerationMethods?.includes("generateContent")).map((item) => item.name) }));
}
if (process.argv.includes("--probe") && model) {
  for (const [name, generationConfig] of [["text", {}], ["simple-json", { responseMimeType: "application/json", responseSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }]]) {
    const probe = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000),
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Return a short title for a study planner project." }] }], generationConfig }),
    });
    const result = await probe.json();
    console.log(JSON.stringify({ probe: name, status: probe.status, apiStatus: result.error?.status, finishReason: result.candidates?.[0]?.finishReason }));
  }
}
