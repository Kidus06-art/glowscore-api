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
You are a JSON-only API. Respond ONLY with JSON. No extra comments, no explanations.

The format must be:

{
  "score": [1-100],
  "skin": [1-100],
  "symmetry": [1-100],
  "grooming": [1-100],
  "aesthetic": [1-100],
  "confidence": [1-100],
}

DO NOT include markdown or text outside the JSON. If the faces in either image are not clear or not found, respond with:

{ "error": "Faces not detected. Please upload clearer before and after photos." }

Be strict. A score over 90 should only happen in amazing transformations.
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
      max_tokens: 500,
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = response.data.choices[0]?.message?.content || '';
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ error: 'No valid JSON in response' });
    }

    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);

    try {
      const result = JSON.parse(jsonString);
      res.json({ result });
    } catch (jsonErr) {
      console.error('JSON Parse error:', jsonErr);
      res.status(500).json({ error: 'AI response was not valid JSON.' });
    }
  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
