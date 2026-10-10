# SkillSprint

Build real projects, learn with guidance, and carry demonstrated skills into your next idea.

## Current state

Phase 4 implementation: Auth0 Universal Login, authenticated Tiger Data storage through Drizzle, Passport evidence, targeted skill checks, and canonical cross-project recognition now join the Gemini roadmap and guided learning workspace. The approved Field Notes design keeps the interface focused and concise. Live verification status is recorded in `docs/BUILD_STATUS.md`.

Student-confirmed completion and AI-reviewed explanations are separate records. Practiced requires a saved practical submission and completion confirmation. Mastered additionally requires a passed check targeting the same canonical skill. Neither lesson views nor a tutor reply awards skill mastery. Code snippets are not executed by SkillSprint.

## Local development

Use Node.js 24 (verified with 24.11.1) and npm (verified with 11.6.2). The pinned test tooling and live checks use this runtime.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Copy `.env.example` to `.env.local`, configure Auth0 and DATABASE_URL using [the setup guide](docs/PHASE_4_SETUP.md), and set GEMINI_API_KEY and an account-accessible GEMINI_MODEL (default: gemini-3.7-flash). Never paste secrets into chat or commit environment files. The shell opens without credentials, but all storage and AI endpoints require sign-in.

Signed-in projects use Tiger Data PostgreSQL. Existing browser-session projects are preserved and can be explicitly imported into your account; historical AI reviews and completion reset during import and do not become trusted Passport evidence. Without Auth0 configuration, existing session projects are viewable but new saves and AI calls are refused.

The storage interface lives in `src/lib/projects/store.ts`; `remote-store.ts` supplies authenticated server-backed storage behind the same UI calls. Server queries derive ownership from the Auth0 session. Client-written AI reviews and Passport status are never trusted.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`. Configure the exact APP_BASE_URL callback/logout origin for each environment. Remote database connections enforce certificate-verified TLS. `npm run db:check` verifies connectivity, and `npm run db:migrate` applies the reviewed additive schema. No deployment provider has been selected.

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
2. In the first milestone’s **Learn** tab, choose **Create starter files** for a minimal file structure, code, setup steps, and a first task. Inspect the files or download the ZIP to use in your editor. Generated starters have not been executed by SkillSprint and leave project features for you to implement. Choose **Create lesson** for guidance. This makes one Gemini request; the lesson is saved for reuse.
3. In **Your work**, follow the tasks, paste code or notes, and save. Confirm each criterion to mark the milestone complete. Prerequisites must be completed first. Completion is student-confirmed; the knowledge check is independent.
4. Answer the check and choose **Check understanding** for an explicitly labeled AI review. Editing the answer clears the previous review.
5. In **Copilot**, ask for a hint, explanation, debugging help, code review, or a short example. **Full solution** is an explicit mode. Current work and up to 12 recent messages are sent as context.

Use **Save work** before navigating away. Saved lessons, work, assessments, conversations, and progress persist in your signed-in account. In **Your work → Passport skill check**, choose a specific skill to demonstrate understanding. The general milestone check is feedback rather than evidence for every skill. Passport records link to supporting projects. Known skills offer skip/review/refresher choices; practical progress in each project stays independent.

## Structure

- `src/app`: pages, layout, loading and error boundaries, global design styles.
- `src/components`: reusable application shell, icons, and empty states.
- `src/lib/domain`: canonical skills, shared contracts and Zod validation.
- `src/lib/ai`: Gemini structured generation and safe provider errors.
- `src/lib/server`: request validation and origin checks.
- `src/lib/projects`: storage interface, validation, remote and legacy session adapters.
- `src/lib/db`: seven-table schema, ownership-scoped repository, and TLS connection configuration.
- `src/lib/auth.ts` and `src/proxy.ts`: Auth0 server sessions and authentication routing.
- `drizzle`: reviewed additive SQL migrations and metadata.
- `tests`: behavioral validation checks.
- `docs`: build status, phase checkpoints, and planned service boundaries.

Auth0, Gemini, and database secrets stay on the server. AI request limits currently operate per process; shared limits and deployment choices remain Phase 6 considerations.

## Development workflow

GitHub source of truth: https://github.com/parv1512/skillsprint. Work is reviewed in phases. Report checks before committing and obtain product-owner approval before pushing. Never force-push or commit secrets.

See [build status](docs/BUILD_STATUS.md) and [architecture](docs/ARCHITECTURE.md).
