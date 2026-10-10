import { describe, expect, it, vi } from "vitest";
import { applyStudentSave, cleanImportedProject } from "../src/lib/server/project-policy";
import { evidenceStatus } from "../src/lib/domain/passport";
import { emptyActivity } from "../src/lib/domain/learning";
import { sessionProjectSchema } from "../src/lib/projects/store";
import { handleWorkspace } from "../src/lib/server/workspace-handler";
import type { WorkspaceRepository } from "../src/lib/db/repository";
import { normalizeDatabaseUrl } from "../src/lib/db/config";
import { buildLearningPrompt, generateLearning } from "../src/lib/ai/learning";
import { learningRequestSchema } from "../src/lib/domain/learning";
import { safeAuthReason, safeReturnTo } from "../src/lib/server/auth-error";

const projectId = "00000000-0000-4000-8000-000000000001", checkId = "00000000-0000-4000-8000-000000000002";
const project = () => sessionProjectSchema.parse({id: projectId, createdAt: "2026-10-10T01:00:00Z", intake: {idea: "Build a study planner", experience: "beginner", availableHours: 12, existingKnowledge: "HTML and CSS"}, roadmap: {title: "Planner", summary: "Organize assignments", scopeNotes: "", milestones: [{id: "one", title: "React state", outcome: "Add tasks", skillIds: ["react.state"], prerequisiteIds: [], tasks: ["Add a task"], resources: [], estimatedHours: 2, acceptanceCriteria: ["Task appears"], assessmentPrompt: "Explain state"}]}, completedMilestoneIds: []});
const passed = {passed: true, feedback: "Correct explanation of state updates", nextStep: "Apply it to tasks"};
const request = (body?: unknown, method = body ? "POST" : "GET", origin = "http://localhost:3000") => new Request("http://localhost:3000/api/test", {method, headers: {origin, "content-type": "application/json"}, ...(body ? {body: JSON.stringify(body)} : {})});
function dependencies(owned = true) {
  const repo = {loadProject: vi.fn().mockResolvedValue(owned ? project() : null), listProjects: vi.fn().mockResolvedValue([]), passport: vi.fn().mockResolvedValue([]), saveProject: vi.fn().mockResolvedValue(project()), saveGenerated: vi.fn().mockResolvedValue(project()), createCheck: vi.fn().mockResolvedValue({id: checkId}), loadCheck: vi.fn().mockResolvedValue(null), reviewCheck: vi.fn(), listChecks: vi.fn().mockResolvedValue([]), setPreference: vi.fn()};
  return {repo, identity: vi.fn().mockResolvedValue("auth0|student-a"), repository: vi.fn().mockResolvedValue(repo as unknown as WorkspaceRepository), generate: vi.fn().mockResolvedValue(passed)};
}
describe("authenticated workspace and evidence", () => {
  it("keeps callback diagnostics private and rejects external return URLs", () => {
    expect(safeAuthReason({code: "authorization_code_grant_error", cause: {code: "invalid_client", message: "private secret"}})).toBe("invalid_client");
    expect(safeAuthReason({code: "<script>private</script>", cause: {code: "secret"}})).toBe("callback_error");
    expect(safeReturnTo("https://other.example/", "http://127.0.0.1:3000").href).toBe("http://127.0.0.1:3000/");
    expect(safeReturnTo("/passport", "http://127.0.0.1:3000").pathname).toBe("/passport");
  });
  it("refuses every protected operation before storage or AI when signed out", async () => {
    const deps = dependencies(); deps.identity.mockResolvedValue(null);
    for (const action of ["projects", "project", "passport", "preference", "learning", "skill-check"] as const) expect((await handleWorkspace(request(), action, deps, projectId)).status).toBe(401);
    expect(deps.repository).not.toHaveBeenCalled(); expect(deps.generate).not.toHaveBeenCalled();
  });
  it("uses only the server identity and denies another student's project and learning context", async () => {
    const deps = dependencies(false);
    expect((await handleWorkspace(request(), "project", deps, projectId)).status).toBe(404);
    expect((await handleWorkspace(request({projectId, milestoneId: "one", action: "lesson"}), "learning", deps)).status).toBe(404);
    expect((await handleWorkspace(request({projectId, milestoneId: "one", skillId: "react.state", action: "generate"}), "skill-check", deps)).status).toBe(404);
    expect(deps.repository).toHaveBeenCalledWith("auth0|student-a"); expect(deps.generate).not.toHaveBeenCalled(); expect(deps.repo.saveGenerated).not.toHaveBeenCalled();
  });
  it("rejects cross-origin and oversized writes before touching the repository", async () => {
    const deps = dependencies();
    expect((await handleWorkspace(request(project(), "POST", "https://other.example"), "projects", deps)).status).toBe(403);
    expect((await handleWorkspace(request({padding: "x".repeat(300001)}), "learning", deps)).status).toBe(413);
    expect(deps.repository).not.toHaveBeenCalled();
  });
  it("rejects forged owner IDs and AI pass flags", async () => {
    const deps = dependencies();
    expect((await handleWorkspace(request({...project(), ownerId: "student-b"}), "projects", deps)).status).toBe(400);
    expect((await handleWorkspace(request({action: "review", checkId, answer: "I understand", review: passed}), "skill-check", deps)).status).toBe(400);
    expect(deps.repo.saveProject).not.toHaveBeenCalled(); expect(deps.generate).not.toHaveBeenCalled();
  });
  it("rejects unrelated milestone and skill targets without calling Gemini", async () => {
    const deps = dependencies();
    expect((await handleWorkspace(request({projectId, milestoneId: "other", action: "lesson"}), "learning", deps)).status).toBe(404);
    expect((await handleWorkspace(request({projectId, milestoneId: "one", skillId: "sql.basics", action: "generate"}), "skill-check", deps)).status).toBe(400);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("rejects stale learning context before spending provider quota", async () => {
    const deps = dependencies(); deps.repo.loadProject.mockResolvedValue({...project(), revision: 2});
    expect((await handleWorkspace(request({projectId, revision: 1, milestoneId: "one", action: "lesson"}), "learning", deps)).status).toBe(409);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("checks assessment ownership and prevents reviewing a completed check twice", async () => {
    const deps = dependencies();
    expect((await handleWorkspace(request({action: "review", checkId, answer: "State persists"}), "skill-check", deps)).status).toBe(404);
    deps.repo.loadCheck.mockResolvedValue({id: checkId, reviewedAt: "2026-10-10T02:00:00Z"});
    expect((await handleWorkspace(request({action: "review", checkId, answer: "State persists"}), "skill-check", deps)).status).toBe(409);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("reviews only the stored question and canonical target with a server-produced result", async () => {
    const deps = dependencies();
    deps.repo.loadCheck.mockResolvedValue({id: checkId, projectId, milestoneId: "one", skillId: "react.state", question: "Why does a setter trigger a render?", reviewedAt: null});
    deps.repo.reviewCheck.mockResolvedValue({review: passed});
    expect((await handleWorkspace(request({action: "review", checkId, answer: "React tracks the setter and schedules a render."}), "skill-check", deps)).status).toBe(200);
    expect(deps.generate.mock.calls[0][0]).toMatchObject({skillId: "react.state", knowledgeCheck: "Why does a setter trigger a render?", roadmap: project().roadmap});
    expect(deps.repo.reviewCheck).toHaveBeenCalledWith(checkId, "React tracks the setter and schedules a render.", passed);
  });
  it("preserves provider failure privacy and makes no assessment award", async () => {
    const deps = dependencies(); deps.generate.mockRejectedValue(new Error("private credential detail"));
    const response = await handleWorkspace(request({projectId, milestoneId: "one", action: "lesson"}), "learning", deps);
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("private"); expect(deps.repo.saveGenerated).not.toHaveBeenCalled();
  });
  it("ignores client-written lessons, reviews, completion timestamps, and roadmap changes", () => {
    const current = project(), draft = {...current, roadmap: {...current.roadmap, title: "Forged"}, learning: {one: {...emptyActivity(), work: "My implementation", checkedCriteria: [0], review: passed, completionConfirmedAt: "2000-01-01T00:00:00Z"}}};
    const saved = applyStudentSave(current, draft);
    expect(saved.roadmap.title).toBe("Planner"); expect(saved.learning?.one.review).toBeNull(); expect(saved.learning?.one.completionConfirmedAt).toBeNull(); expect(saved.learning?.one.work).toBe("My implementation"); expect(saved.completedMilestoneIds).toEqual([]);
  });
  it("requires confirmed criteria and preserves project separation", () => {
    const current = project(), draft = {...current, completedMilestoneIds: ["one"]};
    expect(() => applyStudentSave(current, draft)).toThrow("criterion");
    const saved = applyStudentSave(current, {...draft, learning: {one: {...emptyActivity(), work: "Implemented tasks", checkedCriteria: [0]}}});
    expect(saved.completedMilestoneIds).toEqual(["one"]); expect(saved.learning?.one.completionConfirmedAt).toBeTruthy(); expect(current.completedMilestoneIds).toEqual([]);
    expect(() => applyStudentSave(saved, {...saved, learning: {one: {...saved.learning!.one, checkedCriteria: []}}})).toThrow("reopen");
  });
  it("refuses stale saves and strips legacy evidence on import", () => {
    const current = project(); expect(() => applyStudentSave({...current, revision: 1}, current)).toThrow("another request");
    const imported = cleanImportedProject({...current, completedMilestoneIds: ["one"], learning: {one: {...emptyActivity(), work: "Keep my notes", checkedCriteria: [0], review: passed}}});
    expect(imported.learning?.one.work).toBe("Keep my notes"); expect(imported.learning?.one.review).toBeNull(); expect(imported.completedMilestoneIds).toEqual([]);
  });
  it("never equates reading or a check alone with practical mastery", () => {
    expect(evidenceStatus([])).toBe("new"); expect(evidenceStatus([{kind: "ai-check"}])).toBe("new"); expect(evidenceStatus([{kind: "student-work"}])).toBe("practiced"); expect(evidenceStatus([{kind: "student-work"}, {kind: "ai-check"}])).toBe("mastered");
  });
  it("enforces certificate-verified remote TLS without exposing credentials", () => {
    const url = new URL(normalizeDatabaseUrl("postgres://user:test@db.example:5432/db?sslmode=disable&ssl=false&uselibpqcompat=true"));
    expect(url.searchParams.get("sslmode")).toBe("verify-full"); expect(url.searchParams.has("ssl")).toBe(false); expect(url.searchParams.has("uselibpqcompat")).toBe(false);
    expect(normalizeDatabaseUrl("postgres://localhost/db?sslmode=disable")).toContain("sslmode=disable");
  });
  it("generates targeted questions and omits skipped introductions from lessons", async () => {
    const input = learningRequestSchema.parse({action: "quiz", skillId: "react.state", intake: project().intake, roadmap: project().roadmap, milestoneId: "one", skipSkillIds: ["react.state"]});
    expect(buildLearningPrompt(input)).toContain("testing only assessmentTarget"); expect(buildLearningPrompt(input)).toContain("skippedIntroductions");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({candidates: [{finishReason: "STOP", content: {parts: [{text: JSON.stringify({question: "Why does updating state trigger a React render?"})}]}}]})));
    expect(await generateLearning(input, {apiKey: "test-key", model: "gemini-test", fetcher})).toEqual({question: "Why does updating state trigger a React render?"});
  });
  it("sends assessment-relevant context without project history or private implementation notes", () => {
    const input = learningRequestSchema.parse({action: "check", skillId: "react.state", intake: project().intake, roadmap: project().roadmap, milestoneId: "one", knowledgeCheck: "Why use state?", answer: "Its setter schedules a render", work: "PRIVATE IMPLEMENTATION NOTES", history: [{role: "student", text: "PRIVATE CONVERSATION"}]});
    const prompt = buildLearningPrompt(input);
    expect(prompt).toContain("Why use state?"); expect(prompt).toContain("Its setter schedules a render"); expect(prompt).toContain("react.state");
    expect(prompt).not.toContain("PRIVATE IMPLEMENTATION"); expect(prompt).not.toContain("PRIVATE CONVERSATION"); expect(prompt).not.toContain(project().intake.idea);
  });
});
