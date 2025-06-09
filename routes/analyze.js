const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const admin = require('firebase-admin');

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

// ✅ Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    const prompt = `
You are a professional fashion stylist AI. Based on the image URL provided, generate a JSON object that includes:

{
  "skin_clarity": [0-20],
  "smile_confidence": [0-20],
  "hair_presentation": [0-20],
  "clothing_upgrade": [0-20],
  "posture_expression": [0-20],
  "recommendations": "Include specific advice for improvement based on the scores."
}

Only return valid JSON. Here is the image URL: ${imageUrl}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('💬 AI Raw Response:', aiResponse);

    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (err) {
      console.error('❌ JSON Parse Error:', err.message);
      return res.status(500).json({ error: 'AI response was not valid JSON.' });
    }

    const entry = {
      imageUrl,
      timestamp: new Date().toISOString(),
      result,
    };

    await db.collection('outfits').add(entry);

    console.log('✅ Firestore Entry Saved:', entry);
    res.json({ success: true, result });

  } catch (err) {
    console.error('❌ General Error:', err.message);
    res.status(500).json({ error: 'Server error while analyzing outfit.' });
  }
});

module.exports = router;
