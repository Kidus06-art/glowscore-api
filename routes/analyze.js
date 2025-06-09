const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
const admin = require('../firebase-admin'); // make sure this path is correct

const db = admin.firestore();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const prompt = `
You are a fashion stylist. Based on this outfit image, evaluate the following attributes with a score out of 20:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Then provide one short fashion recommendation to improve their style.

Respond only in this JSON format:
{
  "style": number,
  "coordination": number,
  "confidence": number,
  "uniqueness": number,
  "presentation": number,
  "recommendations": "your short tip here"
}
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4-vision-preview',
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

    const raw = completion.data.choices[0].message.content;
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    // ✅ Logging what you need
    console.log('Image URL:', imageUrl);
    console.log('Parsed result:', result);

    const totalScore =
      result.style +
      result.coordination +
      result.confidence +
      result.uniqueness +
      result.presentation;

    await db.collection('outfitRatings').add({
      imageUrl,
      ...result,
      totalScore,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error in /analyze-outfit:', err);
    res.status(500).json({ error: 'AI analysis or Firestore write failed.' });
  }
});

module.exports = router;
