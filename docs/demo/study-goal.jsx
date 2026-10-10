// Phase 5 demonstration implementation written by Codex, not Gemini or the student.
import { useState } from "react";

export default function StudyGoal() {
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [savedGoal, setSavedGoal] = useState("");
  function submit(event) {
    event.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) {
      setError("Enter a study goal.");
      setSavedGoal("");
      return;
    }
    setError("");
    setSavedGoal(trimmed);
    setGoal("");
  }
  return (
    <section>
      <h1>Study goal</h1>
      <form onSubmit={submit} noValidate>
        <label htmlFor="goal">Your goal</label>
        <input id="goal" value={goal} onChange={event => setGoal(event.target.value)}
          aria-invalid={!!error} aria-describedby={error ? "goal-error" : undefined} />
        <button type="submit">Save goal</button>
        {error && <p id="goal-error" role="alert">{error}</p>}
      </form>
      {savedGoal && <p role="status">Saved goal: {savedGoal}</p>}
    </section>
  );
}
