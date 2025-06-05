const express = require('express');
const router = express.Router();
const axios = require('axios');
const jsonic = require('jsonic'); // forgiving JSON parser
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Both image URLs are required.' });
    }

    const prompt = `
You are an AI that analyzes before and after glow-up photos and returns a glow score and detailed breakdown in the form of a single flat array.

Evaluate these 5 categories (each out of 20):
1. Skin Clarity
2. Smile Confidence
3. Hair Style Impact
4. Style Upgrade (clothing/accessories)
5. Facial Expression & Presence

Then return the total glow_score (sum out of 100) as the first item in the array.

Respond ONLY in this exact JSON format (no explanation, no markdown):

{
  "scores": [85, 18, 17, 19, 16, 15],
  "feedback": "You're glowing! New hairstyle and smile really stand out."
}
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const rawText = response.data.choices[0].message.content;

    let result;
    try {
      result = jsonic(rawText); // safely parse even if there's extra stuff
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to parse GPT output.',
        raw: rawText
      });
    }

    // Optionally decode the score breakdown for clarity
    const decoded = {
      glow_score: result.scores[0],
      skin_clarity: result.scores[1],
      smile_confidence: result.scores[2],
      hair_style_impact: result.scores[3],
      style_upgrade: result.scores[4],
      facial_expression_presence: result.scores[5],
      feedback: result.feedback
    };

    res.json({ result: decoded });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.', details: err.response?.data || err.message });
  }
});

module.exports = router;

