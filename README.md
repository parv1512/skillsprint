# SkillSprint

Build real projects, learn with guidance, and carry demonstrated skills into your next idea.

## Current state

Phase 1 foundation: responsive application shell, overview, project and Passport empty states, shared TypeScript contracts, and structured input/roadmap validation.

Project creation, Gemini tutoring, Auth0 sign-in, database persistence, assessments, and cross-project skill reuse are **not connected yet**. Zero counts are empty-state values, not saved student data. The new-project page explains the upcoming intake rather than pretending to generate a roadmap.

## Local development

Requires Node.js 20.9 or newer; development environment inspected with Node.js 24.11.1 and npm 11.6.2.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Phase 1 needs no credentials. Before later integrations, copy `.env.example` to `.env.local` and configure values locally. Never paste secrets into chat or commit environment files.

```sh
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build after `npm run build`. Automated tests cover intake validation, roadmap dependencies, malformed output, resource protocols, and canonical skill identifiers. They do not verify learning evidence or live integrations.

## Structure

- `src/app`: pages, layout, loading and error boundaries, global design styles.
- `src/components`: reusable application shell, icons, and empty states.
- `src/lib/domain`: shared contracts and Zod validation; independent of UI.
- `tests`: behavioral validation checks.
- `docs`: build status, phase checkpoints, and planned service boundaries.

Business services for projects, AI, Passport, authentication, and database access will be added in their approved phases. Private credentials and ownership checks belong on the server. No deployment provider has been selected.

## Development workflow

GitHub source of truth: https://github.com/parv1512/skillsprint. Work is reviewed in phases. Report checks before committing and obtain product-owner approval before pushing. Never force-push or commit secrets.

See [build status](docs/BUILD_STATUS.md) and [architecture](docs/ARCHITECTURE.md).
