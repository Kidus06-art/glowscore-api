const express = require('express');
const router = express.Router();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

router.post('/', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ message: 'Missing image URLs' });
  }

  try {
    const prediction = await replicate.run(
      "cjwbw/face-compare:5b3e0b9ceecba92729515a9d05c81089bcaee775cfc424f83fcb8f96a5eeb98e",
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl,
        },
      }
    );

    // Check if prediction has the output and similarity_score
    if (!prediction || typeof prediction.similarity_score !== 'number') {
      return res.status(422).json({
        message: 'No face detected in one or both photos. Try uploading clearer photos.',
      });
    }

    const similarity = prediction.similarity_score;
    const score = Math.round((1 - similarity) * 100); // Higher difference = higher glow-up
    const description =
      score > 80
        ? "Incredible transformation! You're unrecognizable!"
        : score > 50
        ? 'Great glow-up, keep shining!'
        : 'Subtle changes — still looking good!';

    return res.json({
      result: {
        score,
        description,
      },
    });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({
      message: 'Something went wrong during analysis. Please try again.',
    });
  }
});

module.exports = router;
