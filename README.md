# SkillSprint

Build real projects, learn with guidance, and carry demonstrated skills into your next idea.

## Current state

Phase 3: personalized Gemini roadmaps, starter files with explanations and ZIP download, milestone lessons and worked examples, saved practical work, AI-reviewed knowledge checks, and a contextual hint-first copilot. The approved Field Notes design keeps the interface focused and concise.

Auth0 sign-in, Tiger Data persistence, Learning Passport evidence, and cross-project skill reuse are **not connected yet**. Student-confirmed completion and AI-reviewed explanations are separate records. Neither lesson views nor a tutor reply awards skill mastery. Code snippets are not executed by SkillSprint.

## Local development

Use Node.js 24 (verified with 24.11.1) and npm (verified with 11.6.2). The pinned test tooling and live checks use this runtime.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The app shell needs no credentials. For roadmap and learning assistance, copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and use an account-accessible `GEMINI_MODEL` (default: `gemini-3.8-flash`). Never paste secrets into chat or commit environment files.

Projects are stored in **sessionStorage for the current tab**. They survive refreshes but are not associated with a signed-in account or synchronized across devices. Closing the tab ends the temporary workspace; browser session restore may retain it. Avoid sensitive project details on shared devices.

The storage interface lives in `src/lib/projects/store.ts`; the session adapter lives in `src/lib/projects/session-store.ts`. The UI calls `saveProject`, `loadProject`, and `listProjects`. Phase 4 will provide authenticated server-backed storage and ownership checks.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`. **Roadmap and learning APIs are deliberately disabled in production until server authentication is connected in Phase 4.** Use the local development server for the current demonstration.

Default tests do not call Gemini. They check validation, provider failures, timeouts, session persistence, and independent project progress. To run the opt-in live test in PowerShell (consumes Gemini quota):

```powershell
$env:SKILLSPRINT_LIVE_TEST = '1'
npm test -- tests/gemini.live.test.ts
Remove-Item Env:\SKILLSPRINT_LIVE_TEST
```

The live test writes its non-sensitive sample roadmap to ignored `.tmp/live-roadmap.json`. A read-only model availability check is available with `node scripts/check-gemini.mjs`. Adding `--probe` sends two small generation requests and consumes quota.

## Try the learning workspace

1. Create or open a project and select a milestone.
2. In the first milestone’s **Learn** tab, choose **Create starter files** for a minimal file structure, code, setup steps, and a first task. Inspect the files or download the ZIP to use in your editor. Generated starters have not been executed by SkillSprint and leave project features for you to implement. Choose **Create lesson** for guidance. This makes one Gemini request; the lesson is saved for reuse.
3. In **Your work**, follow the tasks, paste code or notes, and save. Confirm each criterion to mark the milestone complete. Prerequisites must be completed first. Completion is student-confirmed; the knowledge check is independent.
4. Answer the check and choose **Check understanding** for an explicitly labeled AI review. Editing the answer clears the previous review.
5. In **Copilot**, ask for a hint, explanation, debugging help, code review, or a short example. **Full solution** is an explicit mode. Current work and up to 12 recent messages are sent as context.

Use **Save work** before navigating away. Saved lessons, work, assessments, conversations, and progress survive refresh in the same session. No skills are written to the Passport yet.

## Structure

- `src/app`: pages, layout, loading and error boundaries, global design styles.
- `src/components`: reusable application shell, icons, and empty states.
- `src/lib/domain`: canonical skills, shared contracts and Zod validation.
- `src/lib/ai`: Gemini structured generation and safe provider errors.
- `src/lib/server`: request validation and origin checks.
- `src/lib/projects`: storage interface, validation, and session adapter.
- `tests`: behavioral validation checks.
- `docs`: build status, phase checkpoints, and planned service boundaries.

Passport, authentication, and database services will be added in their approved phases. Gemini credentials stay on the server. No deployment provider has been selected.

## Development workflow

GitHub source of truth: https://github.com/parv1512/skillsprint. Work is reviewed in phases. Report checks before committing and obtain product-owner approval before pushing. Never force-push or commit secrets.

See [build status](docs/BUILD_STATUS.md) and [architecture](docs/ARCHITECTURE.md).
