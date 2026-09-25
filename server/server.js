import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateFlashcards } from './generate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.post('/api/generate', async (req, res) => {
  const { input } = req.body;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Input is required.',
    });
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Input is too long. Please keep it under 5000 characters.',
    });
  }

  try {
    const data = await generateFlashcards(trimmedInput);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Generation error:', err.message);

    if (err.message === 'API_KEY_MISSING') {
      return res.status(500).json({
        success: false,
        error: 'Server is not configured with an API key.',
      });
    }

    if (err.message === 'MALFORMED_JSON') {
      return res.status(502).json({
        success: false,
        error: 'MALFORMED_JSON',
      });
    }

    if (err.message === 'EMPTY_RESPONSE') {
      return res.status(502).json({
        success: false,
        error: 'EMPTY_RESPONSE',
      });
    }

    return res.status(502).json({
      success: false,
      error: 'GENERATION_FAILED',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`StudyFlow server running on http://localhost:${PORT}`);
});
