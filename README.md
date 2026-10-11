# SkillSprint

Build real projects, learn with guidance, and carry demonstrated skills into your next idea.

## Current state

Public demo: **https://skillsprint-inky.vercel.app**. Vercel deployment, Auth0 sign-in, stored project loading, and real Gemini roadmap/lesson generation are verified. The Project A → Passport → Project B flow uses retained labeled demonstration work. Follow [the presentation guide](docs/PHASE_6_DEMO.md), [deployment guide](docs/DEPLOYMENT.md), [submission draft](docs/SUBMISSION_DRAFT.md), and [verification record](docs/BUILD_STATUS.md). Hacklanta video recording and submission remain owner actions.

Student-confirmed completion and AI-reviewed explanations are separate records. Practiced requires a saved practical submission and completion confirmation. Mastered additionally requires a passed check targeting the same canonical skill. Neither lesson views nor a tutor reply awards skill mastery. Code snippets are not executed by SkillSprint.

## Local development

Use Node.js 24 (verified with 24.11.1) and npm (verified with 11.6.2). The pinned test tooling and live checks use this runtime.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Copy `.env.example` to `.env.local`, configure Auth0 and DATABASE_URL using [the setup guide](docs/PHASE_4_SETUP.md), and set GEMINI_API_KEY and an account-accessible GEMINI_MODEL (default: gemini-3.5-flash-lite). Never paste secrets into chat or commit environment files. The shell opens without credentials, but all storage and AI endpoints require sign-in.

Signed-in projects use Tiger Data PostgreSQL. Existing browser-session projects are preserved and can be explicitly imported into your account; historical AI reviews and completion reset during import and do not become trusted Passport evidence. Without Auth0 configuration, existing session projects are viewable but new saves and AI calls are refused.

The storage interface lives in `src/lib/projects/store.ts`; `remote-store.ts` supplies authenticated server-backed storage behind the same UI calls. Server queries derive ownership from the Auth0 session. Client-written AI reviews and Passport status are never trusted.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`. Configure the exact APP_BASE_URL callback/logout origin for each environment. Remote database connections enforce certificate-verified TLS. `npm run db:check` verifies connectivity, and `npm run db:migrate` applies the reviewed additive schema. Production uses Vercel; its PEM CA trust configuration is described in the deployment guide.

Default tests do not call Gemini. They check validation, provider failures, timeouts, session persistence, and independent project progress. To run the opt-in live test in PowerShell (consumes Gemini quota):

```powershell
$env:SKILLSPRINT_LIVE_TEST = '1'
npm test -- tests/gemini.live.test.ts
Remove-Item Env:\SKILLSPRINT_LIVE_TEST
```

The live test writes its non-sensitive sample roadmap to ignored `.tmp/live-roadmap.json`. A read-only model availability check is available with `node scripts/check-gemini.mjs`. Adding `--probe` sends two small generation requests and consumes quota.

Additional optional checks: set SKILLSPRINT_DATABASE_TEST=1 to run tests/database.live.test.ts, or SKILLSPRINT_LEARNING_LIVE_TEST=1 to run tests/learning.live.test.ts. The database suite creates two isolated synthetic profiles and removes only their records afterward. The learning suite makes one real targeted question/review pair and awards no student evidence. The Vitest server-only alias is test-only; production still uses Next.js server boundaries.

Ordinary help and knowledge checks use low reasoning on the approved Flash model; lessons, starter files, and full solutions keep default reasoning. Checks use focused context and concise response budgets. Quizzes/reviews can take up to two minutes. Gemini has intermittently returned 503/timeouts during verification; retries are explicit, never automatic, and failures do not create passing evidence.

## Try the learning workspace

1. Create or open a project and select a milestone.
2. In **Build**, get starter files, extract the ZIP, open the folder in your editor, and follow the setup instructions. Supported files display as indented multiline code with line numbers; copied and downloaded source uses the same formatting. SkillSprint does not execute the generated code.
3. Create or preview building steps. Follow one precise edit at a time: the file to change, the concept, expected result, and how to check it. Give me a hint and Explain this prepare contextual Copilot questions. Paste code for a review opens the notes section; Review this step prepares a review question without sending it. Save attempt stores your notes. I finished this step saves student-confirmed step progress. Read [the guided workspace guide](docs/GUIDED_BUILD.md) for old-project compatibility and formatting limits.
4. In **Your work**, review the original tasks, saved code/notes, and criteria. Confirm each criterion to mark the milestone complete. Prerequisites must be completed first. Setup and guided-step confirmations do not complete milestones or award mastery.
5. Answer the check and choose **Check understanding** for an explicitly labeled AI review. Editing the answer clears the previous review.
6. In **Copilot**, ask for a hint, explanation, debugging help, code review, or a short example. **Full solution** is an explicit mode. Current work and up to 12 recent messages are sent as context.

Use **Save work** before navigating away. Saved lessons, work, assessments, conversations, and progress persist in your signed-in account. In **Your work → Passport skill check**, choose a specific skill to demonstrate understanding. The general milestone check is feedback rather than evidence for every skill. Passport records link to supporting projects. Known skills appear above the building steps with their Passport status and earlier project. The closed Concept notes and example dropdown stays available for review. Take the Passport check opens the targeted written check on Your work; generating a question remains explicit. Practical progress in each project stays independent.

Completed milestones retain evidenced skill statuses and a View Learning Passport link under their title. Milestone multiple-choice answers keep their options visible and label correct and incorrect answers; they do not change Passport status. Reload a second open tab to see work saved in another tab. Retained Phase 5 demonstration submissions are labeled Codex-written samples and are not claims about the account owner's learning.

## Structure

- `src/app`: pages, layout, loading and error boundaries, global design styles.
- `src/components`: reusable application shell, icons, and empty states.
- `src/lib/domain`: canonical skills, shared contracts and Zod validation.
- `src/lib/ai`: Gemini structured generation and safe provider errors.
- `src/lib/server`: request validation and origin checks.
- `src/lib/projects`: storage interface, validation, remote and legacy session adapters.
- `src/lib/db`: seven learning tables, one shared AI quota table, ownership-scoped repository, and TLS connection configuration.
- `src/lib/auth.ts` and `src/proxy.ts`: Auth0 server sessions and authentication routing.
- `drizzle`: reviewed additive SQL migrations and metadata.
- `tests`: behavioral validation checks.
- `docs`: build status, phase checkpoints, and planned service boundaries.

Auth0, Gemini, and database secrets stay on the server. Tiger Data enforces one active AI request and 30 attempts per student per ten minutes across Vercel instances. New lessons shorten introductions for practiced/mastered skills supported by practical work in another project; implementation tasks and optional concept notes remain.

## Development workflow

GitHub source of truth: https://github.com/parv1512/skillsprint. Work is reviewed in phases. Report checks before committing and obtain product-owner approval before pushing. Never force-push or commit secrets.

See [build status](docs/BUILD_STATUS.md) and [architecture](docs/ARCHITECTURE.md).
