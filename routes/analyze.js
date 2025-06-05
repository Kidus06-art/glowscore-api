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
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultText = response.data.choices[0].message.content.trim();
    console.log("RAW GPT OUTPUT:", resultText);

    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (err) {
      console.error('❌ JSON.parse failed:', err.message);
      return res.status(500).json({
        error: 'Failed to parse GPT response.',
        raw: resultText
      });
    }

    // Double check that all required fields are present
    const requiredKeys = [
      'skin_clarity',
      'smile_confidence',
      'hair_style_impact',
      'style_upgrade',
      'facial_expression_presence'
    ];

    for (const key of requiredKeys) {
      if (typeof data[key] !== 'number') {
        console.error(`❌ Missing or invalid score: ${key}`);
        return res.status(500).json({ error: `Invalid or missing value for "${key}".`, raw: data });
      }
    }

    const total_score =
      Number(data.skin_clarity) +
      Number(data.smile_confidence) +
      Number(data.hair_style_impact) +
      Number(data.style_upgrade) +
      Number(data.facial_expression_presence);

    console.log('✅ Total Score:', total_score);

    res.json({
      total_score,
      ...data
    });

  } catch (err) {
    console.error('GPT Vision error (outer catch):', err.response?.data || err.message);
    res.status(500).json({
      error: 'AI analysis failed.',
      details: err.response?.data || err.message
    });
  }
});

module.exports = router;
