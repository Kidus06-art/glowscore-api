import express from 'express';
import Replicate from 'replicate';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

router.post('/', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Missing image URLs.' });
    }

    const output = await replicate.run(
      'cjwbw/face-compare:7f7998a6e52a905a1237dbf24f209790213119505db30172bc609899fc56d14c',
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl,
        },
      }
    );

    const similarity = output?.similarity ?? null;

    if (similarity === null) {
      return res.status(422).json({
        error: 'Could not compute similarity. Try using clearer images.',
      });
    }

    const score = Math.round(similarity * 100);
    const description = `Your GlowScore is ${score}. Great improvement!`;

    return res.json({
      result: {
        score,
        description,
      },
    });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

export default router;
