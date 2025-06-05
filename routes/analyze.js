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
You are an AI trained to evaluate visual improvement between two photos.

Evaluate these 5 visual aspects (without judging people):
- skin_clarity
- smile_confidence
- hair_presentation
- clothing_upgrade
- posture_expression

Give each a score from 0 to 20 based on visible change between the two photos.

Respond ONLY in this JSON format (no text, no labels, no explanation):

{
  "skin_clarity": 18,
  "smile_confidence": 19,
  "hair_presentation": 20,
  "clothing_upgrade": 19,
  "posture_expression": 20
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
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = response.data.choices[0].message.content.trim();
    console.log('RAW GPT OUTPUT:', resultText);

    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (err) {
      console.error('❌ JSON parsing failed:', jsonString);
      return res.status(500).json({ error: 'Failed to parse GPT output.', raw: jsonString });
    }

    const total_score =
      Number(result.skin_clarity) +
      Number(result.smile_confidence) +
      Number(result.hair_presentation) +
      Number(result.clothing_upgrade) +
      Number(result.posture_expression);

    console.log('✅ Total Score:', total_score);

    res.json({ total_score });

  } catch (err) {
    console.error('🔥 Server Error:', err.stack || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
