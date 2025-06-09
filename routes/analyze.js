const express = require('express');
const axios = require('axios');
const { db } = require('../firebase-admin'); // make sure this file exists and is correctly exporting Firestore
require('dotenv').config();

const router = express.Router();

router.post('/analyze-outfit', async (req, res) => {
  console.log('📩 Received analyze-outfit request');

  try {
    const { imageUrl } = req.body;
    console.log('🖼️ imageUrl from frontend:', imageUrl);

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const prompt = `
You are a professional fashion stylist.
Please evaluate this person's outfit and give each of the following 5 criteria a score out of 20:

- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

After the scores, provide one short fashion recommendation to help them improve.

Return only this JSON format:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendations": "<short tip>"
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
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log('📤 OpenAI raw response:', raw);

    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    const totalScore =
      result.style +
      result.coordination +
      result.confidence +
      result.uniqueness +
      result.presentation;

    console.log('📥 Parsed scores:', result);
    console.log('📊 Total score:', totalScore);

    await db.collection('outfitRatings').add({
      imageUrl,
      ...result,
      totalScore,
      timestamp: new Date()
    });

    console.log('✅ Successfully saved to Firebase');
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Analyze route error:', err.message);
    res.status(500).json({ error: 'Failed to analyze and store the outfit rating.' });
  }
});

module.exports = router;
