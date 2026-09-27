// ─── Structured data shape returned by the AI ───────────────────────────────
// Step 1 deliverable: the exact JSON shape the LLM prompt asks for. The backend
// receives the model's text and lib/validateResult.js validates it against this
// shape before the frontend ever renders anything.

// A study set is a single JSON object:
// {
//   "title": string,          // short heading for the plan (non-empty)
//   "blocks": Block[]         // 5–10 blocks; a mix of all three types
// }

// Block — discriminated union on `type`:
//   flashcard: { id, type: "flashcard", question, answer }
//   checklist: { id, type: "checklist", title, items: [{ text, detail }] }
//   stat:     { id, type: "stat", label, value, note }

// Structural rules enforced by lib/validateResult.js:
//  - title is a non-empty string
//  - blocks is a non-empty array
//  - every block has a unique, non-empty id
//  - flashcards require non-empty question & answer
//  - checklists require a non-empty title and at least one item
//  - stat blocks require non-empty label & value
//  - any `type` other than flashcard / checklist / stat is rejected
