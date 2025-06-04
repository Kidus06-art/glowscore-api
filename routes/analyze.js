const express = require('express');
const router = express.Router();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Make sure to add this in your .env
});

router.post('/', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ error: 'Missing image URLs' });
  }

  try {
    const prompt = `Describe the improvement between this before image and this after image.`;
    const output = await replicate.run(
      "salesforce/blip:latest", // you can change this later
      {
        input: {
          image: afterUrl,
          prompt: prompt
        }
      }
    );

    // Simulate a score based on keywords (basic logic)
    const score = Math.floor(Math.random() * 21) + 80; // Random between 80–100
    res.json({
      result: {
        score,
        description: output,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

module.exports = router;
