const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../firebase-admin'); // make sure this file exports the Firestore instance
require('dotenv').config();

router.post('/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const prompt = `
You are a fashion stylist AI.
Evaluate this outfit image based on the following criteria, giving each one a score out of 20:

1. Style
2. Coordination
3. Confidence
4. Uniqueness
5. Presentation

After scoring, provide ONE short fashion recommendation. Respond ONLY in this JSON format:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendation": "<short text>"
}
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
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

    const raw = response.data.choices[0].message.content;
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    const totalScore = result.style + result.coordination + result.confidence + result.uniqueness + result.presentation;

    await db.collection('outfits').add({
      imageUrl,
      ...result,
      totalScore,
      timestamp: new Date()
    });

    res.json({ success: true });

  } catch (err) {
    console.error('Analyze error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to analyze or store data.' });
  }
});

module.exports = router;
