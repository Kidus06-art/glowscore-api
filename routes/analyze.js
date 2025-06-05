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

Evaluate these 5 categories (each scored out of 20):
1. Skin Clarity
2. Smile Confidence
3. Hair Style Impact
4. Style Upgrade
5. Facial Expression & Presence

Respond ONLY with the five scores in this exact order, inside square brackets:

[skin_clarity, smile_confidence, hair_style_impact, style_upgrade, facial_expression_presence]

Do not include any explanation, label, or formatting. Only return the bracketed numbers.
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

    const resultText = response.data.choices[0].message.content.trim();
    console.log('RAW GPT OUTPUT:', resultText);

    const cleanedText = resultText
      .replace(/```/g, '') // remove backticks if GPT adds them
      .replace(/\n/g, '')  // remove line breaks
      .trim();

    let scores;
    try {
      scores = JSON.parse(cleanedText);
    } catch (err) {
      console.error('❌ JSON parsing failed:', cleanedText);
      return res.status(500).json({
        error: 'Failed to parse GPT output.',
        raw: cleanedText
      });
    }

    if (!Array.isArray(scores) || scores.length !== 5 || scores.some(n => typeof n !== 'number')) {
      return res.status(500).json({ error: 'Invalid score format.', raw: scores });
    }

    const total_score = scores.reduce((sum, val) => sum + val, 0);

    // ✅ Debug logs
    console.log("✅ PARSED SCORES:", scores);
    console.log("✅ TOTAL SCORE:", total_score);

    res.json({
      total_score,
      skin_clarity: scores[0],
      smile_confidence: scores[1],
      hair_style_impact: scores[2],
      style_upgrade: scores[3],
      facial_expression_presence: scores[4]
    });

  } catch (err) {
    console.error('🔥 GPT Vision error (outer catch):', err.stack || err.response?.data || err.message);
    res.status(500).json({
      error: 'AI analysis failed.',
      details: err.stack || err.response?.data || err.message
    });
  }
});

module.exports = router;
