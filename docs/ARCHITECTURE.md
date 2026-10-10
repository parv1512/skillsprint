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
