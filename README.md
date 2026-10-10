# SkillSprint

Build real projects, learn with guidance, and carry demonstrated skills into your next idea.

## Current state

Phase 2: live Gemini project intake and structured roadmap generation, ordered milestone briefs, canonical skills, official references, and temporary session project storage. The approved Field Notes design uses warm paper backgrounds, serif headings, and restrained forest-green accents.

Auth0 sign-in, Tiger Data persistence, guided lessons, Gemini tutoring, verified assessments, learning evidence, and cross-project skill reuse are **not connected yet**. Roadmaps are recommendations, not evidence. Milestone briefs can be opened; completion is not awarded for viewing them.

## Local development

Use Node.js 24 (verified with 24.11.1) and npm (verified with 11.6.2). The pinned test tooling and live checks use this runtime.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The app shell needs no credentials. For roadmap generation, copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and use an account-accessible `GEMINI_MODEL` (default: `gemini-3.8-flash`). Never paste secrets into chat or commit environment files.

Projects are stored in **sessionStorage for the current tab**. They survive refreshes but are not associated with a signed-in account or synchronized across devices. Closing the tab ends the temporary workspace; browser session restore may retain it. Avoid sensitive project details on shared devices.

The storage interface lives in `src/lib/projects/store.ts`; the session adapter lives in `src/lib/projects/session-store.ts`. The UI calls `saveProject`, `loadProject`, and `listProjects`. Phase 4 will provide authenticated server-backed storage and ownership checks.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`. **Roadmap generation is deliberately disabled in production until server authentication is connected in Phase 4.** Use the local development server for the Phase 2 demonstration.

Default tests do not call Gemini. They check validation, provider failures, timeouts, session persistence, and independent project progress. To run the opt-in live test in PowerShell (consumes Gemini quota):

```powershell
$env:SKILLSPRINT_LIVE_TEST = '1'
npm test -- tests/gemini.live.test.ts
Remove-Item Env:\SKILLSPRINT_LIVE_TEST
```

The live test writes its non-sensitive sample roadmap to ignored `.tmp/live-roadmap.json`. A read-only model availability check is available with `node scripts/check-gemini.mjs`. Adding `--probe` sends two small generation requests and consumes quota.

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
