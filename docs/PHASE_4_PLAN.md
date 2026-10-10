# Phase 4 integration proposal

Status: the approved implementation has reached its verified Phase 4 checkpoint. Universal Login, the seven-table node-postgres schema, and practical work plus a targeted check for mastery are implemented. Results and limitations are tracked in BUILD_STATUS.md.

## Existing foundation

Next.js 16.4, React 19.3, TypeScript, Zod, and Gemini are already in place. The approved database direction is Drizzle with Tiger Data PostgreSQL. The project storage interface already exposes saveProject/loadProject/listProjects. Auth0 and DATABASE_URL values are missing locally; only presence was inspected, never secret contents. The branch is clean and synchronized at the Phase 3 checkpoint before this document was added.

## Proposed authentication

Use an Auth0 Regular Web Application, hosted Universal Login, and the official Next.js SDK. A src/proxy.ts entry handles SDK authentication routes and rolling sessions. Protected APIs independently check the server session; proxy interception alone is not authorization. The stable Auth0 subject maps to an internal student ID. The application does not need client-side access tokens or to store passwords, email addresses, or names in its learning database.

For this preview, APP_BASE_URL is http://127.0.0.1:3000. Register http://127.0.0.1:3000/auth/callback and http://127.0.0.1:3000 as callback/logout URLs respectively. AUTH0_SECRET is generated locally only after owner confirmation. No tenant, paid database service, or external account is created automatically.

## Proposed relational model

Tables use a SkillSprint-specific prefix to avoid collisions with unrelated tables. Foreign keys, uniqueness constraints, and owner indexes enforce relationships. Ordinary PostgreSQL tables are sufficient; this workload does not require hypertables.

| Record | Content and constraints |
| --- | --- |
| Students | Internal UUID, unique Auth0 subject, creation timestamp |
| Projects | UUID, owner, validated intake and roadmap metadata, creation/update timestamps; owner index |
| Milestones | Project and owner, stable milestone identifier, position, validated tasks/criteria/skills/dependencies; unique project + milestone identifier and project + position |
| Learning activities | One current workspace per milestone: lesson, starter, notes, answer, conversation, criteria confirmations and completion timestamp; structured JSON is validated before storage |
| Assessments | Owner/project/milestone, explicit canonical skill target, question, submitted answer, server-produced AI review, model and timestamp; only the authenticated assessment endpoint creates reviews |
| Evidence | Owner/project/milestone/skill, evidence kind, submission snapshot or assessment reference, timestamp; distinguish student-confirmed work from AI-reviewed understanding |
| Skill records | Unique owner + canonical skill ID, New/Practiced/Mastered state, last demonstrated date and review preference; status derived from qualifying evidence |

Use the approved Drizzle ORM with node-postgres pooling. Inspect Tiger Data connection and TLS requirements before connecting; do not disable certificate validation to make a connection succeed. Generate reviewable additive SQL migrations, never use a destructive schema push. Database changes are confined to these application tables and the migration ledger.

## Evidence policy awaiting approval

The recommended simple policy is Practiced after student-confirmed milestone work with a saved submission, and Mastered after that plus a passed check explicitly targeting the same canonical skill. The stricter alternative needs evidence from two projects before Mastered. Both preserve the approved completion behavior: assessments are separate and do not gate milestone completion.

Existing milestone-wide questions cannot safely establish every skill in a milestone. Targeted checks must identify one supported skill and use server-owned project context. AI review is labeled as AI review, never verified execution. Opening lessons, generating or copying starters, requests for full solutions, and client-supplied pass flags do not qualify as evidence. An imported legacy review must never become trusted server assessment evidence.

Capture immutable submission/assessment evidence snapshots so later edits cannot silently change what a status was based on. Reject duplicate awards for the same event. Define reopening behavior and evidence invalidation explicitly in the implementation and tests; completion state and historical demonstrations are distinct records.

## Storage and cross-project memory

Replace the current adapter behind the existing project storage interface with authenticated server requests. Server queries derive ownership from the session and reject IDs belonging to another student. Preserve the browser session data during transition; do not silently overwrite it or automatically convert its AI reviews into trusted assessments. Any import offered to the student is explicit and identifies it as imported work.

Match roadmap skills to Passport records only by canonical IDs. Show actual source projects and evidence. Provide Skip introduction, Review, and Refresher choices for previously demonstrated skills. Skipping lessons never completes the new project's practical work. Preserve Field Notes styling and concise copy.

Generated lessons/reviews/starters become server-owned content. The project save endpoint must not accept arbitrary client-written reviews, evidence, lesson checks, or Passport status. AI routes load their authoritative roadmap/milestone from the authenticated project rather than trusting a complete client-supplied context. Limit requests, validate origin and payload size, and return safe no-store errors. Unauthenticated calls must fail before reaching Gemini or the database.

## Implementation sequence after approval

1. Auth0 SDK and environment validation; sign-in/sign-out and protected server identity.
2. Reviewed Drizzle schema and additive migrations; Tiger Data connection verification.
3. Server-owned project/learning operations, storage adapter, and ownership tests.
4. Server-recorded targeted assessments, evidence rules, and Passport with project links.
5. Canonical cross-project matching and lesson preferences.
6. Desktop/mobile inspection, error recovery, and real login/database verification.

## Verification gates

- Student A cannot list, read, modify, assess, or add evidence to Student B's project, including forged owner IDs and milestone IDs.
- Signed-out AI and storage requests fail without provider calls; malformed requests and cross-origin writes fail safely.
- Persistent projects survive refresh, sign-out/sign-in, and a fresh browser session.
- Client-forged AI pass flags and imported historical reviews cannot award mastery.
- Only targeted canonical skills receive assessment evidence; viewing/copying/skipping cannot award progress.
- Practical progress stays independent between Project A and Project B; duplicate/retried writes cannot duplicate awards.
- Concurrent workspace saves cannot overwrite authoritative assessments or another milestone's records.
- Passport evidence links to the correct project and distinguishes student-confirmed work from AI review.
- Database outages and expired sessions preserve unsaved input and support an explicit retry.
- Run meaningful unit/integration tests, typecheck, build, and desktop/mobile visual inspection. Report live Auth0/Tiger Data checks separately from mocked authorization tests.

## Official integration references

- Auth0 SDK: https://auth0.github.io/nextjs-auth0/
- Drizzle PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql
- Drizzle migrations: https://orm.drizzle.team/docs/migrations
- Tiger Data connection details: https://www.tigerdata.com/docs/integrate/find-connection-details

The Auth0 and Drizzle documentation was reviewed during discovery. The Tiger Data connection page did not load through the web reader, so its exact TLS/connection guidance still needs verification before configuration.
