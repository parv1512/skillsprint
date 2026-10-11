# Phase 6: polish and submission

Status: production deployed at https://skillsprint-inky.vercel.app. Public sign-in and account-backed project loading are verified. Live generation and final presentation checks are recorded in BUILD_STATUS.md. Recording and submitting the video remain owner actions.

## Objective

Ship the existing SkillSprint experience, verify its production configuration, and prepare an honest, repeatable hackathon presentation. Preserve Next.js/TypeScript, Gemini, Auth0 Universal Login, Tiger Data, the existing evidence policy, and the Field Notes design.

## Work and gates

| Work | Status / next gate |
| --- | --- |
| Latest finishing edits | Persistent completed-milestone Passport lines and Take the Passport check are implemented and uncommitted |
| Responsive and keyboard audit | Desktop/390px rendering inspected; tab/focus handoff verified. Earlier rail keyboard checks retained; no full screen-reader audit claimed |
| Failure and empty states | Offline provider/storage/authorization cases passed; signed-out and unknown-project copy inspected |
| Production build and dependency audit | Local and Vercel builds passed; 95 offline tests, seven opt-in database tests, zero production vulnerabilities |
| Hosting | Vercel approved and deployed; GoDaddy domain registration deferred |
| AI request controls | Approved additive Tiger Data quota table enforces limits across instances; concurrency/expiry tests passed |
| Database trust | Owner approved the existing CA pin for the hackathon deployment; portable trust and verified TLS passed |
| Learning adaptation | Approved automatic shortening for practiced/mastered skills with practical evidence in another project; practical tasks remain |
| Documentation and demo | Current controls, architecture diagram, README, deployment guide, video script, and submission draft prepared |
| Submission | Hacklanta AI/ML; owner confirmed 2–3 minute video. Official deadline October 11, 2026, 9:00 a.m. Eastern; team details and video URL remain owner-supplied |
| Public verification | Stable HTTPS URL, sign-in, real roadmap/lesson/hint, storage/reload, and Passport verified. Signed-out AI routes return 401; ownership tests passed |

## Deployment preparation

Use Node.js 24 and the existing npm lockfile. Build with npm run build. Gemini and database routes require a Node runtime; some AI requests have a two-minute application timeout, so the selected hosting runtime must allow sufficient duration. Keep stable APP_BASE_URL and register its exact /auth/callback and logout origin with Auth0. Keep secrets in hosting settings, never in Git or recordings. A local filesystem CA path cannot be assumed to exist on a hosting platform.

Hosting configuration, production secret provisioning, and the shared-limit migration followed explicit owner approval. No paid service, new dependency, destructive migration, or authentication redesign was introduced. Existing source ownership checks and evidence rules remain intact. See DEPLOYMENT.md for the configuration and update procedure.

## Completion conditions

Phase 6 is complete only after the deployed URL is verified, required presentation/submission materials are finalized against the actual hackathon rules, and unresolved failures are reported. A local production build alone is not a successful deployment. Live Gemini failures must remain visible; saved real responses can be replayed but must not be described as newly generated.

No commit or push is included in starting Phase 6. The owner approves that separately.
