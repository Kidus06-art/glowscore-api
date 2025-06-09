const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('../firebase-admin'); // make sure this path is correct
const db = admin.firestore();

router.post('/analyze', async (req, res) => {
  console.log('🟢 /analyze-outfit endpoint called'); // Step 1: Confirm route is triggered

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      console.log('🔴 No imageUrl in request');
      return res.status(400).json({ error: 'Missing image URL' });
    }

    console.log('🖼️ Received imageUrl:', imageUrl);

    const prompt = `
You are a professional fashion stylist.
Please evaluate this person's outfit and give each of the following 5 criteria a score out of 20:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Then provide one short fashion recommendation.

Return only this JSON:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendations": "<short tip>"
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
      max_tokens: 300
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

    console.log('🤖 AI Response Parsed:', result); // Step 1 continued

    const entry = {
      imageUrl,
      ...result,
      totalScore: result.style + result.coordination + result.confidence + result.uniqueness + result.presentation,
      createdAt: new Date()
    };

    await db.collection('outfits').add(entry);
    console.log('✅ Saved to Firestore:', entry); // will check this in Step 2

    res.json({ success: true, entry });
  } catch (err) {
    console.error('❌ Error in /analyze-outfit:', err.message || err);
    res.status(500).json({ error: 'Failed to analyze outfit' });
  }
});

module.exports = router;
