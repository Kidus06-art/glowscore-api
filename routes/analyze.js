const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/analyze', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Both image URLs are required.' });
    }

    const prompt = `
You are an AI trained to analyze before and after glow-up photos and return a total Glow Score out of 100, as well as a detailed breakdown in structured JSON format.

Compare the two images and evaluate the following visual categories:
- Skin Clarity
- Smile Confidence
- Hair Style Impact
- Style Upgrade (clothing/accessories)
- Overall Facial Expression & Presence

Give each of these categories a score out of 20 and then calculate a final score out of 100.

📌 Your response must be in strict JSON format, and look exactly like this:

{
  "glow_score": 87,
  "category_scores": {
    "skin_clarity": 18,
    "smile_confidence": 15,
    "hair_style_impact": 20,
    "style_upgrade": 17,
    "facial_expression_presence": 17
  },
  "feedback": "You’ve improved significantly across all categories. The hairstyle upgrade and confident expression really stand out. Great job!"
}

Only return the JSON. No explanation, no intro text.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 300,
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

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error('Parsing Error:', err);
      return res.status(500).json({ error: 'Invalid JSON from GPT. Try again.' });
    }

    return res.json({
      glow_score: data.glow_score,
      category_scores: data.category_scores,
      feedback: data.feedback
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error during analysis.' });
  }
});

module.exports = router;
