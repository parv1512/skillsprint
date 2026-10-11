# SkillSprint: demo and presentation guide

This guide describes the current interface. Retained demonstration work is explicitly labeled Codex-written sample work, not the account owner's learning claim. Gemini generated the retained roadmaps, lessons, and AI reviews. SkillSprint never executes submitted code.

## Prepare before recording

1. Open https://skillsprint-inky.vercel.app and verify sign-in before recording.
2. Use the owner-approved demo account. Another account cannot access its private projects. Keep sign-in credentials, environment settings, browser callback codes, and account setup screens out of the recording.
3. Open Project A, the Passport, and Project B. Check that saved responses and evidence are available. Confirm provider availability before planning a live generation.
4. Use the actual milestone and skill names; Gemini wording may vary. Do not complete criteria that the demonstration work does not support.

## Suggested three-minute sequence

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Overview: students build a real project in their own editor, and demonstrated skills carry into later projects |
| 0:20–0:50 | Project A: open a milestone; show file, edit, expected result, and check. The number rail keeps the lesson in focus |
| 0:50–1:15 | Show the saved practical submission and student-confirmed completion. The persistent line under the milestone title shows the recorded skills and Passport status |
| 1:15–1:45 | Learning Passport: show a skill and expand its project evidence. Practiced means saved practical work plus completion; Mastered also has a passed written check for that exact skill |
| 1:45–2:20 | Project B: the banner above building steps identifies a reused skill, its status, and earlier project. Concept notes are available in the closed dropdown below it. Building progress belongs to this project |
| 2:20–2:45 | Take the Passport check: it opens Your work and the targeted written check. Generating or reviewing a question is explicit. A milestone multiple-choice result is app-graded practice and does not award mastery |
| 2:45–3:00 | Show a saved real Copilot reply or explicitly ask for one if quota is available. Finish with Auth0 sign-in, Tiger Data persistence, and Gemini's structured teaching role |

The owner confirmed a 2–3 minute Hacklanta video. Aim for 2:45 so transitions fit within three minutes.

## Retained account-backed replay projects

- Project A: Study Session Counter, /projects/87fdabb0-7303-463b-b58c-4dc0bd3713ea.
- Project B: Interactive Study Goal Form with Controlled Input and Validation, /projects/518d8d46-4105-4e9e-a3de-b2e6e7bc4d3e.

Both retained demo milestones are complete. Reopening does not erase historical evidence, so it cannot honestly be presented as a fresh account or newly learned skill. To demonstrate a fresh second-project roadmap, create a separate labeled demonstration project through New project, using the intake examples in PHASE_5_DEMO.md; that calls Gemini and consumes quota. Do not replace an unavailable live response with a fixture and claim it was generated live.

The two JSX samples under docs/demo were executed separately during earlier verification. Those observations concern the samples only, not arbitrary student submissions or execution by SkillSprint.

## Failure fallback

If Gemini returns a quota, timeout, or capacity error, show the actual error, retain the student's input, and use saved real responses for the remainder of the presentation. State that they were generated previously. Never fabricate a passing assessment or claim the provider is healthy because the rest of the UI works.

## Pitch accuracy

Show canonical skill recognition and evidence-backed Passport statuses. The current UI no longer exposes Skip or Review lesson controls. New lessons receive practiced/mastered skills supported by practical work in another project and are instructed to shorten beginner explanations while retaining practical edits. Optional concept notes stay available. This is AI prompt adaptation, not a guarantee that every response has ideal teaching quality.

## Suggested voiceover

“When I start a new coding project, the hardest part is knowing what to do next. SkillSprint turns an idea and time budget into a roadmap. I build in my own editor; the app guides each edit with a file, an instruction, an expected result, and a check I can perform.

“Here is Project A. I save practical work and confirm the milestone's criteria. That records a practiced skill. Reading a lesson or asking the Copilot earns no status, and SkillSprint never runs my code. A passed written check for that exact skill, together with saved practical work, can mark it mastered. These demo submissions are labeled sample work.

“The Learning Passport keeps the evidence and links back to the projects where the skill was demonstrated. Now Project B needs React state again. SkillSprint recognizes its canonical skill identifier and shows the earlier project. New lessons shorten familiar introductions and focus on the next practical application. This project still has its own work and completion; previous evidence does not complete it for me.

“If I get stuck, a hint or explanation prepares a contextual question. I decide when to send it. Full solutions are an explicit choice. I can also take a written Passport check or open concept notes for a refresher.

“Gemini generates the roadmaps and teaching. Auth0 owns the sign-in session. Tiger Data preserves projects, evidence, and shared request limits. The application is deployed on Vercel. The goal is learning that carries forward: build a real project, demonstrate a skill, and use it in the next one.”

Use saved real responses if provider quota is exhausted, and say they were generated earlier. Record only screens whose claims are supported by the visible evidence.
