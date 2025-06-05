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
      You're a glow-up analysis assistant. Evaluate the difference between the "before" and "after" images.
      1. Give a total GlowScore out of 100.
      2. Comment on improvements in:
         - Skin clarity
         - Facial symmetry
         - Grooming
         - Overall aesthetic
         - Confidence / energy
      3. Format your reply strictly as JSON like this:
      {
        "score": 94,
        "skin": "Clearer and smoother skin tone",
        "symmetry": "Slightly improved facial symmetry",
        "grooming": "Better hairstyle and neat facial hair",
        "aesthetic": "More stylish appearance and confident vibe",
        "confidence": "More engaging expression",
        "summary": "Great glow-up overall, especially in grooming and energy."
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
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

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
