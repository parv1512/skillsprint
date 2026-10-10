import { describe, expect, it } from "vitest";
import { createSessionProjectStore } from "../src/lib/projects/session-store";
import type { SessionProject } from "../src/lib/projects/store";
import { emptyActivity } from "../src/lib/domain/learning";

const makeProject = (id: string): SessionProject => ({
  id, createdAt: "2026-10-10T01:00:00.000Z", completedMilestoneIds: [],
  intake: { idea: "Build a study planner", experience: "beginner", availableHours: 10, existingKnowledge: "Basic HTML and CSS" },
  roadmap: { title: "Planner", summary: "Build a planner", scopeNotes: "", milestones: [{ id: "one", title: "First task", outcome: "Add inputs", skillIds: ["react.state"], prerequisiteIds: [], tasks: ["Add inputs"], resources: [], estimatedHours: 2, acceptanceCriteria: ["Inputs work"], assessmentPrompt: "Explain state" }] },
});
const firstId = "00000000-0000-4000-8000-000000000001";
const secondId = "00000000-0000-4000-8000-000000000002";
const memoryStorage = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
};

describe("temporary project storage", () => {
  it("retains milestone work and tutor context across refresh without sharing it between projects", async () => {
    const storage = memoryStorage();
    const store = createSessionProjectStore(storage);
    await store.saveProject({ ...makeProject(firstId), learning: { one: { ...emptyActivity(), work: "Student code", answer: "My explanation", review: { passed: true, feedback: "Correct", nextStep: "Apply it" }, reviewedAnswer: "My explanation", messages: [{ role: "student", text: "Why state?" }, { role: "tutor", text: "State triggers rendering", code: "setCount(count + 1)", nextStep: "Try it" }] } } });
    await store.saveProject(makeProject(secondId));
    const reloaded = createSessionProjectStore(storage);
    expect((await reloaded.loadProject(firstId))?.learning?.one.messages[1].code).toBe("setCount(count + 1)");
    expect((await reloaded.loadProject(firstId))?.learning?.one.answer).toBe("My explanation");
    expect((await reloaded.loadProject(secondId))?.learning).toBeUndefined();
    expect((await reloaded.loadProject(firstId))?.completedMilestoneIds).toEqual([]);
  });
  it("preserves older goals without treating them as existing knowledge", async () => {
    const project = makeProject(firstId);
    const { existingKnowledge: _knowledge, ...intake } = project.intake;
    const legacy = { ...project, intake: { ...intake, learningGoals: "Learn React" } };
    const storage = memoryStorage();
    storage.setItem("skillsprint.projects.v1", JSON.stringify({ version: 1, projects: [legacy] }));
    const loaded = await createSessionProjectStore(storage).loadProject(firstId);
    expect(loaded?.intake.existingKnowledge).toBe("Not provided");
    expect(loaded?.intake.learningGoals).toBe("Learn React");
    expect(loaded?.roadmap).toEqual(project.roadmap);
  });
  it("starts empty and survives adapter recreation in the same session", async () => {
    const storage = memoryStorage();
    const store = createSessionProjectStore(storage);
    expect(await store.listProjects()).toEqual([]);
    await store.saveProject(makeProject(firstId));
    expect((await createSessionProjectStore(storage).loadProject(firstId))?.roadmap.title).toBe("Planner");
  });
  it("keeps separate project progress and updates without duplicates", async () => {
    const store = createSessionProjectStore(memoryStorage());
    await store.saveProject(makeProject(firstId));
    await store.saveProject(makeProject(secondId));
    await store.saveProject({ ...makeProject(firstId), completedMilestoneIds: ["one"] });
    expect((await store.loadProject(firstId))?.completedMilestoneIds).toEqual(["one"]);
    expect((await store.loadProject(secondId))?.completedMilestoneIds).toEqual([]);
    expect(await store.listProjects()).toHaveLength(2);
  });
  it("does not overwrite corrupt data", async () => {
    let value = "not-json";
    const store = createSessionProjectStore({ getItem: () => value, setItem: (_key, next) => { value = next; } });
    await expect(store.saveProject(makeProject(firstId))).rejects.toThrow("hasn’t been overwritten");
    expect(value).toBe("not-json");
  });
  it("reports unavailable storage", async () => {
    const store = createSessionProjectStore({ getItem: () => null, setItem: () => { throw new Error("quota exceeded"); } });
    await expect(store.saveProject(makeProject(firstId))).rejects.toThrow("couldn’t save");
  });
  it("rejects completion records outside the project", async () => {
    const store = createSessionProjectStore(memoryStorage());
    await expect(store.saveProject({ ...makeProject(firstId), completedMilestoneIds: ["unrelated"] })).rejects.toThrow();
    expect(await store.loadProject("missing")).toBeNull();
  });
});
