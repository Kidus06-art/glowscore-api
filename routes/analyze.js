const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/analyze', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Both image URLs are required.' });
    }

    const prompt = `
You are an AI trained to analyze before and after glow-up photos and return a total Glow Score out of 100, as well as a detailed breakdown in structured JSON format.

Compare the two images and evaluate the following:
- Skin Clarity
- Smile Confidence
- Hair Style Impact
- Style Upgrade (clothing/accessories)
- Facial Expression & Presence

Respond in **valid JSON only**, no intro or explanation. Here's the required format:

{
  "glow_score": 87,
  "category_scores": {
    "skin_clarity": 18,
    "smile_confidence": 15,
    "hair_style_impact": 20,
    "style_upgrade": 17,
    "facial_expression_presence": 17
  },
  "feedback": "Great job! The hairstyle and confidence boost are impressive."
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 400,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: beforeUrl } },
            { type: 'image_url', image_url: { url: afterUrl } }
          ],
        },
      ],
    });

    const raw = response.choices[0].message.content;

    // Extract JSON using regex (between first { and last })
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: 'No valid JSON found in GPT response.' });
    }

    let data;
    try {
      data = JSON.parse(match[0]);
    } catch (err) {
      console.error('JSON Parse Error:', err);
      return res.status(500).json({ error: 'Malformed JSON. Try again.' });
    }

    return res.json({
      glow_score: data.glow_score,
      category_scores: data.category_scores,
      feedback: data.feedback,
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error during glow-up analysis.' });
  }
});

module.exports = router;
