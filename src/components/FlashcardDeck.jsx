import { useCallback, useEffect } from 'react';
import Flashcard from './Flashcard';
import ProgressBar from './ProgressBar';

export default function FlashcardDeck({
  title,
  cards,
  currentIndex,
  flipped,
  cardResults,
  onFlip,
  onPrevious,
  onNext,
  onMarkCorrect,
  onMarkWrong,
  onComplete,
}) {
  const currentCard = cards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === cards.length - 1;
  const currentResult = cardResults[currentCard?.id];

  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          if (!isFirst) onPrevious();
          break;
        case 'ArrowRight':
          if (!isLast) onNext();
          else if (currentResult) onComplete();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          onFlip();
          break;
        case '1':
          onMarkCorrect();
          break;
        case '2':
          onMarkWrong();
          break;
        default:
          break;
      }
    },
    [isFirst, isLast, currentResult, onPrevious, onNext, onFlip, onMarkCorrect, onMarkWrong, onComplete]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentCard) return null;

  return (
    <section className="deck-section" aria-labelledby="deck-title">
      <header className="deck-header">
        <h2 id="deck-title" className="deck-title">
          {title}
        </h2>
        <ProgressBar current={currentIndex + 1} total={cards.length} />
      </header>

      <Flashcard card={currentCard} flipped={flipped} onFlip={onFlip} />

      <div className="deck-controls">
        <div className="nav-controls">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrevious}
            disabled={isFirst}
            aria-label="Previous card"
          >
            ← Previous
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onFlip}
            aria-label={flipped ? 'Hide answer' : 'Reveal answer'}
          >
            {flipped ? 'Hide Answer' : 'Reveal Answer'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNext}
            disabled={isLast}
            aria-label="Next card"
          >
            Next →
          </button>
        </div>

        <div className="mark-controls">
          <button
            type="button"
            className={`btn btn-mark btn-know ${currentResult === 'correct' ? 'active' : ''}`}
            onClick={onMarkCorrect}
            aria-label="Mark as known"
            aria-pressed={currentResult === 'correct'}
          >
            ✓ Know it
          </button>

          <button
            type="button"
            className={`btn btn-mark btn-review ${currentResult === 'wrong' ? 'active' : ''}`}
            onClick={onMarkWrong}
            aria-label="Mark as needs review"
            aria-pressed={currentResult === 'wrong'}
          >
            ✕ Need review
          </button>
        </div>

        {isLast && (
          <button
            type="button"
            className="btn btn-primary btn-finish"
            onClick={onComplete}
            disabled={Object.keys(cardResults).length < cards.length}
          >
            View Results
          </button>
        )}
      </div>

      <p className="keyboard-hint">
        Keyboard: ← → navigate, Space to flip, 1 = know it, 2 = need review
      </p>
    </section>
  );
}
