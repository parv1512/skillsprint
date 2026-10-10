import { describe, expect, it } from "vitest";
import { projectIntakeSchema, resourceSchema, roadmapSchema, skillIdSchema } from "../src/lib/domain/validation";

const milestone = (id: string, prerequisiteIds: string[] = []) => ({ id, title: "Build a form", outcome: "Collect a project idea", skillIds: ["react.state"], prerequisiteIds, tasks: ["Implement inputs"], resources: [], estimatedHours: 2, acceptanceCriteria: ["Inputs accept text"], assessmentPrompt: "Explain controlled inputs" });
const roadmap = { title: "Study planner", summary: "Build a useful planner", milestones: [milestone("first"), milestone("second", ["first"])] };

describe("project intake", () => {
  it("accepts and trims a realistic project idea", () => {
    expect(projectIntakeSchema.parse({ idea: "  Build a study planner  ", experience: "beginner", availableHours: 12, existingKnowledge: "Basic HTML and CSS" }).idea).toBe("Build a study planner");
  });
  it("rejects unusable time budgets", () => {
    expect(projectIntakeSchema.safeParse({ idea: "Build a study planner", experience: "beginner", availableHours: 0, existingKnowledge: "" }).success).toBe(false);
  });
});

describe("structured roadmaps", () => {
  it("accepts ordered dependencies", () => expect(roadmapSchema.safeParse(roadmap).success).toBe(true));
  it("rejects missing or forward dependencies", () => {
    expect(roadmapSchema.safeParse({ ...roadmap, milestones: [milestone("first", ["second"]), milestone("second")] }).success).toBe(false);
    expect(roadmapSchema.safeParse({ ...roadmap, milestones: [milestone("first", ["missing"])] }).success).toBe(false);
  });
  it("rejects duplicate identifiers and self dependencies", () => {
    expect(roadmapSchema.safeParse({ ...roadmap, milestones: [milestone("first"), milestone("first")] }).success).toBe(false);
    expect(roadmapSchema.safeParse({ ...roadmap, milestones: [milestone("first", ["first"])] }).success).toBe(false);
  });
  it("rejects malformed AI output", () => expect(roadmapSchema.safeParse({ title: "Plan", milestones: "Build something" }).success).toBe(false));
});

describe("resource and skill safety", () => {
  it("rejects executable URLs", () => expect(resourceSchema.safeParse({ title: "Docs", url: "javascript:alert(1)", verified: false }).success).toBe(false));
  it("requires normalized skill identifiers", () => {
    expect(skillIdSchema.safeParse("react.state").success).toBe(true);
    expect(skillIdSchema.safeParse("React State!").success).toBe(false);
  });
});
