import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are a study assistant that creates flashcards from user notes or topics.

Return ONLY valid JSON. No markdown, no code fences, no explanation, no extra text.

Follow this exact schema:
{
  "title": "string",
  "cards": [
    {
      "id": "card-1",
      "question": "string",
      "answer": "string"
    }
  ]
}

Rules:
- Generate 5 to 10 flashcards relevant to the user's input
- title must be a concise topic name
- each card id must be unique (card-1, card-2, etc.)
- questions and answers must be concise and useful for studying
- questions should test understanding, not just recall of trivial facts
- return ONLY the JSON object, nothing else`;

function extractJson(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  let cleaned = text.trim();

  // Strip markdown code fences if the model wraps JSON anyway
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find a JSON object in the response
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function generateFlashcards(input) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `${SYSTEM_PROMPT}

User input:
${input}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text || !text.trim()) {
    throw new Error('EMPTY_RESPONSE');
  }

  const parsed = extractJson(text);

  if (!parsed) {
    throw new Error('MALFORMED_JSON');
  }

  return parsed;
}
