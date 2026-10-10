CREATE TABLE "skillsprint_activities" (
	"owner_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" text NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skillsprint_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"review" jsonb,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skillsprint_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"kind" text NOT NULL,
	"event_key" text NOT NULL,
	"snapshot" text NOT NULL,
	"assessment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skillsprint_milestones" (
	"id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "skillsprint_milestone_identity" UNIQUE("owner_id","project_id","id")
);
--> statement-breakpoint
CREATE TABLE "skillsprint_projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"intake" jsonb NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"scope_notes" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skillsprint_projects_owner_id" UNIQUE("owner_id","id")
);
--> statement-breakpoint
CREATE TABLE "skillsprint_skill_records" (
	"owner_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"last_demonstrated_at" timestamp with time zone,
	"preference" text DEFAULT 'review' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skillsprint_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skillsprint_students_subject_unique" UNIQUE("subject")
);
--> statement-breakpoint
ALTER TABLE "skillsprint_activities" ADD CONSTRAINT "skillsprint_activity_milestone_fk" FOREIGN KEY ("owner_id","project_id","milestone_id") REFERENCES "public"."skillsprint_milestones"("owner_id","project_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_assessments" ADD CONSTRAINT "skillsprint_assessment_milestone_fk" FOREIGN KEY ("owner_id","project_id","milestone_id") REFERENCES "public"."skillsprint_milestones"("owner_id","project_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_evidence" ADD CONSTRAINT "skillsprint_evidence_assessment_id_skillsprint_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."skillsprint_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_evidence" ADD CONSTRAINT "skillsprint_evidence_milestone_fk" FOREIGN KEY ("owner_id","project_id","milestone_id") REFERENCES "public"."skillsprint_milestones"("owner_id","project_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_milestones" ADD CONSTRAINT "skillsprint_milestone_project_fk" FOREIGN KEY ("owner_id","project_id") REFERENCES "public"."skillsprint_projects"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_projects" ADD CONSTRAINT "skillsprint_projects_owner_id_skillsprint_students_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."skillsprint_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skillsprint_skill_records" ADD CONSTRAINT "skillsprint_skill_records_owner_id_skillsprint_students_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."skillsprint_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "skillsprint_activity_identity" ON "skillsprint_activities" USING btree ("owner_id","project_id","milestone_id");--> statement-breakpoint
CREATE INDEX "skillsprint_assessment_owner" ON "skillsprint_assessments" USING btree ("owner_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skillsprint_evidence_event" ON "skillsprint_evidence" USING btree ("owner_id","event_key","skill_id");--> statement-breakpoint
CREATE INDEX "skillsprint_evidence_skill" ON "skillsprint_evidence" USING btree ("owner_id","skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skillsprint_milestone_position" ON "skillsprint_milestones" USING btree ("project_id","position");--> statement-breakpoint
CREATE INDEX "skillsprint_projects_owner_created" ON "skillsprint_projects" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "skillsprint_skill_owner" ON "skillsprint_skill_records" USING btree ("owner_id","skill_id");