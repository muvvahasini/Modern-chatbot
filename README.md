# StudyFlow

An AI-powered interactive study assistant that turns free-form notes or topics into flashcards. Enter what you want to study, and StudyFlow generates a deck you can flip through, mark as known or needing review, and retest on wrong answers.

## Overview

StudyFlow is **not a chatbot**. It sends your input to an LLM through a secure backend proxy, receives structured JSON, validates the response, and renders interactive flashcard components. Raw AI text is never displayed to the user.

## Features

- Free-form text input for notes or topics
- Real LLM integration (Google Gemini) via secure backend proxy
- Structured JSON output with defensive validation
- Interactive flip flashcards with progress tracking
- Mark cards as "Know it" or "Need review"
- Session results with retest for wrong answers
- Loading, empty, and error states
- Request timeout (30 seconds)
- Stale response protection for rapid submissions
- Mobile responsive layout
- Keyboard navigation (arrow keys, space, 1/2)

## Tech Stack

- **React 18** — functional components and hooks
- **Vite** — frontend build tool and dev server
- **Express** — backend API proxy
- **Google Gemini** — LLM for flashcard generation
- **Plain CSS** — no UI framework

## Architecture

```
React (browser)
    ↓ POST /api/generate
Express backend (server/)
    ↓ structured prompt
Google Gemini API
    ↓ JSON response
Backend parses & returns data
    ↓
Frontend validateResult.js
    ↓
Interactive flashcard UI
```

The API key lives in `.env` on the server only. The browser never sees it.

## Setup

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/apikey) API key

### Installation

```bash
npm install
```

### Environment Variables

Copy the example env file and add your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```
GEMINI_API_KEY=your_actual_api_key_here
```

### Run

```bash
npm start
```

This starts both the Express backend (port 3001) and the Vite dev server (port 5173). Open [http://localhost:5173](http://localhost:5173).

For development, `npm run dev` works the same way.

## Usage

1. Open the app in your browser.
2. Enter notes or a topic (e.g. "Explain React hooks for a frontend developer interview").
3. Click **Generate Flashcards**.
4. Flip cards to reveal answers.
5. Mark each card as **Know it** or **Need review**.
6. Navigate with Previous/Next or keyboard arrows.
7. View your results at the end.
8. Click **Retest Wrong Answers** to study only missed cards.

## AI Usage

AI tools (ChatGPT, GitHub Copilot, and Cursor) were used during development for:

- Brainstorming architecture and component structure
- Debugging integration issues
- Reviewing code for edge cases
- Implementation assistance

The final implementation was reviewed, tested, and understood. AI-generated content in flashcards may contain factual inaccuracies — always verify important facts independently.

## Failure Handling

| Scenario | Behavior |
|---|---|
| Empty input | Validation message shown, no API call |
| Loading | Spinner with "Generating your study cards..." |
| Malformed JSON | "Couldn't understand the AI response." + Try Again |
| Wrong response shape | Controlled error state, no crash |
| Empty cards array | "No study cards were generated. Try a more specific topic." |
| API/network failure | "Something went wrong while generating your cards." + Try Again |
| Timeout (30s) | "Generation is taking too long." + Try Again |
| Stale responses | Older requests are ignored when a newer one is in flight |

## Known Limitations

- No persistence — refreshing the page clears your session
- Generated content may contain factual inaccuracies
- No user authentication
- Single-session study only (no saved decks)
- Requires an internet connection and valid API key
- English-language prompts work best

## Time Spent

Approximately 8 hours.

## Future Improvements

- Dark mode
- Deck persistence (localStorage)
- Export flashcards as JSON or PDF
- Difficulty level selection
- More animation polish
