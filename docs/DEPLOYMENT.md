# Vercel deployment

Public app: https://skillsprint.study. The original https://skillsprint-inky.vercel.app address remains available. Node.js 24, Next.js, `npm ci`, and `npm run build` are configured in the linked SkillSprint project. AI routes use the Node runtime and a 180-second hosting allowance; application/provider timeouts remain bounded. Deployment does not run student code.

## Configuration

Production variables are stored as sensitive values in Vercel, never in source or screenshots:

- GEMINI_API_KEY and GEMINI_MODEL (currently gemini-3.5-flash-lite).
- AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET.
- AUTH0_SECRET: independently generated for production; do not copy the local session secret.
- APP_BASE_URL: https://skillsprint.study.
- DATABASE_URL and DATABASE_CA_CERT: the approved database connection and PEM CA pin.

The owner approved reusing the existing provider settings and private Timescale CA pin for this hackathon deployment. Initial CA trust was not independently checked through the provider console. The connection still validates certificates and hostnames and adds normal Node public trust roots. Local filesystem certificate paths are removed from the runtime connection URL when the explicit PEM trust configuration is supplied.

Auth0's existing Regular Web Application allows https://skillsprint.study/auth/callback as a callback and https://skillsprint.study as a logout URL. The owner added these while retaining the original Vercel and local entries. Sign-in uses Universal Login and server-managed sessions; no browser access token is exposed. The custom domain has its own session cookie, so first visits can require Sign in even if the student is already signed in on the Vercel address. The same student identity keeps the same saved projects and Passport.

## Updates and migration

Review source and tests first. Apply reviewed additive migrations with `npm run db:migrate` using the configured local connection. Migration is deliberate, not part of every serverless cold start. The Phase 6 migration adds only `skillsprint_ai_usage`; it was applied before launch.

The Vercel project is connected to `parv1512/skillsprint`, with `main` as its production branch. For normal website updates: test locally, commit the reviewed changes, push to `main`, and wait for the Vercel deployment to reach Ready. The stable public URL stays the same. Production variables are configured only for production; a branch preview needs its own deliberate credential and Auth0 setup before protected features can work.

The manual fallback is `npx --yes vercel@63.1.2 deploy --prod --yes`. Do not use `vercel pull` or repeat interactive linking unless you intend to download environment values. `.vercelignore` excludes environment files, local build outputs, dependencies, and temporary artifacts. Git commits/pushes remain owner-approved actions. The initial CLI deployment used uncommitted source; that source was subsequently committed and pushed as 31a01f4.

Verify the stable URL, sign-in, an owned project, Passport, reload persistence, and one explicit AI request after any configuration change. Provider quota can fail independently of the deployment. Never log secrets, callback codes, raw credentials, or submitted private work for diagnosis.

## Shared request limits

Tiger Data atomically enforces 30 attempts per student per 10 minutes and one active AI request across Vercel instances. Subject identifiers are hashed in the transient quota table. A 150-second lease recovers after an interrupted request; release checks the exact lease token. A database failure refuses new AI requests safely. This is a per-student limit, not a global daily spending cap or a promise of provider availability.

## Custom domain in Porkbun

skillsprint.study was registered by the owner and is managed in Porkbun. Its apex parking ALIAS was replaced with an A record, and a second root A record was added using Vercel's exact recommendation: 216.198.79.1 and 64.29.17.1, both with TTL 600. The existing wildcard parking record was retained; www and other subdomains were not configured as application domains. No nameserver, renewal, billing, or account-security setting was changed.

Vercel verified the domain configuration. The production app URL was updated without changing local environment files, and the app was redeployed. HTTPS, the homepage/favicon, Auth0 sign-in returning to the custom domain, and existing account data loading were verified. Future DNS changes should use the project's current Vercel recommendation rather than assuming these records remain permanent. Preserve unrelated records.

Official guides: [Vercel domains](https://vercel.com/docs/domains/set-up-custom-domain), [function limits](https://vercel.com/docs/functions/limitations).
