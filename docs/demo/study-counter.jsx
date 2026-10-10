// Phase 5 demonstration implementation written by Codex, not Gemini or the student.
// This sample is separate from SkillSprint and awards no learning status by itself.
import { useState } from "react";

export default function StudyCounter() {
  const [sessions, setSessions] = useState(0);
  return (
    <section>
      <h1>Study session counter</h1>
      <p aria-live="polite">Completed sessions: {sessions}</p>
      <button onClick={() => setSessions(previous => previous + 1)}>Add session</button>
      <button onClick={() => setSessions(0)}>Reset</button>
    </section>
  );
}
