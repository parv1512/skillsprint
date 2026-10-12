# SkillSprint — submission draft

## One-line description

A project-based software-learning workspace that connects AI guidance with an evidence-backed learning record across projects.

## Problem and solution

Students often know the project they want to build but struggle to identify the next edit, understand an error, or explain what they learned. SkillSprint turns an idea into a validated roadmap and small practical building steps. Students code in their own editor, request contextual hints or reviews, and retain demonstrated skills in a Learning Passport. A later project recognizes those same skills through canonical identifiers and shows the projects supporting them.

## What AI does

Gemini generates structured roadmaps, scoped lessons, starter skeletons, knowledge questions, and contextual coding assistance. Runtime validation rejects malformed or inconsistent output. Explicit written Passport checks assess one named skill; their results are labeled AI-reviewed understanding rather than code-tested claims. Multiple-choice milestone practice is graded in the application and does not award mastery.

## Integrations

- Auth0: hosted Universal Login and server-managed sessions; server-side ownership checks protect every project and assessment.
- Tiger Data: PostgreSQL persistence for students, projects, milestones, activities, assessments, evidence, and skill records, accessed through Drizzle and node-postgres.
- Gemini: project planning, teaching, and explicit assistance; no automatic retries spend additional provider quota.
- Next.js and TypeScript: one application for the interface and authenticated Node API routes.

## Learning evidence

Practiced requires saved practical work plus student-confirmed milestone completion. Mastered additionally requires a passed written Passport check for that exact skill. Lesson views, Copilot replies, and app-graded multiple-choice practice do not award mastery. SkillSprint does not execute student code. Retained demonstration submissions are labeled samples, not claims about the owner's knowledge.

## Verification and current limits

See BUILD_STATUS.md for actual checks. The AI provider can fail or exhaust quota; input is retained and retries are explicit. Tiger Data enforces one active AI request, 30 attempts per student per ten minutes, 15 AI requests per account per 24 hours, and 45 AI requests for the whole site per 24 hours. New lesson prompts shorten familiar introductions only for practiced/mastered skills supported by practical evidence in another project. Practical edits and independent project completion remain required. This is AI-reviewed understanding and student-confirmed work, not executed-code verification.

## Fields to finish after owner input

- Hacklanta, AI/ML track; intended sponsor integrations: Gemini, Auth0, and Tiger Data. Confirm challenge selections in Devpost.
- Team names and roles.
- Public demo: https://skillsprint.study (original Vercel address: https://skillsprint-inky.vercel.app).
- Final demo video URL; owner confirmed a 2–3 minute video.
- Required screenshots and submission fields.
- Final deployment and acceptance-check results.

Repository: https://github.com/parv1512/skillsprint

Official [event](https://hacklanta.devpost.com/) and [rules](https://hacklanta.devpost.com/rules): deadline October 11, 2026 at 9:00 a.m. Eastern. Confirm team roster, technology list, preexisting-work disclosure, repository access, and judge sign-in instructions before submitting. Phase 6 source was committed and pushed as 31a01f4; Vercel is now connected to main for subsequent deployments. Confirm the latest production build is Ready before recording.

Judges can use Sign in on the public demo to create their own student account. Auth0 dashboard accounts are separate. Every account owns its projects; retained demonstration projects are private to the demo account. Do not publish the owner's credentials. Show those projects in the video, or create a separate judge demonstration account manually if needed.

Build assistance: Codex assisted implementation, verification, and labeled demonstration code. Gemini generated application roadmaps, lessons, starter skeletons, and reviews. Confirm the team's actual timeline and any preexisting material rather than claiming all work was created during the event.

This is a preparation artifact, not an uploaded or submitted entry.
