const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Both image URLs are required.' });
    }

    const prompt = `
You are an AI trained to analyze visual differences between two photos.

Evaluate improvements in:
- Skin clarity
- Smile confidence
- Hair presentation
- Clothing style
- Expression/posture

Give a score (0-20) for each category. Respond ONLY with:
[skin_clarity, smile_confidence, hair, clothing, expression]
No labels or text, only the bracketed numbers.
`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: beforeUrl } },
              { type: 'image_url', image_url: { url: afterUrl } }
            ]
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    console.log("RAW GPT OUTPUT:", raw);

    const cleaned = raw.replace(/```/g, '').replace(/\n/g, '').trim();

    let scores;
    try {
      scores = JSON.parse(cleaned);
    } catch (err) {
      console.error('❌ Could not parse GPT output:', cleaned);
      return res.status(500).json({ error: 'Invalid GPT output.', raw: cleaned });
    }

    if (!Array.isArray(scores) || scores.length !== 5 || scores.some(n => typeof n !== 'number')) {
      return res.status(500).json({ error: 'Invalid score list.', raw: scores });
    }

    const total_score = Number(scores.reduce((sum, val) => sum + val, 0));
    console.log("✅ Total Score:", total_score);

    // ✅ Finally return only the score
    return res.json({ total_score });

  } catch (err) {
    console.error('🔥 Server Error:', err.stack || err.message);
    return res.status(500).json({ error: 'AI analysis failed.', details: err.message });
  }
});

module.exports = router;
