import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStudySet, generateStudySetStream, refineStudySet } from './generate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '64kb' }));

// ─── Generate (non-streaming) ─────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { input } = req.body;
  if (!input?.trim()) {
    return res.status(400).json({ success: false, error: 'Input is required.' });
  }
  if (input.trim().length > 5000) {
    return res.status(400).json({ success: false, error: 'Input too long (max 5000 chars).' });
  }

  try {
    const data = await generateStudySet(input.trim());
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Generation error:', err.message);
    return handleError(res, err);
  }
});

// ─── Generate (streaming SSE) ─────────────────────────────────────────────────
app.post('/api/generate/stream', async (req, res) => {
  const { input } = req.body;
  if (!input?.trim()) {
    return res.status(400).json({ success: false, error: 'Input is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const data = await generateStudySetStream(input.trim(), (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ type: 'done', data })}\n\n`);
  } catch (err) {
    console.error('Stream generation error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
  }

  res.end();
});

// ─── Refine ───────────────────────────────────────────────────────────────────
app.post('/api/refine', async (req, res) => {
  const { currentSet, instruction } = req.body;
  if (!currentSet || !instruction?.trim()) {
    return res.status(400).json({ success: false, error: 'currentSet and instruction are required.' });
  }

  try {
    const data = await refineStudySet(currentSet, instruction.trim());
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Refinement error:', err.message);
    return handleError(res, err);
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Error helper ─────────────────────────────────────────────────────────────
function handleError(res, err) {
  const map = {
    API_KEY_MISSING: [500, 'Server is not configured with an API key.'],
    MALFORMED_JSON:  [502, 'MALFORMED_JSON'],
    EMPTY_RESPONSE:  [502, 'EMPTY_RESPONSE'],
    API_ERROR:       [502, 'GENERATION_FAILED'],
    NETWORK_ERROR:   [503, 'NETWORK_ERROR'],
  };
  const [status, message] = map[err.message] || [502, 'GENERATION_FAILED'];
  return res.status(status).json({ success: false, error: message });
}

// ─── Serve the built frontend (production) ─────────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

app.listen(PORT, () => {
  console.log(`StudyFlow server running on http://localhost:${PORT}`);
});
