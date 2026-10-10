import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "../src/lib/db/client";
import { repositoryFor, type WorkspaceRepository } from "../src/lib/db/repository";
import { students, projects, milestones, activities, assessments, evidence, skillRecords } from "../src/lib/db/schema";
import { sessionProjectSchema } from "../src/lib/projects/store";
import { emptyActivity } from "../src/lib/domain/learning";
import { confirmMilestone, reopenMilestone } from "../src/lib/projects/progress";
import { handleWorkspace } from "../src/lib/server/workspace-handler";

const enabled = process.env.SKILLSPRINT_DATABASE_TEST === "1";
describe.skipIf(!enabled)("Tiger Data persistence and ownership (isolated synthetic students)", () => {
  let a: WorkspaceRepository, b: WorkspaceRepository;
  const subjects = [0, 1].map(() => `skillsprint-integration-test|${randomUUID()}`);
  const id = randomUUID(), second = randomUUID();
  const input = sessionProjectSchema.parse({id, createdAt: new Date().toISOString(), intake: {idea: "Integration fixture: build a study planner", experience: "beginner", availableHours: 5, existingKnowledge: "HTML and CSS"}, roadmap: {title: "Isolated integration fixture", summary: "Test storage only; no real student demonstration", scopeNotes: "", milestones: [{id: "one", title: "State fixture", outcome: "Test state", skillIds: ["react.state"], prerequisiteIds: [], tasks: ["Fixture task"], resources: [], estimatedHours: 1, acceptanceCriteria: ["Fixture criterion"], assessmentPrompt: "Explain state"}]}, completedMilestoneIds: []});
  beforeAll(async () => {
    // Load only the connection URL without logging it. Production APIs still use Auth0, not these test subjects.
    const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find(item => item.startsWith("DATABASE_URL="));
    if (!line) throw new Error("DATABASE_URL is missing.");
    const value = line.slice("DATABASE_URL=".length).trim();
    process.env.DATABASE_URL = value.startsWith('"') ? JSON.parse(value) : value;
    process.env.GEMINI_MODEL ??= "integration-fixture-no-provider-call";
    a = await repositoryFor(subjects[0]); b = await repositoryFor(subjects[1]);
  }, 30000);
  afterAll(async () => {
    // Delete only the two synthetic profiles created by this run, using exact subjects and IDs.
    const db = getDatabase(); const rows = await db.select().from(students).where(inArray(students.subject, subjects));
    const owners = rows.map(row => row.id);
    if (owners.length) await db.transaction(async tx => {
      await tx.delete(evidence).where(inArray(evidence.ownerId, owners));
      await tx.delete(assessments).where(inArray(assessments.ownerId, owners));
      await tx.delete(activities).where(inArray(activities.ownerId, owners));
      await tx.delete(milestones).where(inArray(milestones.ownerId, owners));
      await tx.delete(projects).where(inArray(projects.ownerId, owners));
      await tx.delete(skillRecords).where(inArray(skillRecords.ownerId, owners));
      await tx.delete(students).where(and(inArray(students.id, owners), inArray(students.subject, subjects)));
    });
    await db.$client.end();
  }, 30000);
  it("persists project data and refuses another owner's ID without modifying it", async () => {
    await a.saveProject(input);
    expect((await a.loadProject(id))?.roadmap.title).toBe(input.roadmap.title);
    expect(await b.loadProject(id)).toBeNull(); expect(await b.listProjects()).toEqual([]);
    await expect(b.saveProject(input)).rejects.toMatchObject({status: 409});
    expect((await a.loadProject(id))?.completedMilestoneIds).toEqual([]);
  }, 30000);
  it("records practice from actual save flow; forged client reviews cannot award mastery", async () => {
    const current = (await a.loadProject(id))!;
    const work = {...emptyActivity(), work: "SYNTHETIC integration fixture only; not a real student submission", checkedCriteria: [0], review: {passed: true, feedback: "FORGED", nextStep: "FORGED"}};
    await a.saveProject(confirmMilestone(current, "one", work));
    const passport = await a.passport();
    expect(passport[0].status).toBe("practiced"); expect(passport[0].evidence).toHaveLength(1); expect(passport[0].evidence[0].kind).toBe("student-work");
    expect((await a.loadProject(id))?.learning?.one.review).toBeNull(); expect(await b.passport()).toEqual([]);
  }, 30000);
  it("targets one skill, refuses another student's assessment, and prevents duplicate reviews", async () => {
    const check = await a.createCheck(id, "one", "react.state", "SYNTHETIC fixture question: why does state trigger a render?");
    expect(await b.loadCheck(check.id)).toBeNull();
    const generate = vi.fn();
    const request = new Request("http://localhost/api/skill-checks", {method: "POST", headers: {origin: "http://localhost", "content-type": "application/json"}, body: JSON.stringify({action: "review", checkId: check.id, answer: "Attempted access"})});
    expect((await handleWorkspace(request, "skill-check", {identity: async () => subjects[1], repository: repositoryFor, generate})).status).toBe(404); expect(generate).not.toHaveBeenCalled();
    await a.reviewCheck(check.id, "SYNTHETIC correct answer fixture", {passed: true, feedback: "SYNTHETIC review fixture; Gemini not called", nextStep: "Fixture only"});
    expect((await a.passport())[0].status).toBe("mastered");
    await expect(a.reviewCheck(check.id, "duplicate", {passed: true, feedback: "duplicate", nextStep: "duplicate"})).rejects.toMatchObject({status: 409});
    expect((await a.passport())[0].evidence).toHaveLength(2);
  }, 30000);
  it("keeps new practical progress independent and preserves preferences across repository reloads", async () => {
    await a.saveProject({...input, id: second});
    expect((await a.loadProject(second))?.completedMilestoneIds).toEqual([]);
    await a.setPreference("react.state", "skip");
    const reopened = await repositoryFor(subjects[0]);
    expect((await reopened.passport())[0].preference).toBe("skip");
    const current = (await a.loadProject(id))!;
    await a.saveProject(reopenMilestone(current, "one"));
    expect((await a.passport())[0].status).toBe("mastered");
    const latest = (await a.loadProject(id))!;
    await a.saveProject(confirmMilestone(latest, "one", latest.learning!.one));
    expect((await a.passport())[0].evidence).toHaveLength(2);
    await expect(a.saveProject(latest)).rejects.toMatchObject({status: 409});
  }, 30000);
  it("records a practical submission added after completion, without duplicating unchanged work", async () => {
    const third = randomUUID(); await a.saveProject({...input, id: third});
    const current = (await a.loadProject(third))!;
    await a.saveProject(confirmMilestone(current, "one", {...emptyActivity(), checkedCriteria: [0]}));
    const confirmed = (await a.loadProject(third))!;
    await a.saveProject({...confirmed, learning: {one: {...confirmed.learning!.one, work: "SYNTHETIC late submission fixture"}}});
    expect((await a.passport())[0].evidence.filter(item => item.projectId === third)).toHaveLength(1);
    const saved = (await a.loadProject(third))!; await a.saveProject(saved);
    expect((await a.passport())[0].evidence.filter(item => item.projectId === third)).toHaveLength(1);
  }, 30000);
});
