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
    const output = await replicate.run(
      "your-model-here", // update with your actual model
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl,
        },
      }
    );

    console.log("Replicate Output:", output);

    if (!output || typeof output !== 'object') {
      return res.status(500).json({ error: 'Invalid response from AI' });
    }

    if (output.error || !output.score) {
      return res.status(400).json({ error: 'AI failed to process the images. Possibly no face detected.' });
    }

    return res.json({
      result: {
        score: output.score,
        description: output.description || "Glow-up detected!",
      }
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: 'Server error during analysis' });
  }
});

module.exports = router;
