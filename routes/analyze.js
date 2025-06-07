const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    const prompt = `
You are a fashion analysis AI.

Your job is to:
1. Rate the following five categories on a scale of 1 to 20:
   - Color coordination
   - Fit and silhouette
   - Style consistency (do all pieces work well together?)
   - Creativity and boldness
   - Appropriateness for a modern, casual setting

2. Then, give 1 paragraph of personalized fashion recommendations based on the photo.

Return ONLY a clean JSON response like this (no extra commentary or markdown):

{
  "color_coordination": 18,
  "fit_silhouette": 17,
  "style_consistency": 19,
  "creativity_boldness": 16,
  "modern_appropriateness": 18,
  "recommendations": "You could improve your look by choosing colors that contrast slightly more and swapping the shoes for something trendier. Consider accessories like a watch or bracelet to complete the outfit."
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
        max_tokens: 400
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

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI outfit analysis failed.' });
  }
});

module.exports = router;
