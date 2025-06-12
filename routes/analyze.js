const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('../firebase-admin'); // make sure this path is correct
const db = admin.firestore();

router.post('/analyze-outfit', async (req, res) => {
  console.log('🟢 /analyze-outfit endpoint called'); // Step 1: Confirm route is triggered

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      console.log('🔴 No imageUrl in request');
      return res.status(400).json({ error: 'Missing image URL' });
    }

    console.log('🖼️ Received imageUrl:', imageUrl);

    const prompt = `You are a professional fashion stylist with deep knowledge of modern Gen Z and Millennial fashion standards. Evaluate the outfit in the photo based on what's considered stylish or "drippy" in today's youth culture — including factors like good layering, color matching, fit, creativity, accessories, and confidence.

Score each of the following categories strictly from 0 to 20. Only give a total score above 90 if the outfit is truly exceptional and stands out by modern fashion standards.

Categories to score:
- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

Then give ONE short and practical fashion tip that could improve the outfit — it should be clear, insightful, and relevant (like "add a statement belt" or "experiment with layering").

Return ONLY a valid JSON like this. If anything goes wrong, return a default JSON with scores as 0 and a helpful tip:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendations": "<short and useful tip>"
}

Respond with nothing else — no explanations, no markdown, only raw JSON.`;


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
