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
You are an AI glow-up evaluator. Analyze the before and after images provided and rate the subject from 1 to 100 in the following categories:
- Skin quality
- Facial symmetry
- Grooming (hair/facial hair)
- Style/aesthetic
- Confidence and expression

Be strict. A score above 90 should be rare. Return your response in this exact JSON format:

{
  "score": [overall score],
  "skin": [score],
  "symmetry": [score],
  "grooming": [score],
  "aesthetic": [score],
  "confidence": [score],
  "summary": "[1 sentence summary]",
  "suggestions": "[short improvement suggestions]"
}
Respond with only valid JSON.
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
        max_tokens: 600,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const resultText = response.data.choices[0].message.content;
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);

    try {
      const result = JSON.parse(jsonString);
      return res.json({ result });
    } catch (jsonErr) {
      console.error('JSON parsing failed:', jsonErr);
      return res.status(500).json({ error: 'AI response was not valid JSON.' });
    }

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;

