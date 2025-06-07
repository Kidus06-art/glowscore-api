const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();

const router = express.Router();

// ✅ Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

const db = admin.firestore();

// ✅ POST /analyze-outfit
router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const prompt = `
You are a fashion stylist. Rate the outfit in this image with scores out of 20 for:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Also, give one short fashion recommendation.

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
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const resultText = response.data.choices[0].message.content;
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    const jsonString = resultText.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const totalScore =
      parsed.style +
      parsed.coordination +
      parsed.confidence +
      parsed.uniqueness +
      parsed.presentation;

    const docRef = await db.collection('outfitRatings').add({
      imageUrl,
      ...parsed,
      totalScore,
      createdAt: new Date(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('Analyze outfit error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
