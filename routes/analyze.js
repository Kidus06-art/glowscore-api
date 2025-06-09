const express = require('express');
const axios = require('axios');
const { db } = require('../firebase-admin'); // Make sure this path is correct
require('dotenv').config();

const router = express.Router();

router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const prompt = `
You are a fashion stylist AI.
Evaluate the person’s outfit in the image using the following criteria. Give each one a score from 0 to 20:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Then give ONE short recommendation (1 sentence max) to help improve.

Return ONLY in this format:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendation": "<tip>"
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
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultText = response.data.choices[0].message.content;

    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    const totalScore =
      result.style +
      result.coordination +
      result.confidence +
      result.uniqueness +
      result.presentation;

    console.log('✅ Image URL:', imageUrl);
    console.log('✅ Parsed result:', result);
    console.log('✅ Total Score:', totalScore);

    await db.collection('outfitRatings').add({
      imageUrl,
      ...result,
      totalScore,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error analyzing outfit:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to analyze and store outfit.' });
  }
});

module.exports = router;
