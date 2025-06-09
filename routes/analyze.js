const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// ✅ Step 1: Parse the full JSON string from Render environment variable
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// ✅ Step 2: Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Step 3: Initialize Firestore
const db = admin.firestore();

// ✅ Step 4: Main route
router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    console.log('Received image URL:', imageUrl);

    // ✅ Replace this with your actual AI response if using OpenAI or Replicate
    const result = {
      skin_clarity: Math.floor(Math.random() * 21),
      smile_confidence: Math.floor(Math.random() * 21),
      hair_presentation: Math.floor(Math.random() * 21),
      clothing_upgrade: Math.floor(Math.random() * 21),
      posture_expression: Math.floor(Math.random() * 21),
    };

    const totalScore = Object.values(result).reduce((sum, val) => sum + val, 0);

    console.log('AI result:', result);
    console.log('Total score:', totalScore);

    // ✅ Step 5: Save to Firestore
    const docRef = await db.collection('outfitRatings').add({
      imageUrl,
      ...result,
      totalScore,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Saved to Firestore with ID:', docRef.id);

    // ✅ Step 6: Return result to frontend
    res.status(200).json({
      result: {
        ...result,
        score: totalScore,
        description: 'Your outfit was successfully analyzed and saved!',
      },
    });
  } catch (err) {
    console.error('Error analyzing outfit:', err);
    res.status(500).json({ error: 'Failed to analyze outfit.' });
  }
});

module.exports = router;
