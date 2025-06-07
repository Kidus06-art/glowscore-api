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
You are an AI glow-up evaluator. Compare the two photos provided and return a JSON with scores from 1 to 100 for:

- skin
- symmetry
- grooming
- aesthetic
- confidence

Also provide:
- score: the average of those 5
- summary: short 1-line summary
- suggestions: short tips to improve

Be very strict. Only return the raw JSON in this format:
{
  "score": 83,
  "skin": 80,
  "symmetry": 85,
  "grooming": 90,
  "aesthetic": 78,
  "confidence": 82,
  "summary": "Great glow-up in grooming and symmetry.",
  "suggestions": "Consider improving lighting and posture."
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
        max_tokens: 700
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultText = response.data.choices[0].message.content;
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
