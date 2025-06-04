const express = require('express');
const router = express.Router();
const Replicate = require('replicate');

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
      "jagilley/face-compare:18e0b3dc2de2d2603e94bb6d3c1fbd2a8f96216ac063d9987688d9cbfe6e3aea",
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl
        }
      }
    );

    // Validate that we got a proper response
    if (!prediction || !prediction.score) {
      console.log('Prediction result:', prediction);
      return res.status(422).json({ error: 'Face not detected clearly in one or both images.' });
    }

    // Send back result
    return res.json({
      result: {
        score: Math.round(prediction.score * 100),
        description: prediction.description || "Glow-up analyzed!"
      }
    });

  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
