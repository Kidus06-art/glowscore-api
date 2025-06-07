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
You are a beauty and confidence evaluator AI. Compare the two photos (before and after) of the same person and provide detailed scores (from 1 to 100) for the following:

1. Skin
2. Symmetry
3. Grooming
4. Aesthetic (style and vibe)
5. Confidence (expression and presence)

Respond strictly using the following JSON format:

{
  "skin": [number],
  "symmetry": [number],
  "grooming": [number],
  "aesthetic": [number],
  "confidence": [number],
  "summary": "[One-sentence analysis]",
  "suggestions": "[Optional improvement tips]"
}

Be critical and don't give high scores easily. A score above 90 should be rare and reflect exceptional improvement. Respond in raw JSON format only.
    `;

    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
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
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = gptResponse.data.choices[0].message.content;

    // Extract JSON from raw GPT response
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
