# SkillSprint

**Build a real project. Carry what you learn into the next one.**

[Live app](https://skillsprint.study) · [Architecture](docs/ARCHITECTURE.md) · [Demo guide](docs/PHASE_6_DEMO.md) · [Verification](docs/BUILD_STATUS.md)

SkillSprint helps students turn a software idea into a project they can build in their own editor. Gemini creates a roadmap and practical building steps. A Learning Passport records demonstrated skills and connects them to the projects where they were used. When another project needs those skills, new lessons shorten familiar introductions and focus on applying them.

**SkillSprint does not execute student code or certify that a project works.** Students build and run their projects in their own editor and browser.

## Why SkillSprint?

Students often know what they want to build but struggle to decide what to write next. Tutorials also tend to start over when a student moves to another project. SkillSprint combines a clear next edit with persistent learning evidence, so guidance can build on previous work.

## Features

- **Personalized roadmaps:** project idea, experience, available hours, existing knowledge, and optional stack become ordered milestones with dependencies, tasks, and completion criteria.
- **Guided building steps:** each step names a file, an edit, an expected result, and a manual check. Confirmed steps can be revisited; later steps remain locked until the current step is confirmed.
- **Starter files:** explicitly generate a skeleton, inspect formatted multiline source, copy individual files, or download a ZIP for your editor.
- **Contextual Copilot:** hints, explanations, debugging, reviews, and examples use the current milestone and work. Guided help prepares a question; the student chooses when to send it. Full solutions remain an explicit mode.
- **Knowledge checks:** multiple-choice or short-answer milestone practice, plus separate written Passport checks for individual skills.
- **Cross-project memory:** recognize canonical skills, show their source projects and status, and shorten familiar introductions in new lessons. Optional concept notes remain available.
- **Account-backed persistence:** Auth0 sign-in and Tiger Data storage preserve projects, guidance, submissions, assessments, conversations, and evidence.

## Learning evidence

| Status | Required evidence |
| --- | --- |
| New | No qualifying practical demonstration recorded |
| Practiced | Saved practical work and student-confirmed milestone completion |
| Mastered | Qualifying practical work plus a passed written Passport check for that exact skill |

Practical evidence is labeled **student-confirmed work**. Written checks are labeled **AI-reviewed understanding**. Lesson views, starter files, Copilot replies, guided-step confirmations, and multiple-choice milestone passes do not award Passport mastery. Confirming a step does not complete a milestone.

Previous evidence does not complete a new project's tasks. Each project keeps independent progress. A new or failed check does not erase a previously saved pass. Passport records link to supporting projects and evidence.

## Try the live app

1. Open **[skillsprint.study](https://skillsprint.study)** and choose **Sign in**. Use the options available in Auth0 Universal Login; an Auth0 dashboard account is separate from a student login.
2. Choose **New project**, describe your idea and existing knowledge, and create a roadmap.
3. Open a milestone's **Build** tab. Explicitly create starter files or building steps, then make the edits in Cursor, VS Code, or another editor. Run and check the project yourself.
4. Use **Give me a hint**, **Explain this**, or **Paste code for a review** when needed. Prepared questions wait for **Ask copilot**; they are not sent automatically.
5. Save practical work in **Your work**, confirm the criteria, and mark the milestone complete. Inspect the Passport evidence and explicitly take a written Passport check to demonstrate understanding of a specific skill.
6. Create another project using that skill. Look for the practiced-skill banner and source-project link; generate a new lesson to see adapted guidance.

The original [Vercel address](https://skillsprint-inky.vercel.app) remains available. The custom domain has its own session cookie, so your first visit may require sign-in. The same account retains the same saved data.

## Technology and architecture

| Technology | Role |
| --- | --- |
| Next.js 16, React 19, TypeScript | Interface and authenticated Node API routes |
| Gemini API | Structured roadmaps, lessons, starter skeletons, questions, and coding assistance |
| Auth0 | Universal Login and server-managed sessions |
| Tiger Data PostgreSQL | Projects, activities, assessments, evidence, skill records, and shared AI limits |
| Drizzle ORM and node-postgres | Reviewed migrations and ownership-scoped database operations |
| Zod | Runtime validation of inputs and generated responses |
| Prettier | Consistent display, copying, and export of supported starter source |
| Vercel | Production hosting and deployments from GitHub |
| Porkbun | DNS management for skillsprint.study |

The server derives ownership from the Auth0 session. Browser-supplied owner IDs, AI reviews, and skill statuses cannot authorize access or create trusted evidence. Generated responses are validated before saving. Secrets stay on the server; remote database connections verify TLS certificates and hostnames.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the request flow and evidence boundaries.

## Run locally

### 1. Install

Use **Node.js 24** and npm. Verification used Node 24.11.1 and npm 11.6.2.

```sh
git clone https://github.com/parv1512/skillsprint.git
cd skillsprint
npm ci
```

### 2. Configure services

Copy `.env.example` to `.env.local`. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill these values locally using authorized service credentials:

| Variable | Purpose |
| --- | --- |
| APP_BASE_URL | http://127.0.0.1:3000 for local development |
| AUTH0_DOMAIN | Auth0 tenant domain |
| AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET | Credentials from the same Regular Web Application |
| AUTH0_SECRET | Independently generated random session secret |
| DATABASE_URL | Tiger Data PostgreSQL connection URL |
| GEMINI_API_KEY | Gemini API key |
| GEMINI_MODEL | An account-accessible model; configured default: gemini-3.5-flash-lite |

For a new installation, generate a fresh session secret in your own terminal and save it only in `.env.local`:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

In your Auth0 Regular Web Application, add:

- **Allowed Callback URLs:** `http://127.0.0.1:3000/auth/callback`
- **Allowed Logout URLs:** `http://127.0.0.1:3000`

Use the exact origin: `localhost` and `127.0.0.1` are different. Keep credentials and generated secrets out of Git, screenshots, and chat. Follow [service setup](docs/PHASE_4_SETUP.md) for local database CA-file configuration and [deployment setup](docs/DEPLOYMENT.md) for hosted PEM trust through DATABASE_CA_CERT. Do not disable certificate validation.

### 3. Initialize and start

```sh
npm run db:check
npm run db:migrate
npm run dev
```

Open **http://127.0.0.1:3000**. Migrations apply reviewed additive SQL from `drizzle/`; they do not run on every request. The shell can render without credentials, but new saves and AI requests require configured services and sign-in.

Legacy browser-session projects can be explicitly imported into an account. Import retains notes and roadmaps but resets completion and removes untrusted historical AI artifacts; it does not convert them into Passport evidence.

## Checks and verification

```sh
npm test
npm run typecheck
npm run build
```

Default tests do not call Gemini. They cover validation, provider failures, timeouts, ownership, evidence rules, independent progress, and quota behavior. After building, `npm start` serves a local production build.

The October 11, 2026 checkpoint passed **95 offline tests** and **7 opt-in database integration tests**, plus the production build. Nine optional live cases were skipped in the default suite. Real production sign-in, Gemini roadmap/lesson/Copilot generation, persistence, skill reuse, and desktop/phone rendering were separately verified. The custom domain's HTTPS, sign-in, and saved account data were also checked. See [BUILD_STATUS.md](docs/BUILD_STATUS.md) for the actual results and limitations.

Optional suites are enabled with `SKILLSPRINT_LIVE_TEST=1`, `SKILLSPRINT_DATABASE_TEST=1`, or `SKILLSPRINT_LEARNING_LIVE_TEST=1`, as described in the verification record. AI live tests consume quota. Database tests use isolated synthetic records and clean them afterward. `node scripts/check-gemini.mjs` checks model availability without generating content; `--probe` makes generation requests.

## Deployment and limits

Vercel is connected to **parv1512/skillsprint**, with **main** as the production branch. Updates follow **edit → test → commit → push to main → wait for Vercel Ready**. The custom domain and original Vercel address both serve production. Apply required reviewed database migrations separately before deploying dependent code.

Production credentials are stored privately in Vercel; local environment files are not uploaded. Branch previews do not automatically have production credentials or matching Auth0 settings. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for domain and release details.

- Tiger Data enforces **one active AI request and 30 attempts per student per ten minutes**, plus **15 AI requests per account and 45 for the whole site per 24 hours**. A new account cannot spend past the shared cap. Set `AI_STUDENT_DAILY_LIMIT` and `AI_GLOBAL_DAILY_LIMIT` to change those daily caps.
- Gemini can exhaust quota, time out, or return unavailable responses. Requests and retries are explicit; failures do not create passing evidence. Saved real responses can be replayed, with their origin made clear.
- AI guidance and reviews can be imperfect. They are not executed-code verification or independent skill certification.
- Another already-open tab needs a reload to see new saves; live multi-tab synchronization is not implemented.

## Hacklanta demo and disclosure

The central demonstration is **Project A → practical evidence → Learning Passport → Project B with recognized skills and adapted introductions**. Follow the [2–3 minute demo guide](docs/PHASE_6_DEMO.md) and [submission draft](docs/SUBMISSION_DRAFT.md).

Retained demonstration submissions are labeled Codex-written samples, not claims about the account owner's learning. Gemini generated the retained roadmaps, lessons, starter skeletons, and AI reviews. Codex assisted implementation, verification, and sample code. Any documented sample execution happened separately from SkillSprint. The team must supply its actual roster, video link, and build-timeline/preexisting-work disclosure before submission.

## Repository map

| Path | Contents |
| --- | --- |
| src/app | Pages, authenticated API routes, and styles |
| src/components | Roadmap, guided workspace, Copilot, checks, Passport, and shell |
| src/lib/domain | Canonical skills, contracts, and validation |
| src/lib/ai | Gemini generation, prompts, and provider error handling |
| src/lib/server | Request policy, authentication boundaries, and quota wrapper |
| src/lib/projects | Storage adapters, progress, and source formatting |
| src/lib/db | Schema, owned records, shared quota storage, and TLS |
| drizzle | Reviewed additive migrations |
| tests | Offline and explicitly enabled live checks |
| docs | Architecture, deployment, demo, and verification material |
