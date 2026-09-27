// ─── Defensive validation for AI-generated study sets ─────────────────────────
// Kept separate from rendering so shape-checking is easy to point to and reason
// about on its own. Anything that fails validation routes to an error state —
// malformed JSON, wrong shape, empty, missing fields — never to a blank render.

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBlock(block, index) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return `Block at index ${index} is not a valid object.`;
  }

  if (!isNonEmptyString(block.id)) {
    return `Block at index ${index} is missing a valid id.`;
  }

  const type = block.type;
  if (type !== 'flashcard' && type !== 'checklist' && type !== 'stat') {
    return `Block at index ${index} has an unsupported type "${type}".`;
  }

  if (type === 'flashcard') {
    if (!isNonEmptyString(block.question)) return `Block at index ${index} (flashcard) is missing a question.`;
    if (!isNonEmptyString(block.answer)) return `Block at index ${index} (flashcard) is missing an answer.`;
  } else if (type === 'checklist') {
    if (!isNonEmptyString(block.title)) return `Block at index ${index} (checklist) is missing a title.`;
    if (!Array.isArray(block.items) || block.items.length === 0) {
      return `Block at index ${index} (checklist) must have at least one item.`;
    }
  } else if (type === 'stat') {
    if (!isNonEmptyString(block.label)) return `Block at index ${index} (stat) is missing a label.`;
    if (!isNonEmptyString(block.value)) return `Block at index ${index} (stat) is missing a value.`;
  }

  return null;
}

export function validateResult(raw) {
  if (raw === null || raw === undefined) {
    return { valid: false, error: 'Invalid AI response' };
  }

  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { valid: false, error: "Couldn't understand the AI response." };
    }
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Invalid AI response' };
  }

  if (!isNonEmptyString(data.title)) {
    return { valid: false, error: 'Invalid AI response: missing title.' };
  }

  if (!Array.isArray(data.blocks)) {
    return { valid: false, error: 'Invalid AI response: blocks must be an array.' };
  }

  if (data.blocks.length === 0) {
    return {
      valid: false,
      error: 'No study cards were generated. Try a more specific topic.',
    };
  }

  const seenIds = new Set();
  for (let i = 0; i < data.blocks.length; i++) {
    const blockError = validateBlock(data.blocks[i], i);
    if (blockError) {
      return { valid: false, error: blockError };
    }
    const trimmedId = data.blocks[i].id.trim();
    if (seenIds.has(trimmedId)) {
      return { valid: false, error: `Duplicate block id: ${trimmedId}` };
    }
    seenIds.add(trimmedId);
  }

  const normalized = {
    title: data.title.trim(),
    blocks: data.blocks.map((block) => {
      const next = { ...block, id: block.id.trim() };
      if (next.type === 'flashcard') {
        next.question = block.question.trim();
        next.answer = block.answer.trim();
      } else if (next.type === 'checklist') {
        next.title = block.title.trim();
        next.items = block.items.map((item) =>
          typeof item === 'string'
            ? { text: item, detail: '' }
            : { text: String(item.text || '').trim(), detail: String(item.detail || '').trim() }
        );
      } else if (next.type === 'stat') {
        next.label = block.label.trim();
        next.value = block.value.trim();
        next.note = (block.note || '').trim();
      }
      return next;
    }),
  };

  return { valid: true, data: normalized };
}
