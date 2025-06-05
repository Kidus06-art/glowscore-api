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
You are an AI glow-up evaluator. Based on two photos (before and after), evaluate the glow-up and return:

1. Scores for the following 5 categories (each out of 20):
- skin_clarity
- smile_confidence
- hair_style_impact
- style_upgrade
- facial_expression_presence

2. A one-sentence motivational feedback message based on the overall glow-up.

3. A section called "recommendations" containing 2–3 personalized improvement tips based on the lowest scoring areas. Keep the tips short and practical.

⚠️ Format your response exactly like this:
{
  "skin_clarity": 18,
  "smile_confidence": 17,
  "hair_style_impact": 19,
  "style_upgrade": 16,
  "facial_expression_presence": 15,
  "feedback": "You're glowing! New hairstyle and smile really stand out.",
  "recommendations": [
    "Try a skincare routine with exfoliation twice a week.",
    "Whiten your teeth slightly for a brighter smile."
  ]
}

❌ Do not add any extra text, explanation, or formatting. Return ONLY the structured object.
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

    const resultText = response.data.choices[0].message.content.trim();

    let data;
    try {
      data = JSON.parse(resultText);
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to parse GPT output.',
        raw: resultText
      });
    }

    const total_score =
      data.skin_clarity +
      data.smile_confidence +
      data.hair_style_impact +
      data.style_upgrade +
      data.facial_expression_presence;

    res.json({
      total_score,
      ...data
    });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'AI analysis failed.',
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
