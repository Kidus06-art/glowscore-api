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
You are an AI that analyzes before and after glow-up photos and returns a glow score and category breakdown.

Evaluate these 5 categories (each scored 0–20):
1. Skin Clarity
2. Smile Confidence
3. Hair Style Impact
4. Style Upgrade
5. Facial Expression & Presence

Add up the category scores to produce a total glow score out of 100.

Respond ONLY with this flat JSON format:

{
  "scores": [85, 18, 17, 19, 16, 15],
  "feedback": "You're glowing! New hairstyle and smile really stand out."
}

No explanation, no formatting — just raw JSON.
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
        max_tokens: 400
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawText = response.data.choices[0].message.content;

    // Extract JSON object from GPT output
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({
        error: 'No valid JSON found in GPT response.',
        raw: rawText
      });
    }

    let result;
    try {
      result = JSON.parse(match[0]);
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to parse JSON from GPT response.',
        raw: rawText
      });
    }

    // Optional: unpack scores for easy use
    const [glow_score, skin, smile, hair, style, expression] = result.scores;

    res.json({
      result: {
        glow_score,
        skin_clarity: skin,
        smile_confidence: smile,
        hair_style_impact: hair,
        style_upgrade: style,
        facial_expression_presence: expression,
        feedback: result.feedback
      }
    });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.', details: err.response?.data || err.message });
  }
});

module.exports = router;
