const BASE = '/api';
const TIMEOUT_MS = 45000;

// ─── Generate (streaming) ─────────────────────────────────────────────────────

export function generateStudySetStream({ input, onChunk, onDone, onError, signal }) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    fetch(`${BASE}/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('GENERATION_FAILED');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const json = JSON.parse(line.slice(6));
                if (json.type === 'chunk') onChunk?.(json.content);
                if (json.type === 'done') { onDone?.(json.data); resolve(json.data); }
                if (json.type === 'error') { onError?.(json.error); reject(new Error(json.error)); }
              } catch { /* skip */ }
            }
          }
        };

        await pump();
      })
      .catch((err) => {
        if (err.name === 'AbortError') reject(new DOMException('Aborted', 'AbortError'));
        else reject(err);
      })
      .finally(() => clearTimeout(timeout));
  });
}

// ─── Generate (non-streaming fallback) ───────────────────────────────────────

export async function generateStudySet(input, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || 'GENERATION_FAILED');
    if (!payload?.success) throw new Error('GENERATION_FAILED');
    return payload.data;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Refine ───────────────────────────────────────────────────────────────────

export async function refineStudySet(currentSet, instruction) {
  const res = await fetch(`${BASE}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentSet, instruction }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || 'REFINE_FAILED');
  if (!payload?.success) throw new Error('REFINE_FAILED');
  return payload.data;
}
