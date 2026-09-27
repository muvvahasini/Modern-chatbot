import { useState, useRef, useCallback, useEffect } from 'react';
import { generateStudySetStream } from './lib/api';
import { validateResult } from './lib/validateResult';
import StudySetView from './components/StudySetView';
import StudyMode from './components/StudyMode';
import SessionsPanel from './components/SessionsPanel';

const VIEWS = {
  LANDING:  'landing',
  INPUT:    'input',
  LOADING:  'loading',
  STUDY:    'study',
  QUIZ:     'quiz',
  ERROR:    'error',
};

// ─── Streaming preview ────────────────────────────────────────────────────────

function StreamingLoader({ chunks }) {
  return (
    <div className="streaming-loader glass-panel">
      <div className="streaming-header">
        <span>🤖 Building your study set…</span>
      </div>
      <pre className="streaming-text">{chunks || 'Contacting the AI…'}</pre>
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────

function Landing({ onNext }) {
  return (
    <div className="landing-page">
      <h2 className="landing-title">Turn Notes into Knowledge</h2>
      <p className="landing-subtitle">
        Paste any notes or topic and the AI returns structured flashcards, checklists, and stats you can
        flip, check off, and refine — no chat window.
      </p>

      <div className="diagram-container">
        <div className="diagram-step glass-panel">
          <div className="step-icon">📝</div>
          <h3>1. Provide Text</h3>
          <p>Paste notes, a topic, or any paragraph into the box.</p>
        </div>
        <div className="diagram-arrow">➜</div>
        <div className="diagram-step glass-panel">
          <div className="step-icon">🤖</div>
          <h3>2. AI Streams Blocks</h3>
          <p>Structured JSON flashcards, checklists &amp; stats appear live as they generate.</p>
        </div>
        <div className="diagram-arrow">➜</div>
        <div className="diagram-step glass-panel">
          <div className="step-icon">🎴</div>
          <h3>3. Study &amp; Refine</h3>
          <p>Flip cards, take a quiz, re-test wrong answers, and refine anytime.</p>
        </div>
      </div>

      <div className="flashcard-note glass-panel">
        <strong>💡 What are study blocks?</strong><br />
        StudyFlow parses the AI's structured JSON and renders interactive components — <em>flashcards</em> you can
        flip, <em>checklists</em> to tick off, and <em>stat blocks</em> for key data. You can also quiz yourself
        and re-test the answers you got wrong.
      </div>

      <button className="btn btn-primary landing-btn" onClick={onNext}>
        Try the Study Bot ✦
      </button>
    </div>
  );
}

// ─── Input section ───────────────────────────────────────────────────────────

function InputSection({ value, onChange, validation, error, view, onGenerate }) {
  return (
    <section className="prompt-section" aria-label="Study input">
      <div className="features-description glass-panel">
        <h2 className="features-title">How StudyFlow Works</h2>
        <ul className="features-list">
          <li><strong>1. Enter your topic:</strong> Paste study notes or type any subject.</li>
          <li><strong>2. AI streams blocks:</strong> Flashcards, checklists, and stat blocks appear live.</li>
          <li><strong>3. Study interactively:</strong> Flip cards, take a quiz, save sessions.</li>
          <li><strong>4. Refine on the fly:</strong> Ask the AI to edit your study set without regenerating.</li>
        </ul>
      </div>

      <form
        className="prompt-form"
        onSubmit={(e) => { e.preventDefault(); onGenerate(); }}
        noValidate
      >
        <label htmlFor="study-input" className="prompt-label">
          What would you like to study?
        </label>
        <textarea
          id="study-input"
          className="prompt-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='e.g. "Explain React hooks for a frontend developer interview"'
          rows={5}
          disabled={view === VIEWS.LOADING}
        />
        {validation && (
          <p className="validation-message" role="alert">{validation}</p>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={view === VIEWS.LOADING}
          aria-busy={view === VIEWS.LOADING}
        >
          {view === VIEWS.LOADING ? 'Generating…' : 'Generate Study Set ✦'}
        </button>
      </form>

      {view === VIEWS.ERROR && (
        <div className="error-banner" role="alert">
          <p>{error || 'Something went wrong.'}</p>
          <button className="btn btn-secondary btn-sm" onClick={onGenerate}>Retry</button>
        </div>
      )}
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView]             = useState(VIEWS.LANDING);
  const [input, setInput]           = useState('');
  const [studySet, setStudySet]     = useState(null);
  const [error, setError]           = useState('');
  const [validation, setValidation] = useState('');
  const [streamChunks, setStreamChunks] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [darkMode, setDarkMode]     = useState(true);

  const abortRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  const flashcards = studySet?.blocks?.filter((b) => b.type === 'flashcard') || [];
  const hasFlashcards = flashcards.length > 0;

  const resetSession = useCallback(() => {
    setView(VIEWS.INPUT);
    setStudySet(null);
    setError('');
    setValidation('');
    setStreamChunks('');
    setShowSessions(false);
  }, []);

  // Validate the AI result before it ever reaches the UI.
  const acceptStudySet = useCallback((data) => {
    const result = validateResult(data);
    if (!result.valid) {
      setError(result.error || 'Invalid AI response.');
      setView(VIEWS.ERROR);
      return;
    }
    setStudySet(result.data);
    setView(VIEWS.STUDY);
  }, []);

  const handleGenerate = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setValidation('Please enter a topic or notes first.');
      return;
    }
    setValidation('');
    setError('');
    setStreamChunks('');

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setView(VIEWS.LOADING);

    try {
      const data = await generateStudySetStream({
        input: trimmed,
        signal: controller.signal,
        onChunk: (chunk) => setStreamChunks((prev) => prev + chunk),
        onDone: (data) => acceptStudySet(data),
        onError: (err) => {
          setError(err || 'Something went wrong while generating your study set.');
          setView(VIEWS.ERROR);
        },
      });
      if (data) acceptStudySet(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong while generating your study set.');
      setView(VIEWS.ERROR);
    }
  }, [input, acceptStudySet]);

  const handleLoadSession = useCallback((set) => {
    setStudySet(set);
    setView(VIEWS.STUDY);
    setShowSessions(false);
  }, []);

  const showInput = view === VIEWS.INPUT || view === VIEWS.ERROR;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <button
          className="header-logo-btn"
          onClick={() => setView(view === VIEWS.LANDING ? VIEWS.INPUT : VIEWS.LANDING)}
          aria-label="Home"
        >
          <h1 className="app-title">StudyFlow</h1>
        </button>
        <p className="app-subtitle">AI-powered interactive study blocks</p>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSessions((s) => !s)}
            aria-pressed={showSessions}
          >
            📂 Sessions
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── Sessions slide-down ── */}
      {showSessions && (
        <div className="sessions-dropdown glass-panel">
          <h3 className="sessions-heading">Saved Sessions</h3>
          <SessionsPanel onLoad={handleLoadSession} />
        </div>
      )}

      <main className="app-main">
        {/* ── Landing ── */}
        {view === VIEWS.LANDING && (
          <Landing onNext={() => setView(VIEWS.INPUT)} />
        )}

        {/* ── Input ── */}
        {showInput && (
          <InputSection
            value={input}
            onChange={setInput}
            validation={validation}
            error={error}
            view={view}
            onGenerate={handleGenerate}
          />
        )}

        {/* ── Streaming loader ── */}
        {view === VIEWS.LOADING && (
          <StreamingLoader chunks={streamChunks} />
        )}

        {/* ── Study Set ── */}
        {view === VIEWS.STUDY && studySet && (
          <StudySetView
            studySet={studySet}
            onStudySetChange={setStudySet}
            onStartOver={resetSession}
            onStartQuiz={() => hasFlashcards && setView(VIEWS.QUIZ)}
            hasFlashcards={hasFlashcards}
          />
        )}

        {/* ── Quiz / Study Mode ── */}
        {view === VIEWS.QUIZ && hasFlashcards && (
          <StudyMode flashcards={flashcards} onBack={() => setView(VIEWS.STUDY)} />
        )}

        {/* Fallback: quiz requested but no cards */}
        {view === VIEWS.QUIZ && !hasFlashcards && (
          <div className="state-panel" role="alert">
            <p className="state-message">This study set has no flashcards to quiz on. Go back and add some!</p>
            <button className="btn btn-secondary" onClick={() => setView(VIEWS.STUDY)}>← Back to Plan</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>StudyFlow — AI-Powered Interactive Study Blocks</p>
      </footer>
    </div>
  );
}
