# Architecture checkpoint

## Foundation

One Next.js application contains the UI and future server services. Pages render the learning experience; reusable components implement navigation and presentation. Domain types derive from Zod contracts where appropriate, so runtime and TypeScript validation agree.

No separate backend, microservices, deployment provider, or additional sponsor integration is introduced.

## Planned boundaries

- Project service: intake, validated roadmap generation, milestone progress.
- AI service: Gemini requests, structured-output validation, hint-first tutoring, bounded context, model failure handling.
- Passport service: canonical skill matching, evidence, student review preferences.
- Authentication: server-managed Auth0 session; stable identity as the record owner.
- Database: Drizzle against Tiger Data PostgreSQL; migrations after schema review.

The Phase 2 Gemini service and project storage boundary are implemented. Passport, authentication, and database boundaries remain planned.

## Phase 2 implementation

The intake client posts validated project details to `/api/roadmaps`. The Node route keeps credentials private, checks the incoming origin, bounds request size, validates input, and calls the Gemini service. The service requests structured JSON with a small provider-compatible schema, then enforces the full Zod schema, ordered dependencies, canonical skill membership, and the student's total time budget. Official resources come from the application catalog; AI claims of verification are discarded.

No retry silently spends additional quota. The student chooses when to retry. Provider failures return safe messages rather than raw API responses. A timeout bounds each generation attempt. Production generation is refused until authenticated access is connected.

The `ProjectStore` interface exposes `saveProject`, `loadProject`, and `listProjects`. The current adapter stores validated projects in the tab's sessionStorage. The provider connects this interface to the UI. A future server-backed adapter can preserve these UI calls, but authenticated server routes and ownership checks will also be required in Phase 4.

The Field Notes design uses shared color, typography, spacing, and control tokens in `studio.css`. Canonical skill states have both text labels and distinct colors; no color alone conveys mastery.

## Evidence and student ownership

AI recommendations are separate from student submissions and application completion records. Verified assessment results must come from an actual check. The tutor must not claim execution or mastery it cannot support.

Project progress remains project-specific. Skipping an introductory lesson never completes the implementation task. Reading a lesson does not earn mastery. Detailed evidence thresholds need approval before implementation.

Future data operations must derive the owner from the server-authenticated identity and check ownership on reads and writes. Client-submitted owner IDs must not authorize access.

## Configuration

Variables are documented in `.env.example`: Gemini API key and chosen model, PostgreSQL connection URL, Auth0 domain/client ID/client secret/session secret, and application base URL. Gemini model access and generation are verified. Auth0 and database configuration have not been verified.

## Phase 3 learning boundary

`/api/learning` validates bounded milestone context and calls `src/lib/ai/learning.ts`. Lessons, tutor replies, and assessment reviews have separate structured schemas. The selected milestone must belong to the supplied roadmap. Credentials stay on the server; origin checks, bounded input, timeouts, and safe errors follow the roadmap API. Both AI endpoints refuse production access pending Phase 4 authentication. Client-supplied context is not authenticated evidence.

Lessons load on explicit request and are cached in session project learning records. Work, knowledge-check answers, AI reviews, and bounded tutoring history are saved separately per milestone. The tutor defaults to a hint, uses previous attempts, and exposes a deliberate full-solution mode. Prompt rules forbid claims of execution and fabricated progress; non-solution code output is also bounded. Model behavior remains probabilistic, and snippets are never executed.

The owner chose student-confirmed completion with assessment tracked separately. `progress.ts` checks prerequisites and student-confirmed criteria, records a confirmation timestamp, and allows reopening (dependent completed milestones must be reopened first). An AI check is not a completion gate. No Passport status is awarded. Phase 4 still requires approved evidence mapping, database schema, authenticated identity, and server ownership checks.

## Starter projects

The owner approved starter files plus guided milestones: remove setup friction, leave meaningful project implementation to the student, and keep full solutions explicit. The first milestone can request a structured starter through the existing learning endpoint. It includes relative file paths, contents, each file's purpose, setup steps, and the first task. The prompt restricts generation to minimal setup and a skeleton, excluding later milestone features.

Starter content is validated and retained with the first milestone. Relative paths reject traversal, hidden files, reserved Windows names, duplicates, and file/directory conflicts. Output size is bounded. Students can inspect and copy files or download a small uncompressed ZIP built without adding dependencies. Code is never executed or written into the student's filesystem by SkillSprint. Generated output is clearly labeled as not executed or tested. Downloading or viewing a starter awards no completion or Passport evidence.
