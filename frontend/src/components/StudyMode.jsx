import { useState, useRef, useEffect } from 'react';

// Quiz mode: the user types their own answer BEFORE seeing the reference,
// submits it, and then must tap/click the card to flip it and reveal the
// real reference answer. Once revealed, we show an evaluation of their
// answer (keyword coverage) so they can self-grade. Marks persist so you
// can re-test only the cards you got wrong. The model's text is never shown
// raw — only the user's answer, the evaluation, and the reference after a tap.

const tokenize = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const evaluate = (user, ref) => {
  const u = new Set(tokenize(user));
  const r = new Set(tokenize(ref));
  const matched = [...r].filter((w) => u.has(w));
  const missing = [...r].filter((w) => !u.has(w));
  const denom = r.size;
  const score = denom === 0 ? (u.size === 0 ? 1 : 0) : matched.length / denom;
  return { score, matched, missing };
};

export default function StudyMode({ flashcards, onBack }) {
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false); // answer submitted
  const [revealed, setRevealed] = useState(false); // card tapped → reference shown
  const [marks, setMarks] = useState({}); // id -> 'know' | 'review'
  const [run, setRun] = useState('study'); // 'study' | 'results'
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    setDeck(flashcards);
    setMarks({});
    setIndex(0);
    setSubmitted(false);
    setRevealed(false);
    setUserAnswer('');
    setRun('study');
  }, [flashcards]);

  const ref = useRef(null);
  useEffect(() => {
    if (submitted) return;
    ref.current?.focus();
  }, [index, run, submitted]);

  const current = deck[index];
  const isLast = index === deck.length - 1;
  const total = flashcards.length;
  const wrongCards = flashcards.filter((c) => marks[c.id] === 'review');

  const submit = () => setSubmitted(true);
  const reveal = () => setRevealed(true);

  const mark = (value) => {
    if (!revealed || !current) return;
    setMarks((m) => ({ ...m, [current.id]: value }));
    setSubmitted(false);
    setRevealed(false);
    setUserAnswer('');
    if (isLast) {
      setRun('results');
    } else {
      setIndex((i) => i + 1);
    }
  };

  const retestWrong = () => {
    if (wrongCards.length === 0) return;
    setDeck(wrongCards);
    setIndex(0);
    setSubmitted(false);
    setRevealed(false);
    setUserAnswer('');
    setRun('study');
  };

  const restartAll = () => {
    setDeck(flashcards);
    setMarks({});
    setIndex(0);
    setSubmitted(false);
    setRevealed(false);
    setUserAnswer('');
    setRun('study');
  };

  const onKeyDown = (e) => {
    if (run === 'results') {
      if (e.key === 'Escape') onBack?.();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (revealed) {
        setRevealed(false);
      } else if (submitted) {
        setSubmitted(false);
        setUserAnswer('');
      } else {
        onBack?.();
      }
      return;
    }
    if (!submitted) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submit();
      }
      return;
    }
    // Submitted but not yet revealed: flip the card on space / down / right.
    if (!revealed) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        reveal();
      }
      return;
    }
    // Revealed: grade.
    if (e.key === '1' || e.key === 'ArrowRight') {
      e.preventDefault();
      mark('know');
    } else if (e.key === '2' || e.key === 'ArrowLeft') {
      e.preventDefault();
      mark('review');
    }
  };

  if (run === 'results' || deck.length === 0) {
    const wrongCount = wrongCards.length;
    const correctCount = total - wrongCount;
    return (
      <div className="study-mode" ref={ref} tabIndex={0}>
        <div className="study-results glass-panel">
          <h3 className="results-title">Results</h3>
          <div className="results-score">{correctCount}/{total}</div>
          <ul className="results-breakdown">
            <li className="result-stat"><span className="result-correct">✓ Know it</span> <span>{correctCount}</span></li>
            <li className="result-stat"><span className="result-wrong">✕ Need review</span> <span>{wrongCount}</span></li>
          </ul>
          {wrongCount > 0 ? (
            <>
              <button className="btn btn-primary" onClick={retestWrong}>Retest Wrong Answers ✦</button>
              <button className="btn btn-secondary" onClick={restartAll}>Restart All</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={restartAll}>Study Again</button>
          )}
          <button className="btn btn-secondary" onClick={onBack}>← Back to Plan</button>
        </div>
        <p className="keyboard-hint">Press Esc to go back • 1/2 or ←/→ to mark • Space to reveal</p>
      </div>
    );
  }

  const evaluation = evaluate(userAnswer, current.answer);
  const pct = Math.round(evaluation.score * 100);

  return (
    <div className="study-mode" ref={ref} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="study-progress">Card {index + 1} of {total}</div>

      {/* The card itself is the reveal surface: tap/click to flip and show the real answer. */}
      <div
        className={`study-card ${revealed ? 'flipped' : ''}`}
        onClick={() => {
          if (submitted && !revealed) reveal();
        }}
        role={submitted ? 'button' : undefined}
        aria-label={submitted && !revealed ? 'Tap to reveal the reference answer' : undefined}
      >
        <div className="study-card-inner">
          <div className="study-card-face study-card-front">
            <div className="study-card-label">Question</div>
            <p className="study-card-question">{current.question}</p>
            {submitted && !revealed && (
              <div className="reveal-hint">
                <span className="reveal-hint-text">✓ Your answer submitted</span>
                <span className="reveal-hint-sub">Tap the card to reveal the reference answer</span>
              </div>
            )}
          </div>
          <div className="study-card-face study-card-back">
            <div className="study-card-label">Reference answer</div>
            <p className="study-card-answer">{current.answer}</p>
          </div>
        </div>
      </div>

      {/* Phase 1: type your answer, then submit */}
      {!submitted && (
        <div className="study-self-answer">
          <label htmlFor="user-answer" className="self-answer-label">
            Your answer (type it in, or just think it through. Ctrl+Enter to submit):
          </label>
          <textarea
            id="user-answer"
            className="prompt-textarea"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={3}
          />
          <div className="study-actions">
            <button className="btn btn-primary" onClick={submit} disabled={!userAnswer.trim()}>Submit Answer ✦</button>
            <button className="btn btn-secondary" onClick={onBack}>← Back to Plan</button>
          </div>
        </div>
      )}

      {/* Phase 2: submitted, awaiting card tap to reveal the real answer */}
      {submitted && !revealed && (
        <div className="study-self-answer">
          <p className="study-note">
            Your answer is recorded. Flip the card above to see the reference answer, then grade yourself.
          </p>
          <div className="study-actions">
            <button className="btn btn-secondary" onClick={reveal}>Reveal Answer ✦</button>
            <button className="btn btn-secondary" onClick={onBack}>← Back to Plan</button>
          </div>
        </div>
      )}

      {/* Phase 3: revealed → evaluate + self-grade */}
      {submitted && revealed && (
        <div className="study-self-answer">
          <div className="answer-compare">
            <div className="answer-your">
              <h4>Your answer</h4>
              <p>{userAnswer || <em>(you didn't type an answer)</em>}</p>
            </div>
            <div className="answer-divider" />
            <div className="answer-reference">
              <h4>Reference answer</h4>
              <p>{current.answer}</p>
            </div>
          </div>

          <div className="study-evaluation glass-panel">
            <div className="eval-score">
              <span className="eval-label">Your answer covers</span>
              <span className={`eval-value ${pct >= 70 ? 'eval-good' : pct >= 40 ? 'eval-ok' : 'eval-poor'}`}>{pct}%</span>
              <span className="eval-of">of the reference material</span>
            </div>
            {evaluation.missing.length > 0 && (
              <div className="eval-missing">
                <span className="eval-missing-label">Key points you missed:</span>
                <ul>
                  {evaluation.missing.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.missing.length === 0 && userAnswer && (
              <p className="study-note">All key points covered. ✦</p>
            )}
          </div>

          <div className="study-actions">
            <button className="btn btn-mark btn-know" onClick={() => mark('know')}>Know it ✦</button>
            <button className="btn btn-mark btn-review" onClick={() => mark('review')}>Need Review</button>
          </div>
        </div>
      )}

      <p className="keyboard-hint">
        {!submitted
          ? 'Ctrl+Enter = submit answer • Esc = back'
          : !revealed
            ? 'Space/Enter/→ = reveal answer • Esc = back'
            : '1 = Know it • 2 = Need review • ←/→ = mark • Esc = back'}
      </p>
    </div>
  );
}
