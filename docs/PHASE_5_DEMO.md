# SkillSprint: learning that carries forward

This guide uses retained, explicitly labeled demonstration projects in the owner's local signed-in workspace. Generated roadmaps, lessons, copilot replies, and assessment reviews come from Gemini. Sample implementations and submitted explanations are written by Codex for the demonstration, not by the student and not by Gemini. Their Passport entries demonstrate application behavior, not the account owner's knowledge.

## Preparation

Follow PHASE_4_SETUP.md, start the app with `npm run dev`, and sign in. The retained projects belong to that account; another account should not be able to open them. Keep credentials out of presentation recordings.

| Project | Local saved URL | Purpose |
| --- | --- | --- |
| A: Study Session Counter | http://127.0.0.1:3000/projects/87fdabb0-7303-463b-b58c-4dc0bd3713ea | React components and state |
| B: Interactive Study Goal Form with Controlled Input and Validation | http://127.0.0.1:3000/projects/518d8d46-4105-4e9e-a3de-b2e6e7bc4d3e | Reuse React; add forms, validation, and accessibility |

Both are real Gemini-generated one-milestone roadmaps with a one-hour budget. Their intake and submitted work identify them as Phase 5 demonstrations. The titles themselves were chosen by Gemini.

## Live presentation

1. Open A. Show its ordered roadmap and saved guidance in Build (older concept notes are expandable). In Copilot, show the actual saved question about changing a plain JavaScript variable and Gemini's short hint to use a state setter. The reply does not provide the whole project.
2. Open Your work. Show the sample submission, observed counter behavior, confirmed criteria, and completed milestone. Explain that completion is student-confirmed; the application does not execute this submitted code.
3. Open Learning Passport. Expand React state evidence and follow the source-project link. Explain the distinction between practical work and a targeted AI check.
4. Open B's Build tab. Show React components/state recognized by canonical identifiers with links to A, alongside the other required skills.
5. Choose Review to revisit introductions; choose Skip introduction to focus on new concepts. With both reused React skills skipped, the generated lesson can focus on forms/validation and accessibility. Practical tasks still require completion.
6. Choose Refresher check. It opens Your work, selects a reused skill, and focuses the targeted-check control. Show a saved question/answer/review, or request a new question if the provider is available. Only that skill is assessed.
7. Show B's work and the new Forms and validation evidence in the Passport after completion. Source-project links explain where skills were practiced. Reload to show that the data is account-backed.

Retained projects may already be completed at presentation time. To demonstrate the earlier 1/1 versus 0/1 stage, reopen B explicitly; historical evidence remains by design. Reopening is not an evidence deletion/reset. Do not describe retained demo statuses as the presenter's own credentials.

At this checkpoint both retained projects are complete. React state is Mastered; React components, Forms and validation, and Web accessibility are Practiced. The React state refresher has a saved real passing AI review. The Forms and validation question was generated, but its review returned a provider quota error on the initial request and one explicit retry. It has no fabricated review or mastery award. Refresh any second tab after saving work in the first.

For that unreviewed Forms question, the demonstration answer explains that a raw spaces-only string is nonempty, while `trim()` turns it into an empty string. Validation should return with an inline error before saving; a valid trimmed goal clears the error and resets the controlled input. Identify any replayed answer as Codex-written demonstration text. Failed review attempts preserved the answer in the active form but did not save a passing assessment.

## Recreate from an empty demonstration account

Use Beginner, React with JavaScript, and one hour for each project.

**A idea:** Build a tiny study-session counter for a student. Show completed sessions starting at zero, an Add session button, and a Reset button. Use a React component and useState. Keep the scope to one small milestone; no persistence, forms, backend, or authentication. Label this as demonstration work.

**A starting knowledge:** Basic HTML, CSS, and JavaScript functions. New to React components and state.

**B idea:** Build a tiny study-goal form for a student. A controlled text input captures one study goal. Submitting a blank or whitespace-only goal shows an inline error; submitting a nonempty goal displays the trimmed goal in a confirmation. Reuse React components and useState, and learn forms and validation. One small milestone, no backend or persistence. Label this as demonstration work.

**B starting knowledge:** HTML, CSS, JavaScript functions; practiced React components and useState in the study-session counter. New to controlled forms and validation.

Roadmap wording and skill selection can vary. Use the actual returned milestones and canonical skill tags rather than promising a fixed model response. Complete only criteria supported by the implementation; adapt the supplied samples to any additional returned requirements.

## Implementation samples

`demo/study-counter.jsx` and `demo/study-goal.jsx` are separate educational demonstration components, not application screens. Use them in a React development project to replay the practical behavior. The local verification runner is ignored under .tmp and is not a production feature or deployment dependency.

The counter was executed in a separate local browser: initial 0 → two Add clicks → 2 → Reset → 0. The form was executed separately: blank and whitespace-only input produced an inline error; a padded nonempty input produced a trimmed confirmation and removed the error. These observations are browser checks of these samples, not Gemini execution results or verification of arbitrary submitted code.

## Provider failure handling

Prepare the saved content before presenting. If a live request fails, show the actual error and preserved input; retry explicitly. Saved real responses are valid replay material but must not be called a fresh live response. Never substitute seeded roadmaps or a mocked passing assessment for a failed live request. Hosting and deployment verification remain Phase 6.
