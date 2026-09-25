export default function PromptInput({
  value,
  onChange,
  onSubmit,
  loading,
  validationMessage,
}) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <section className="prompt-section" aria-labelledby="prompt-heading">
      <h2 id="prompt-heading" className="sr-only">
        Enter study topic
      </h2>

      <form className="prompt-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="study-input" className="prompt-label">
          What would you like to study?
        </label>

        <textarea
          id="study-input"
          className="prompt-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes or enter a topic to study..."
          rows={5}
          disabled={loading}
          aria-describedby={validationMessage ? 'input-error' : undefined}
        />

        {validationMessage && (
          <p id="input-error" className="validation-message" role="alert">
            {validationMessage}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Generating...' : 'Generate Flashcards'}
        </button>
      </form>
    </section>
  );
}
