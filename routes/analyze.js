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
Analyze the two images (before and after) and evaluate the following five categories. Each should be scored out of 20:

1. Skin Clarity  
2. Smile Confidence  
3. Hair Style Impact  
4. Style Upgrade  
5. Facial Expression & Presence

Add the five category scores to calculate the total glow-up score (out of 100). This should be the **first number**.

Output exactly six numbers inside square brackets. The order must be:

[total_score, skin_clarity, smile_confidence, hair_style_impact, style_upgrade, facial_expression_presence]

Output nothing else — no text, no explanation, no labels.

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
    const scoreList = JSON.parse(resultText);

    res.json({ glow_score: scoreList[0] });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
