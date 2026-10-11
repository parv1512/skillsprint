"use client";

import { useEffect, useState } from "react";
import { gradeMultipleChoice, type LearningActivity } from "@/lib/domain/learning";

type Props = {
  activity: LearningActivity; question: string; busy: boolean;
  chooseFormat: (format: LearningActivity["checkFormat"]) => void;
  createQuestion: () => void; checkAnswer: (option: number) => void;
  changeAnswer: (answer: string) => void; reviewAnswer: () => void;
};

export function MilestoneCheck({activity, question, busy, chooseFormat, createQuestion, checkAnswer, changeAnswer, reviewAnswer}: Props) {
  const [selected, setSelected] = useState<number | null>(activity.multipleChoiceAnswer);
  useEffect(() => setSelected(activity.multipleChoiceAnswer), [activity.multipleChoiceQuestion, activity.multipleChoiceAnswer]);
  const multiple = activity.checkFormat === "multiple-choice";
  const quiz = activity.multipleChoiceQuestion;
  const answered = activity.multipleChoiceAnswer !== null;
  return <section className="milestone-knowledge-check" aria-label="Milestone knowledge check">
    <h3>Knowledge check</h3>
    <fieldset className="check-format" data-check-format tabIndex={-1}><legend>Question format</legend>
      {(["multiple-choice", "short-answer"] as const).map(format => <label key={format}><input type="radio" name="milestone-check-format" checked={activity.checkFormat === format} disabled={busy} onChange={() => chooseFormat(format)} />{format === "multiple-choice" ? "Multiple choice" : "Short answer"}</label>)}
    </fieldset>
    <p className="quiet-note">Changing the format saves your choice. Create a question when ready.</p>
    <button className="button button-secondary" disabled={busy} onClick={createQuestion}>{multiple ? quiz ? "Create another multiple-choice question" : "Create multiple-choice question" : "Create short-answer question"}</button>
    {multiple ? quiz ? <>
      <fieldset className="check-options" data-check-question tabIndex={-1}><legend>{quiz.question}</legend>{quiz.options.map((option, index) => {
        const correct = answered && index === quiz.correctOption;
        const wrong = answered && index === activity.multipleChoiceAnswer && !correct;
        return <label key={index} className={correct ? "check-option-correct" : wrong ? "check-option-wrong" : undefined}><input type="radio" name="milestone-check-option" checked={(answered ? activity.multipleChoiceAnswer : selected) === index} disabled={busy || answered} onChange={() => setSelected(index)} /><span>{String.fromCharCode(65 + index)}. {option}{(correct || wrong) && <strong className="check-option-label">{correct ? "Correct answer" : "Your answer"}</strong>}</span></label>;
      })}</fieldset>
      {!answered && <button className="button button-primary" disabled={busy || selected === null} onClick={() => selected !== null && checkAnswer(selected)}>Check answer</button>}
      {answered && <div className="notice" role="status" data-check-result tabIndex={-1}><strong>{gradeMultipleChoice(quiz, activity.multipleChoiceAnswer!) ? "Correct" : "Keep practicing"} · App-graded</strong><p>Correct option: {String.fromCharCode(65 + quiz.correctOption)}. {quiz.options[quiz.correctOption]}</p><p>{quiz.explanation}</p></div>}
    </> : <p className="quiet-note">Create a multiple-choice question to begin.</p> : <>
      <div className="form-field"><label htmlFor="check-answer">Your explanation</label><p data-check-question tabIndex={-1}>{question}</p><textarea id="check-answer" rows={4} maxLength={4000} disabled={busy} value={activity.answer} onChange={event => changeAnswer(event.target.value)} placeholder="Explain in your own words." /></div>
      <button className="button button-primary" disabled={busy || !activity.answer.trim()} onClick={reviewAnswer}>Check understanding</button>
      {activity.review && activity.answer === activity.reviewedAnswer && <div className="notice" data-check-result tabIndex={-1}><strong>{activity.review.passed ? "Understanding demonstrated" : "Keep practicing"} · AI review</strong><p>{activity.review.feedback}</p><p>{activity.review.nextStep}</p></div>}
    </>}
    <p className="quiet-note">Milestone practice does not change Passport status. Mastery requires practical work and a passed written Passport skill check for that skill.</p>
  </section>;
}
