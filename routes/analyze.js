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
Analyze the before and after glow-up photos.

Evaluate these 5 categories (each out of 20):
1. Skin Clarity  
2. Smile Confidence  
3. Hair Style Impact  
4. Style Upgrade  
5. Facial Expression & Presence

Respond ONLY with the five scores in this order, inside square brackets:

[skin_clarity, smile_confidence, hair_style_impact, style_upgrade, facial_expression_presence]

Do not add any text or explanation — only return the five numbers in brackets.
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
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = response.data.choices[0].message.content.trim();

    let scores;
    try {
      scores = JSON.parse(resultText);
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to parse scores.',
        raw: resultText
      });
    }

    if (!Array.isArray(scores) || scores.length !== 5 || scores.some(n => typeof n !== 'number')) {
      return res.status(500).json({ error: 'Invalid score format', raw: scores });
    }

    const total_score = scores.reduce((sum, val) => sum + val, 0);

    res.json({
      total_score,
      skin_clarity: scores[0],
      smile_confidence: scores[1],
      hair_style_impact: scores[2],
      style_upgrade: scores[3],
      facial_expression_presence: scores[4]
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
