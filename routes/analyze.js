const express = require('express');
const router = express.Router();
const Replicate = require('replicate');

// Initialize Replicate with API key from environment variable
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
      'jagilley/face-diffusion:db21e40f30d56f01aefcd1fc34a71b62b23987443d858a08b7c3b7024240df16',
      {
        input: {
          image1: beforeUrl,
          image2: afterUrl,
        },
      }
    );

    // Output contains image and maybe some text
    if (!output || !output.length || !output[0]) {
      return res.status(422).json({
        error: 'Analysis failed. Please try uploading clearer before and after photos.',
      });
    }

    // Mock scoring logic — Replace with your actual scoring algorithm if needed
    const score = Math.floor(Math.random() * 21) + 80; // 80 to 100
    const description = 'Nice glow-up! Better skin tone, sharper features, and improved expression.';

    return res.json({
      result: {
        score,
        description,
        outputImage: output[0],
      },
    });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({
      error: 'Server error during analysis. Please try again later.',
    });
  }
});

module.exports = router;
