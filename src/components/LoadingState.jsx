export default function LoadingState() {
  return (
    <div className="state-panel loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="state-message">Generating your study cards...</p>
    </div>
  );
}
