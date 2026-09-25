const API_URL = '/api/generate';
const REQUEST_TIMEOUT_MS = 30000;

export async function generateFlashcards(input, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onAbort);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const serverError = payload?.error;

      if (serverError === 'MALFORMED_JSON') {
        throw new Error("Couldn't understand the AI response.");
      }

      if (serverError === 'EMPTY_RESPONSE') {
        throw new Error('No study cards were generated. Try a more specific topic.');
      }

      throw new Error('Something went wrong while generating your cards.');
    }

    if (!payload?.success || !payload?.data) {
      throw new Error('Something went wrong while generating your cards.');
    }

    return payload.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      if (signal?.aborted) {
        throw err;
      }
      throw new Error('Generation is taking too long.');
    }

    if (err.message === 'Failed to fetch') {
      throw new Error('Something went wrong while generating your cards.');
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
