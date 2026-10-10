import { expect, it } from "vitest";
import { loadEnvFile } from "node:process";
import { learningRequestSchema, reviewSchema } from "../src/lib/domain/learning";
import { targetedCheckSchema } from "../src/lib/domain/passport";
import { generateLearning } from "../src/lib/ai/learning";

it.skipIf(process.env.SKILLSPRINT_LEARNING_LIVE_TEST !== "1")("generates and reviews a real targeted Gemini check (no student evidence awarded)", async () => {
  loadEnvFile(".env.local");
  const input = learningRequestSchema.parse({action: "quiz", skillId: "react.state", milestoneId: "one", intake: {idea: "Build a study planner with an assignment list", experience: "beginner", preferredStack: "React and TypeScript", availableHours: 5, existingKnowledge: "Basic HTML and CSS"}, roadmap: {title: "Study planner", summary: "Track assignments", scopeNotes: "", milestones: [{id: "one", title: "Assignment list state", outcome: "Keep tasks in state", skillIds: ["react.state"], prerequisiteIds: [], tasks: ["Add an assignment using state"], resources: [], estimatedHours: 2, acceptanceCriteria: ["Added tasks appear"], assessmentPrompt: "Explain how state updates render the list"}]}});
  console.log("Live learning model:", process.env.GEMINI_MODEL);
  const fetcher: typeof fetch = async (url, init) => {
    const response = await fetch(url, init);
    console.log("Live learning provider response:", response.status);
    return response;
  };
  const options = {apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, fetcher};
  const quiz = targetedCheckSchema.parse(await generateLearning(input, options));
  expect(quiz.question.length).toBeGreaterThan(10);
  const answer = "React state persists across renders and its setter schedules a new render. A local variable resets when the component runs and assigning it doesn't notify React. For a list I use const [tasks, setTasks] = useState<Assignment[]>([]). To add a task, setTasks(previous => [...previous, newTask]) creates a new array instead of mutating it. The functional updater uses the latest previous state, avoiding stale captured arrays when updates are queued. I render tasks.map(task => ...) so the next render displays the new list. I don't mutate tasks with push or assign tasks directly.";
  const review = reviewSchema.parse(await generateLearning({...input, action: "check", knowledgeCheck: quiz.question, answer}, options));
  expect(typeof review.passed).toBe("boolean"); expect(review.feedback.length).toBeGreaterThan(0);
  console.log("Live targeted question and AI review validated; no database or Passport evidence written.");
}, 245000);
