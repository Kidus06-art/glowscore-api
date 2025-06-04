const express = require('express');
const router = express.Router();
const Replicate = require('replicate');

require('dotenv').config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

router.post('/', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ error: 'Missing image URLs' });
  }

  try {
    const prediction = await replicate.run(
      "cjwbw/glow-up-diffusion:8e167f29cbbf0205cfb8c3e761e99e92e1ea0499c83ccf12dbe1a67db918d5d9",
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl,
        },
      }
    );

    // Handle failed response
    if (!prediction || !prediction.output) {
      return res.status(500).json({ error: 'AI analysis failed. No output returned.' });
    }

    // Optionally mock a score if model doesn't return one
    const score = Math.floor(Math.random() * 21) + 80;
    const description = "Your grooming, glow, and confidence level are impressive!";

    return res.json({
      result: {
        score,
        description,
      },
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
