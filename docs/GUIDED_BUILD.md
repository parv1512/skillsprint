# Guided building workspace

The owner approved guided steps using an external editor, with a clear next edit instead of a broad task list. This is the shared milestone workspace for every project and stack; it is not a portfolio-specific screen. Field Notes styling, the existing architecture, student-confirmed milestone completion, and targeted Passport evidence rules remain in place.

## Student flow

1. Open a project's **Build** tab. Get the starter, extract the ZIP, open the folder in Cursor/VS Code, and follow its stack-specific setup instructions. Confirm **My project runs locally** only after trying it yourself. You can preview building steps before confirming setup.
2. Choose **Create building steps**, **Preview building steps**, or **Create guided steps** for an older saved lesson. This is one explicit Gemini request; no lesson or starter generation runs automatically.
3. Follow the current step: short concept, exact relative file path, precise edit, optional small illustration, expected result, concrete browser/terminal check, and an explanation/prediction question.
4. **Give me a hint** and **Explain this** prepare a copilot question with the current step's context. Open **Paste code for a review** to add your snippet. The section starts closed when empty and opens for existing saved text. Save it; **Review this step** prepares a scoped review question. Choose **Ask copilot** to send it.
5. Choose **I finished this step** after making and checking the change in your editor/browser. The app saves your position and offers the next step. Confirmations are sequential and student-authored, not code execution or learning awards. Unsaved attempt text stays in the form and is not silently saved by a position-only confirmation.
6. After the steps, choose **Open completion criteria** and review your actual work and original milestone criteria in **Your work**. Milestone completion remains a separate explicit action. Targeted Passport skill checks remain separate from general milestone feedback.

Saved step confirmations survive reload. Earlier confirmed steps can be revisited. A regenerated lesson/guide has a new plan and resets the step-confirmation list; submitted work, milestone completion, and targeted assessment/evidence history remain. Existing lessons are still readable under **Concept notes and example** and are upgraded only by an explicit generation action.

## Content contract

New lesson generation requires 2–8 ordered guided steps with unique IDs and safe file paths. The model uses the actual starter contents when present and must adapt rather than instruct students to rebuild a feature already provided. Short examples are illustrations, not finished project code. Oversized optional step examples are omitted intact rather than truncated into broken code; all required instructions and paths still undergo strict validation. Model output is untrusted data and is never executed.

The existing activity JSON adds backward-compatible setupConfirmed and completedStepIds defaults. The saved lesson adds guidedSteps with an empty default for older records. Server-side saves accept only student-owned progress fields and compare confirmations to the authoritative saved guide in order. No SQL migration is required. Regenerated guidance resets markers server-side; client-written lessons/reviews remain untrusted.

## Readable starter files

The owner approved Prettier 3.9.10 as a dependency. Local standalone parsers format supported HTML, CSS/SCSS/Less, JavaScript/JSX, TypeScript/TSX, JSON, and Markdown without executing code, fetching a remote formatter, or loading project configuration. The viewer uses indentation, separate lines, and non-copyable line numbers. Display, Copy file, and downloaded ZIP contents share the formatted representation. Stored original Gemini output is not overwritten.

Unsupported or invalid source is preserved. Formatting that would exceed the validated starter size budget also preserves the original export. New generation explicitly requests indented multiline source for every language and leaves the concepts being taught as student work. Formatters cannot infer lost semantic indentation in a malformed one-line Python file.

Verification and remaining limitations are tracked in BUILD_STATUS.md. Screenshots of the owner's project are kept in ignored .tmp for local review rather than added to the repository.

## Current Passport presentation

A reused-skill banner precedes guided steps and links each skill to earlier practical evidence. Its Concept notes and example dropdown is directly underneath and closed by default. For milestones without reused skills, concept notes remain after the starter files and skill tags. **Take the Passport check** opens Your work and the targeted written-check panel; it does not open concept notes or generate a question automatically.

After successful milestone completion, the server-refreshed Passport result names recorded skills and links to the Passport. Completed milestones also retain these statuses under their title after reload. Without matching saved practical evidence, no status is invented. Multiple-choice milestone practice highlights the correct option in green and a selected wrong option in red with visible labels; it remains separate from written Passport mastery checks.
