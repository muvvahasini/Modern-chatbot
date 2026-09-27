# StudyFlow

An AI-powered interactive study assistant. Paste a topic or notes, and StudyFlow asks an LLM for a structured JSON study set (flashcards, checklists, and stat blocks), validates it, and renders it as interactive components you can flip, check off, quiz yourself on, and refine. The model's raw text is never displayed.

## Overview

StudyFlow is **not a chatbot**. It sends your input to an LLM through a secure backend proxy, receives structured JSON, validates the shape, and renders interactive components. The API key lives in `backend/.env` only and never reaches the browser.

## Features

- Free-form text input for notes or topics
- Real LLM integration via **OpenRouter** through a secure backend proxy
- Structured JSON output validated before rendering (malformed / wrong-shape / empty → error state)
- Interactive flip flashcards with dynamic height
- **Study mode quiz**: type your own answer, submit it, then **tap the card to reveal** the reference answer, see an evaluation of your coverage (keyword overlap + missed points), mark "Know it" / "Need review", see a results breakdown, and **re-test only the wrong answers**
- Checklists to tick off (with progress bar and expandable details)
- Stat blocks for key data points
- Refinement loop — ask the AI to add/remove/reorder blocks without regenerating
- Save and reload sessions (localStorage)
- Dark mode
- Loading, error, and empty states for every failure mode
- Stale-response protection (a newer request cancels an older, slower one)
- 45-second request timeout
- Mobile-responsive layout
- Keyboard navigation in Quiz mode (Ctrl+Enter = submit answer, Space/Enter/→/↓ = reveal answer, 1 = Know, 2 = Need review, ←/→ = mark, Esc = back)

## Tech Stack

- **React 18** — functional components and hooks
- **Vite** — frontend build tool and dev server
- **Express** — backend API proxy
- **OpenRouter API** — LLM for study-set generation
- **Plain CSS** — no UI framework

## Architecture

```
React (frontend/)
    ↓ POST /api/generate  (non-streaming) or /api/generate/stream (SSE)
Express backend (backend/)
    ↓ structured prompt
OpenRouter API
    ↓ JSON response
backend/generate.js parses & normalizes
    ↓
frontend/lib/validateResult.js (defensive shape check)
    ↓
Interactive study UI  (blocks, quiz, refinement, sessions)
```

The API key and model live in `backend/.env` only. The browser never sees them.

## Project Structure

```
flam/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── StudySetView.jsx      # block grid + header + refinement
│   │   │   ├── StudyMode.jsx         # quiz: flip / mark / results / retest
│   │   │   ├── SessionsPanel.jsx
│   │   │   └── blocks/
│   │   │       ├── BlockRenderer.jsx
│   │   │       ├── FlashcardBlock.jsx
│   │   │       ├── ChecklistBlock.jsx
│   │   │       └── StatBlock.jsx
│   │   ├── lib/
│   │   │   ├── api.js                # only place the frontend calls the backend
│   │   │   ├── sessions.js
│   │   │   └── validateResult.js     # shape-check before rendering
│   │   ├── App.jsx
│   │   └── index.css
│   └── vite.config.js  (proxies /api -> backend:3001)
├── backend/           # Express API proxy
│   ├── server.js
│   └── generate.js     # OpenRouter call + streaming + system prompts
├── .env.example
└── package.json        # npm start | npm run dev | npm run build
```

## Setup

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free tier works; `google/gemma-2-9b-it:free` is used by default)

### Installation

```bash
npm install
```

This installs the root tooling and, via `postinstall`, the `frontend/` and `backend/` dependencies.

### Environment Variables

The key never leaves the backend:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
OPENROUTER_API_KEY=sk-or-v1-…your…key…
OPENROUTER_MODEL=google/gemma-2-9b-it:free   # optional, any OpenRouter model
PORT=3001                                     # optional
```

### Run

```bash
npm start
```

This starts the Express backend (port `3001`) and the Vite dev server (port `5173`). Open [http://localhost:5173](http://localhost:5173).

For development, `npm run dev` works the same way.

## Usage

1. Open the app in your browser.
2. Enter notes or a topic (e.g. "Explain React hooks for a frontend developer interview").
3. Click **Generate Study Set**. Watch the structured blocks stream in live.
4. Flip flashcards, tick off checklists, and read stat blocks.
5. Click **▶ Study Quiz** to quiz yourself: type your answer, submit it, then **tap the card to reveal** the reference answer, see how well your answer covered the material, mark "Know it" / "Need review", and **Retest Wrong Answers**.
6. Use **Refine** to add, remove, or edit blocks without regenerating.
7. **💾 Save Session** to keep a plan; open **📂 Sessions** to reload it later.
8. In Quiz mode: `Ctrl`+`Enter` submits your answer, `Space`/`Enter`/`→`/`↓` reveal the card, `1` = Know, `2` = Need review, `Esc` goes back.

## AI Usage

AI tooling (an AI pair-programmer) was used during development for:
- Brainstorming the component hierarchy and state flow
- Debugging the Vite/Express proxy and streaming JSON parsing
- Reviewing edge cases in the validation logic

The implementation, prompts, and validation were written out by the candidate. AI-generated flashcard content may contain factual inaccuracies — always verify important facts independently.

## Failure Handling

The app surfaces a visible state for every realistic failure mode; the model's raw text is never shown to the user.

| Scenario | Behavior |
|---|---|
| Empty input | Validation message, no API call |
| Loading | Spinner + streaming JSON preview |
| Malformed JSON | "Couldn't understand the AI response." + Try Again |
| Wrong shape / missing fields | Validation error naming the issue + Try Again |
| Empty blocks array | "No study cards were generated. Try a more specific topic." |
| API / network failure | "Something went wrong..." + Try Again |
| Timeout (45s) | Error state + Try Again |
| Stale responses | Older requests are abandoned when a newer one is in flight |
| No API key | Backend returns `API_KEY_MISSING`; frontend shows an error |

## Known Limitations

- No persistence across devices — saved sessions live in this browser's `localStorage`
- Generated content may contain factual inaccuracies
- No user authentication
- Requires an internet connection and a valid OpenRouter API key
- English-language prompts work best

## Time Spent

Approximately 8 hours (the assignment's target budget).

## Future Improvements

- Default dark mode to the user's system preference
- Export a study set as JSON or PDF
- Difficulty level selection for flashcards
- Spaced repetition driven by quiz results
