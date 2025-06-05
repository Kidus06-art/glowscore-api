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
You are an AI trained to analyze before and after glow-up photos and return a total Glow Score out of 100, as well as a detailed breakdown in structured JSON format.

Compare the two images and evaluate the following visual categories:
- Skin Clarity
- Smile Confidence
- Hair Style Impact
- Style Upgrade (clothing/accessories)
- Facial Expression & Presence

Respond in **valid JSON only**, no intro or explanation. Here's the required format:

{
  "glow_score": 87,
  "category_scores": {
    "skin_clarity": 18,
    "smile_confidence": 15,
    "hair_style_impact": 20,
    "style_upgrade": 17,
    "facial_expression_presence": 17
  },
  "feedback": "Great job! The hairstyle and confidence boost are impressive."
}
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
        max_tokens: 400,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultText = response.data.choices[0].message.content;

    // Extract JSON safely using regex
    const match = resultText.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: 'No valid JSON found in GPT response.' });
    }

    const jsonString = match[0];
    const result = JSON.parse(jsonString);

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
