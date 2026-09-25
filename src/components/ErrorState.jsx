export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel error-state" role="alert">
      <p className="state-message">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
