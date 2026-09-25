export default function Flashcard({ card, flipped, onFlip }) {
  return (
    <div className="flashcard-wrapper">
      <button
        type="button"
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? 'Hide answer' : 'Reveal answer'}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className="flashcard-label">Question</span>
            <p className="flashcard-text">{card.question}</p>
            <span className="flashcard-hint">Tap to reveal answer</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="flashcard-label">Answer</span>
            <p className="flashcard-text">{card.answer}</p>
          </div>
        </div>
      </button>
    </div>
  );
}
