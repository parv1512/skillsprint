CREATE TABLE "skillsprint_ai_usage" (
	"key" text PRIMARY KEY NOT NULL,
	"window_started" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_token" uuid,
	"lease_expires" timestamp with time zone
);
