import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { getDatabase } from "../src/lib/db/client";
import { repositoryFor, type WorkspaceRepository } from "../src/lib/db/repository";
import { students, projects, milestones, activities, assessments, evidence, skillRecords, aiUsage } from "../src/lib/db/schema";
import {databaseAILeases,aiUsageKey} from "../src/lib/db/ai-quota";
import { sessionProjectSchema } from "../src/lib/projects/store";
import { emptyActivity } from "../src/lib/domain/learning";
import { confirmMilestone, reopenMilestone } from "../src/lib/projects/progress";
import { handleWorkspace } from "../src/lib/server/workspace-handler";

const enabled = process.env.SKILLSPRINT_DATABASE_TEST === "1";
const budgetNamespace = `itest-${randomUUID()}`;
process.env.AI_BUDGET_NAMESPACE = budgetNamespace;
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
    await db.delete(aiUsage).where(inArray(aiUsage.key,subjects.map(aiUsageKey)));
    await db.delete(aiUsage).where(like(aiUsage.key, `budget:${budgetNamespace}:%`));
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
  it("shares concurrent leases, attempt limits, and expired-lease recovery across callers",async()=>{
    const subject=subjects[0],db=getDatabase(),key=aiUsageKey(subject);
    const leases=await Promise.all([databaseAILeases.acquire(subject),databaseAILeases.acquire(subject)]);
    expect(leases.filter(item => typeof item === "string")).toHaveLength(1);
    const first=leases.find((item): item is string => typeof item === "string");
    if (!first) throw new Error("Expected one AI lease.");
    await databaseAILeases.release(subject,"00000000-0000-4000-8000-000000000099");
    expect(await databaseAILeases.acquire(subject)).toEqual({ok:false,reason:"busy"});
    await databaseAILeases.release(subject,first);
    await db.update(aiUsage).set({attempts:30}).where(eq(aiUsage.key,key));
    expect(await databaseAILeases.acquire(subject)).toEqual({ok:false,reason:"busy"});
    await db.update(aiUsage).set({windowStarted:sql`now() - interval '11 minutes'`}).where(eq(aiUsage.key,key));
    const reset=await databaseAILeases.acquire(subject);
    if (typeof reset !== "string") throw new Error("Expected a reset AI lease.");
    await db.update(aiUsage).set({leaseExpires:sql`now() - interval '1 second'`}).where(eq(aiUsage.key,key));
    const recovered=await databaseAILeases.acquire(subject);
    if (typeof recovered !== "string") throw new Error("Expected a recovered AI lease.");
    await databaseAILeases.release(subject,reset);
    expect(await databaseAILeases.acquire(subject)).toEqual({ok:false,reason:"busy"});
    await databaseAILeases.release(subject,recovered);
  });
  it("stops AI calls at the account cap and then the shared daily cap",async()=>{
    const previousStudent=process.env.AI_STUDENT_DAILY_LIMIT, previousGlobal=process.env.AI_GLOBAL_DAILY_LIMIT, previousNamespace=process.env.AI_BUDGET_NAMESPACE;
    const namespace=`cap-${randomUUID()}`;
    process.env.AI_BUDGET_NAMESPACE=namespace;
    process.env.AI_STUDENT_DAILY_LIMIT="1";
    process.env.AI_GLOBAL_DAILY_LIMIT="2";
    try {
      const first=await databaseAILeases.acquire(subjects[0]);
      expect(first).toEqual(expect.any(String));
      await databaseAILeases.release(subjects[0],first as string);
      expect(await databaseAILeases.acquire(subjects[0])).toEqual({ok:false,reason:"account"});
      const second=await databaseAILeases.acquire(subjects[1]);
      expect(second).toEqual(expect.any(String));
      await databaseAILeases.release(subjects[1],second as string);
      expect(await databaseAILeases.acquire(subjects[1])).toEqual({ok:false,reason:"site"});
    } finally {
      process.env.AI_BUDGET_NAMESPACE=previousNamespace;
      if(previousStudent===undefined)delete process.env.AI_STUDENT_DAILY_LIMIT; else process.env.AI_STUDENT_DAILY_LIMIT=previousStudent;
      if(previousGlobal===undefined)delete process.env.AI_GLOBAL_DAILY_LIMIT; else process.env.AI_GLOBAL_DAILY_LIMIT=previousGlobal;
      await getDatabase().delete(aiUsage).where(like(aiUsage.key,`budget:${namespace}:%`));
    }
  });
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
  it("persists guided position with the authoritative plan and awards no evidence for confirmations alone", async () => {
    const guidedId = randomUUID(); await a.saveProject({...input, id: guidedId});
    const current = (await a.loadProject(guidedId))!;
    const step = {id: "first-edit", title: "Synthetic edit", filePath: "src/App.jsx", concept: "Fixture explanation", instruction: "Synthetic fixture; no real student task", exampleCode: "", expectedResult: "Fixture result", verification: "Fixture check", reflection: "Fixture question"};
    await a.saveGenerated(guidedId, "one", current.revision, {lesson: {sections: [{title: "Fixture", explanation: "Synthetic lesson"}], example: {language: "jsx", code: "// fixture", explanation: "Not executed"}, knowledgeCheck: "Fixture question", guidedSteps: [step, {...step, id: "second-edit"}]}});
    const plan = (await a.loadProject(guidedId))!;
    const before = (await a.passport())[0].evidence.length;
    await a.saveProject({...plan, learning: {one: {...plan.learning!.one, setupConfirmed: true, completedStepIds: [step.id]}}});
    const reloaded = await repositoryFor(subjects[0]);
    const saved = (await reloaded.loadProject(guidedId))!;
    expect(saved.learning!.one.setupConfirmed).toBe(true);
    expect(saved.learning!.one.completedStepIds).toEqual([step.id]);
    expect(saved.completedMilestoneIds).toEqual([]);
    expect((await a.passport())[0].evidence).toHaveLength(before);
    await expect(a.saveProject({...saved, learning: {one: {...saved.learning!.one, lesson: {...saved.learning!.one.lesson!, guidedSteps: [{...step, id: "forged"}]}, completedStepIds: ["forged"]}}})).rejects.toMatchObject({status: 400});
    expect((await a.loadProject(guidedId))!.learning!.one.completedStepIds).toEqual([step.id]);
  }, 30000);
});
