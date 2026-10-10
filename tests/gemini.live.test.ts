import { expect, it } from "vitest";
import { loadEnvFile } from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import { generateRoadmap } from "../src/lib/ai/roadmap";

// Opt-in only: this contacts Gemini and may consume account quota.
it.skipIf(process.env.SKILLSPRINT_LIVE_TEST !== "1")("generates a real validated roadmap", async () => {
  loadEnvFile(".env.local");
  const key = process.env.GEMINI_API_KEY;
  const fetcher: typeof fetch = async (url, options) => {
    const response = await fetch(url, options);
    if (!response.ok) {
      const metadata = await response.clone().json().catch(() => null);
      const message = String(metadata?.error?.message ?? "No diagnostic message").split(key ?? "unused-placeholder").join("[redacted]").replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 1200);
      console.error("Gemini diagnostic:", { status: response.status, apiStatus: metadata?.error?.status, message });
    }
    return response;
  };
  const roadmap = await generateRoadmap({ idea: "Build a study planner for one student to add assignments, due dates, and view this week's tasks. No accounts or notifications.", experience: "beginner", preferredStack: "React and TypeScript", availableHours: 12, existingKnowledge: "Basic HTML and CSS; no React experience." }, { apiKey: key, model: process.env.GEMINI_MODEL, fetcher });
  expect(roadmap.milestones.length).toBeGreaterThan(0);
  expect(roadmap.milestones.reduce((sum, milestone) => sum + milestone.estimatedHours, 0)).toBeLessThanOrEqual(12);
  await mkdir(".tmp", { recursive: true });
  await writeFile(".tmp/live-roadmap.json", JSON.stringify(roadmap, null, 2));
}, 60_000);
