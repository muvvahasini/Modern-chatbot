// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a smart study assistant. Given a topic or notes, you return a JSON study set.

The response MUST be a single JSON object. No markdown, no code fences, no explanation.

Schema:
{
  "title": "string",
  "blocks": [
    {
      "id": "block-1",
      "type": "flashcard",
      "question": "string",
      "answer": "string"
    },
    {
      "id": "block-2",
      "type": "checklist",
      "title": "string",
      "items": [
        { "text": "string", "detail": "string" }
      ]
    },
    {
      "id": "block-3",
      "type": "stat",
      "label": "string",
      "value": "string",
      "note": "string"
    }
  ]
}

Rules:
- Generate 5–10 blocks total
- Use a MIX of all 3 types: "flashcard", "checklist", and "stat"
- At least 3 flashcards, 1 checklist, 1 stat block
- flashcard: question tests understanding, answer is concise
- checklist: title describes the list; each item has a short "text" label AND a "detail" field with 1–2 sentences of explanation or context about that item
- stat: label is a metric name, value is a short number or percentage or date, note explains it
- All ids must be unique (block-1, block-2, …)
- Return ONLY the JSON object`;

const REFINE_SYSTEM_PROMPT = `You are a smart study assistant. The user has an existing study set and wants to refine it.

You will receive:
1. The current JSON study set
2. A refinement instruction from the user

Apply the instruction to modify the study set. You may add, remove, or edit blocks.
Return the COMPLETE updated study set as a single JSON object using the EXACT same schema.

No markdown, no code fences, no explanation — ONLY the updated JSON object.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { }
    }
    return null;
  }
}

function buildHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'StudyFlow',
  };
}

// ─── Core fetcher (non-streaming) ────────────────────────────────────────────

async function callOpenRouter(messages, apiKey) {
  const baseUrl = 'https://openrouter.ai/api/v1';
  const modelName = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    console.error('Fetch failed:', err);
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`API Error ${response.status}:`, errText);
    throw new Error('API_ERROR');
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content;

  if (!text?.trim()) throw new Error('EMPTY_RESPONSE');

  const parsed = extractJson(text);
  if (!parsed) throw new Error('MALFORMED_JSON');

  return parsed;
}

// ─── Core fetcher (streaming SSE) ────────────────────────────────────────────

async function callOpenRouterStream(messages, apiKey, onChunk) {
  const baseUrl = 'https://openrouter.ai/api/v1';
  const modelName = process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free';

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(apiKey),
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });
  } catch (err) {
    console.error('Fetch failed:', err);
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`API Error ${response.status}:`, errText);
    throw new Error('API_ERROR');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        accumulated += delta;
        if (delta) onChunk(delta);
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  const result = extractJson(accumulated);
  if (!result) throw new Error('MALFORMED_JSON');
  return result;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function generateStudySet(input) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: input },
  ];

  return callOpenRouter(messages, apiKey);
}

export async function generateStudySetStream(input, onChunk) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: input },
  ];

  return callOpenRouterStream(messages, apiKey, onChunk);
}

export async function refineStudySet(currentSet, instruction) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const messages = [
    { role: 'system', content: REFINE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Current study set:\n${JSON.stringify(currentSet, null, 2)}\n\nRefinement instruction:\n${instruction}`,
    },
  ];

  return callOpenRouter(messages, apiKey);
}
