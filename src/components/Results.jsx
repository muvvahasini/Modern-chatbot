export default function Results({ cards, cardResults, onRetest, onStartOver }) {
  const correctCount = cards.filter((c) => cardResults[c.id] === 'correct').length;
  const wrongCount = cards.filter((c) => cardResults[c.id] === 'wrong').length;
  const total = cards.length;

  if (wrongCount === 0) {
    return (
      <section className="results-panel success-results" aria-labelledby="results-heading">
        <h2 id="results-heading" className="results-title">
          Great! You got every card right.
        </h2>
        <p className="results-summary">
          You answered all {total} cards correctly.
        </p>
        <button type="button" className="btn btn-primary" onClick={onStartOver}>
          Study Something New
        </button>
      </section>
    );
  }

  return (
    <section className="results-panel" aria-labelledby="results-heading">
      <h2 id="results-heading" className="results-title">
        Study Session Complete
      </h2>

      <p className="results-score">
        {correctCount} / {total}
      </p>

      <ul className="results-breakdown">
        <li className="result-stat result-correct">
          <span aria-hidden="true">✓</span> {correctCount} Correct
        </li>
        <li className="result-stat result-wrong">
          <span aria-hidden="true">✕</span> {wrongCount} Need Review
        </li>
      </ul>

      <div className="results-actions">
        <button type="button" className="btn btn-primary" onClick={onRetest}>
          Retest Wrong Answers
        </button>
        <button type="button" className="btn btn-secondary" onClick={onStartOver}>
          Study Something New
        </button>
      </div>
    </section>
  );
}
