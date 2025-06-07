import express from 'express';
import OpenAI from 'openai';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Firebase Admin SDK (only once in your app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    // Prompt for GPT
    const prompt = `
You are a fashion expert.
Evaluate this outfit across the following criteria, each scored out of 20:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Also provide one short recommendation for improving their fashion.

Return ONLY valid JSON like this:
{
  "style": 16,
  "coordination": 18,
  "confidence": 17,
  "uniqueness": 15,
  "presentation": 18,
  "recommendation": "Try layering with a bold accessory."
}
    `;

    const response = await openai.chat.completions.create({
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
    });

    const raw = response.choices[0].message.content;
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

    const outfitDoc = {
      imageUrl,
      ...result,
      totalScore,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('outfitRatings').add(outfitDoc);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Analyze outfit error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to analyze and store outfit rating.' });
  }
});

export default router;
