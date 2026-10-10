# Phase 4 service setup

Credentials belong only in `.env.local`. Do not paste keys, passwords, connection URLs, or client secrets into chat. `.env.local` is ignored by Git.

## Auth0

Use the approved **Regular Web Application** with **Universal Login**. Copy its domain, client ID, and client secret into AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET. A local AUTH0_SECRET has already been generated; keep it private. APP_BASE_URL is http://127.0.0.1:3000.

In that application's Settings, save these exact local URLs:

- Allowed Callback URLs: `http://127.0.0.1:3000/auth/callback`
- Allowed Logout URLs: `http://127.0.0.1:3000`
- Allowed Web Origins, if requested: `http://127.0.0.1:3000`

`localhost` and `127.0.0.1` are different origins. Register the origin used by this preview. The v4 SDK callback is `/auth/callback`, not the older `/api/auth/callback`.

Once settings are saved, use **Sign in** in the preview. Enter your own login credentials in Auth0; SkillSprint never collects or stores passwords. Use a second test student when verifying separation between accounts.

## Tiger Data

Use your intended Tiger Data PostgreSQL service. Copy its PostgreSQL connection URL into DATABASE_URL. If composing a URL manually, encode reserved characters in the username/password. Do not put a URL containing a password into a terminal command or a chat message.

Remote connections enforce `sslmode=verify-full`, including certificate and hostname verification. If the service requires a custom trusted CA, follow Tiger Data's certificate guidance and include `sslrootcert=/absolute/path/to/trusted-ca.crt` in the local connection URL. Do not disable certificate validation to bypass an error.

For this local demo, the owner explicitly approved pinning the private Timescale CA presented by the configured service. It is stored in ignored `.tmp/tiger-ca.crt` alongside the normal public trust roots, and the local connection URL refers to that file. The initial private CA trust came from the inspected connection rather than independent console verification. This is a local-demo choice, not approval for a deployment trust policy. Do not assume this local file exists on a hosted server.

Tiger Data's current SSL guidance explains that new services initially use self-signed certificates; eligible services usually receive a signed certificate within about 30 minutes. Free services do not receive that signed certificate. A manual certificate-download button in the current console was not verified. See [the official SSL guidance](https://www.tigerdata.com/docs/use-timescale/latest/security/strict-ssl).

Run these commands from the repository after configuration:

```text
npm run db:check
npm run db:migrate
npm run dev
```

The connection checker prints only a safe success/failure result. The migration runner applies the reviewed additive SQL in `drizzle/`; it does not use destructive schema push. The first migration creates seven namespaced SkillSprint tables and indexes/constraints plus Drizzle's migration ledger. It does not delete or rewrite unrelated tables.

## Existing projects

Signing in changes storage to your account. Existing session projects are left intact. An import action appears when this tab contains projects that are not yet in your account. Import keeps roadmaps and student notes, resets completion, and drops untrusted historical AI output/reviews. Reconfirm practical work and take new targeted checks to earn Passport evidence.

## Evidence rules

- New: no qualifying practical demonstration recorded.
- Practiced: a saved practical submission and student-confirmed milestone completion.
- Mastered: qualifying practical work plus a passed check explicitly targeting that canonical skill.

AI judgments are labeled as AI reviews; neither submissions nor starter code are executed. A general milestone check is saved as feedback but does not establish every skill in the milestone. Use **Passport skill check** to demonstrate a specific skill.

Reopening a milestone changes project progress, while previous submitted demonstrations remain historical evidence. Editing current notes does not rewrite evidence snapshots. A failed refresher is retained as a separate assessment; it does not erase a previous demonstration. A reviewed targeted check cannot be submitted again; create another check to retry.

## Verification checklist

The Phase 4 checkpoint results are recorded in BUILD_STATUS.md. The checks below are also useful when configuring another environment. Two distinct Auth0 browser accounts were not exercised during this checkpoint; database isolation was tested with two synthetic identities.

1. Sign in, save a project, refresh, sign out, and return to the same saved project.
2. Complete a milestone with saved work; inspect its Practiced skill evidence.
3. Pass a targeted check; verify only that skill becomes Mastered when supported by practical evidence.
4. Create another project using the same canonical skill; test skip/review/refresher without completing new practical work.
5. Sign in as a different student; direct requests for the first student's project/check must return not found, and the second student's lists must remain separate.

Official references: [Auth0 Next.js SDK](https://auth0.github.io/nextjs-auth0/), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [Tiger Data connection details](https://www.tigerdata.com/docs/integrate/find-connection-details).
