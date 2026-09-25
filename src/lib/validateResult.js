function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCard(card, index) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    return `Card at index ${index} is not a valid object.`;
  }

  if (!isNonEmptyString(card.id)) {
    return `Card at index ${index} is missing a valid id.`;
  }

  if (!isNonEmptyString(card.question)) {
    return `Card at index ${index} is missing a valid question.`;
  }

  if (!isNonEmptyString(card.answer)) {
    return `Card at index ${index} is missing a valid answer.`;
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

  if (!Array.isArray(data.cards)) {
    return { valid: false, error: 'Invalid AI response: cards must be an array.' };
  }

  if (data.cards.length === 0) {
    return {
      valid: false,
      error: 'No study cards were generated. Try a more specific topic.',
    };
  }

  const seenIds = new Set();

  for (let i = 0; i < data.cards.length; i++) {
    const cardError = validateCard(data.cards[i], i);
    if (cardError) {
      return { valid: false, error: cardError };
    }

    const trimmedId = data.cards[i].id.trim();
    if (seenIds.has(trimmedId)) {
      return { valid: false, error: `Duplicate card id: ${trimmedId}` };
    }
    seenIds.add(trimmedId);
  }

  const normalized = {
    title: data.title.trim(),
    cards: data.cards.map((card) => ({
      id: card.id.trim(),
      question: card.question.trim(),
      answer: card.answer.trim(),
    })),
  };

  return { valid: true, data: normalized };
}
