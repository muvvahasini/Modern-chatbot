import { useState } from 'react';
import BlockRenderer from './blocks/BlockRenderer';
import { refineStudySet } from '../lib/api';
import { saveSession } from '../lib/sessions';
import { validateResult } from '../lib/validateResult';

export default function StudySetView({ studySet, onStudySetChange, onStartOver, onStartQuiz, hasFlashcards }) {
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleRefine = async (e) => {
    e.preventDefault();
    if (!refineInput.trim()) return;
    setIsRefining(true);
    setRefineError('');

    try {
      const updated = await refineStudySet(studySet, refineInput.trim());
      const result = validateResult(updated);
      if (!result.valid) {
        setRefineError(result.error || 'Refined set was invalid.');
        return;
      }
      onStudySetChange(result.data);
      setRefineInput('');
    } catch (err) {
      setRefineError('Refinement failed. Please try again.');
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = () => {
    saveSession(studySet);
    setSavedMsg('Session saved!');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const flashcardCount = studySet.blocks?.filter((b) => b.type === 'flashcard').length || 0;
  const checklistCount = studySet.blocks?.filter((b) => b.type === 'checklist').length || 0;
  const statCount = studySet.blocks?.filter((b) => b.type === 'stat').length || 0;

  return (
    <div className="study-set-view">
      {/* Header */}
      <div className="study-set-header glass-panel">
        <div className="study-set-meta">
          <h2 className="study-set-title">{studySet.title}</h2>
          <div className="block-summary">
            {flashcardCount > 0 && <span className="badge badge-flashcard">📇 {flashcardCount} Cards</span>}
            {checklistCount > 0 && <span className="badge badge-checklist">✅ {checklistCount} Lists</span>}
            {statCount > 0 && <span className="badge badge-stat">📊 {statCount} Stats</span>}
          </div>
        </div>
        <div className="study-set-actions">
          {hasFlashcards && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onStartQuiz}
              aria-label="Start quiz mode"
            >
              ▶ Study Quiz
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSave}
            aria-label="Save session"
          >
            {savedMsg || '💾 Save Session'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onStartOver}
            aria-label="Start new study set"
          >
            ✕ New Study
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!studySet.blocks?.length ? (
        <div className="state-panel empty-state">
          <p className="state-message">Your study set is empty. Use the Refine panel below to add blocks, or start over.</p>
        </div>
      ) : (
        <div className="blocks-grid">
          {studySet.blocks.map((block, i) => (
            <div
              key={block.id || i}
              className="block-wrapper"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <BlockRenderer block={block} />
            </div>
          ))}
        </div>
      )}

      {/* Refinement panel */}
      <div className="refine-panel glass-panel">
        <h3 className="refine-title">✏️ Refine this Study Set</h3>
        <p className="refine-subtitle">Ask the AI to add, remove, or edit blocks without regenerating from scratch.</p>
        <form className="refine-form" onSubmit={handleRefine}>
          <textarea
            className="prompt-textarea refine-textarea"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            placeholder='e.g. "Add 2 more flashcards about mitosis" or "Remove the checklist"'
            rows={3}
            disabled={isRefining}
          />
          {refineError && <p className="validation-message">{refineError}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isRefining || !refineInput.trim()}
            aria-busy={isRefining}
          >
            {isRefining ? 'Refining…' : 'Apply Refinement'}
          </button>
        </form>
      </div>

      <p className="keyboard-hint">Click flashcards to flip • Check off checklist items</p>
    </div>
  );
}
