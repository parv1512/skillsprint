import { pgTable, uuid, text, timestamp, jsonb, integer, uniqueIndex, unique, index, foreignKey } from "drizzle-orm/pg-core";
import type { ProjectIntake, Milestone } from "../domain/types";
import type { LearningActivity, KnowledgeReview } from "../domain/learning";

const created = () => timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull();
export const students = pgTable("skillsprint_students", { id: uuid().primaryKey().defaultRandom(), subject: text().notNull().unique(), createdAt: created() });
export const projects = pgTable("skillsprint_projects", {
  id: uuid().primaryKey(), ownerId: uuid("owner_id").notNull().references(() => students.id), intake: jsonb().$type<ProjectIntake & {learningGoals?: string}>().notNull(),
  title: text().notNull(), summary: text().notNull(), scopeNotes: text("scope_notes").notNull(), revision: integer().notNull().default(0), createdAt: created(),
}, table => [unique("skillsprint_projects_owner_id").on(table.ownerId, table.id), index("skillsprint_projects_owner_created").on(table.ownerId, table.createdAt)]);
export const milestones = pgTable("skillsprint_milestones", {
  id: text().notNull(), projectId: uuid("project_id").notNull(), ownerId: uuid("owner_id").notNull(), position: integer().notNull(), content: jsonb().$type<Milestone>().notNull(),
}, table => [unique("skillsprint_milestone_identity").on(table.ownerId, table.projectId, table.id), uniqueIndex("skillsprint_milestone_position").on(table.projectId, table.position), foreignKey({ name: "skillsprint_milestone_project_fk", columns: [table.ownerId, table.projectId], foreignColumns: [projects.ownerId, projects.id] })]);
export const activities = pgTable("skillsprint_activities", {
  ownerId: uuid("owner_id").notNull(), projectId: uuid("project_id").notNull(), milestoneId: text("milestone_id").notNull(), data: jsonb().$type<LearningActivity>().notNull(),
}, table => [uniqueIndex("skillsprint_activity_identity").on(table.ownerId, table.projectId, table.milestoneId), foreignKey({ name: "skillsprint_activity_milestone_fk", columns: [table.ownerId, table.projectId, table.milestoneId], foreignColumns: [milestones.ownerId, milestones.projectId, milestones.id] })]);
export const assessments = pgTable("skillsprint_assessments", {
  id: uuid().primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull(), projectId: uuid("project_id").notNull(), milestoneId: text("milestone_id").notNull(), skillId: text("skill_id").notNull(), question: text().notNull(),
  answer: text().notNull().default(""), review: jsonb().$type<KnowledgeReview>(), model: text().notNull(), createdAt: created(), reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
}, table => [index("skillsprint_assessment_owner").on(table.ownerId, table.projectId), foreignKey({ name: "skillsprint_assessment_milestone_fk", columns: [table.ownerId, table.projectId, table.milestoneId], foreignColumns: [milestones.ownerId, milestones.projectId, milestones.id] })]);
export const evidence = pgTable("skillsprint_evidence", {
  id: uuid().primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull(), projectId: uuid("project_id").notNull(), milestoneId: text("milestone_id").notNull(), skillId: text("skill_id").notNull(),
  kind: text().$type<"student-work" | "ai-check">().notNull(), eventKey: text("event_key").notNull(), snapshot: text().notNull(), assessmentId: uuid("assessment_id").references(() => assessments.id), createdAt: created(),
}, table => [uniqueIndex("skillsprint_evidence_event").on(table.ownerId, table.eventKey, table.skillId), index("skillsprint_evidence_skill").on(table.ownerId, table.skillId), foreignKey({ name: "skillsprint_evidence_milestone_fk", columns: [table.ownerId, table.projectId, table.milestoneId], foreignColumns: [milestones.ownerId, milestones.projectId, milestones.id] })]);
export const skillRecords = pgTable("skillsprint_skill_records", {
  ownerId: uuid("owner_id").notNull().references(() => students.id), skillId: text("skill_id").notNull(), status: text().$type<"new" | "practiced" | "mastered">().notNull().default("new"),
  lastDemonstratedAt: timestamp("last_demonstrated_at", { withTimezone: true, mode: "string" }), preference: text().$type<"skip" | "review" | "refresher">().notNull().default("review"),
}, table => [uniqueIndex("skillsprint_skill_owner").on(table.ownerId, table.skillId)]);
