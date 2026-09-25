import { useState, useRef, useCallback } from 'react';
import PromptInput from './components/PromptInput';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import FlashcardDeck from './components/FlashcardDeck';
import Results from './components/Results';
import { generateFlashcards } from './lib/api';
import { validateResult } from './lib/validateResult';

const VIEWS = {
  INPUT: 'input',
  LOADING: 'loading',
  DECK: 'deck',
  RESULTS: 'results',
  ERROR: 'error',
};

export default function App() {
  const [input, setInput] = useState('');
  const [view, setView] = useState(VIEWS.INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardResults, setCardResults] = useState({});
  const [isRetest, setIsRetest] = useState(false);
  const [activeCards, setActiveCards] = useState([]);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const resetSession = useCallback(() => {
    setView(VIEWS.INPUT);
    setResult(null);
    setError(null);
    setValidationMessage('');
    setCurrentCardIndex(0);
    setFlipped(false);
    setCardResults({});
    setIsRetest(false);
    setActiveCards([]);
  }, []);

  const startDeck = useCallback((data, cards, retest = false) => {
    setResult(data);
    setActiveCards(cards);
    setCurrentCardIndex(0);
    setFlipped(false);
    setCardResults({});
    setIsRetest(retest);
    setView(VIEWS.DECK);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed) {
      setValidationMessage('Please enter a topic or some notes first.');
      return;
    }

    setValidationMessage('');
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const id = ++requestIdRef.current;
    setView(VIEWS.LOADING);

    try {
      const rawData = await generateFlashcards(trimmed, controller.signal);

      if (id !== requestIdRef.current) return;

      const validation = validateResult(rawData);

      if (!validation.valid) {
        setError(validation.error);
        setView(VIEWS.ERROR);
        return;
      }

      startDeck(validation.data, validation.data.cards);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (id !== requestIdRef.current) return;

      setError(err.message || 'Something went wrong while generating your cards.');
      setView(VIEWS.ERROR);
    }
  }, [input, startDeck]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleGenerate();
  }, [handleGenerate]);

  const handleMarkCorrect = useCallback(() => {
    const card = activeCards[currentCardIndex];
    if (!card) return;
    setCardResults((prev) => ({ ...prev, [card.id]: 'correct' }));
  }, [activeCards, currentCardIndex]);

  const handleMarkWrong = useCallback(() => {
    const card = activeCards[currentCardIndex];
    if (!card) return;
    setCardResults((prev) => ({ ...prev, [card.id]: 'wrong' }));
  }, [activeCards, currentCardIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentCardIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentCardIndex((i) => Math.min(activeCards.length - 1, i + 1));
    setFlipped(false);
  }, [activeCards.length]);

  const handleComplete = useCallback(() => {
    setView(VIEWS.RESULTS);
  }, []);

  const handleRetest = useCallback(() => {
    const wrongCards = activeCards.filter((c) => cardResults[c.id] === 'wrong');
    if (wrongCards.length === 0) return;
    startDeck(result, wrongCards, true);
  }, [activeCards, cardResults, result, startDeck]);

  const showInput = view !== VIEWS.DECK && view !== VIEWS.RESULTS;
  const isLoading = view === VIEWS.LOADING;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">StudyFlow</h1>
        <p className="app-subtitle">AI-powered interactive study flashcards</p>
      </header>

      <main className="app-main">
        {view === VIEWS.INPUT && !result && (
          <div className="empty-state">
            <p className="empty-message">
              Enter your notes or a topic below to generate personalized flashcards.
            </p>
          </div>
        )}

        {showInput && (
          <PromptInput
            value={input}
            onChange={setInput}
            onSubmit={handleGenerate}
            loading={isLoading}
            validationMessage={validationMessage}
          />
        )}

        {isLoading && <LoadingState />}

        {view === VIEWS.ERROR && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {view === VIEWS.DECK && result && (
          <FlashcardDeck
            title={isRetest ? `${result.title} — Review` : result.title}
            cards={activeCards}
            currentIndex={currentCardIndex}
            flipped={flipped}
            cardResults={cardResults}
            onFlip={() => setFlipped((f) => !f)}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onMarkCorrect={handleMarkCorrect}
            onMarkWrong={handleMarkWrong}
            onComplete={handleComplete}
          />
        )}

        {view === VIEWS.RESULTS && result && (
          <Results
            cards={activeCards}
            cardResults={cardResults}
            onRetest={handleRetest}
            onStartOver={resetSession}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>StudyFlow — Frontend Internship Assignment</p>
      </footer>
    </div>
  );
}
