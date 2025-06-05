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
You are an AI trained to analyze before and after glow-up photos and return a total Glow Score out of 100, along with a breakdown.

Compare the two images and evaluate these categories:
- Skin Clarity
- Smile Confidence
- Hair Style Impact
- Style Upgrade (clothing/accessories)
- Facial Expression & Presence

Respond ONLY in this strict JSON format:

{
  "glow_score": 85,
  "category_scores": {
    "skin_clarity": 18,
    "smile_confidence": 17,
    "hair_style_impact": 19,
    "style_upgrade": 16,
    "facial_expression_presence": 15
  },
  "feedback": "You're glowing! New hairstyle and smile really stand out."
}

Return no other text. Only raw JSON.
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

    const resultText = response.data.choices[0].message.content;

    // 🔍 Extract first valid JSON object using regex
    const match = resultText.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: 'No valid JSON found in GPT response.', raw: resultText });
    }

    const jsonString = match[0];
    const result = JSON.parse(jsonString);

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.', details: err.response?.data || err.message });
  }
});

module.exports = router;
