const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

router.post('/', async (req, res) => {
  try {
    const { beforeUrl, afterUrl } = req.body;

    if (!beforeUrl || !afterUrl) {
      return res.status(400).json({ error: 'Both image URLs are required.' });
    }

    const prompt = `
You are a beauty and confidence evaluator. Compare the "before" and "after" images. Strictly rate the glow-up on these 5 categories (1-100 scale):

1. Skin quality  
2. Facial symmetry  
3. Grooming  
4. Style and aesthetics  
5. Confidence and expression

Only return this raw JSON:

{
  "score": [overall average score],
  "skin": [score],
  "symmetry": [score],
  "grooming": [score],
  "aesthetic": [score],
  "confidence": [score],
  "summary": "[1-line summary]",
  "suggestions": "[short tips to improve]"
}

Do not explain. Do not wrap it in \`\`\`. Return just the JSON. Be concise.
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
              { type: 'image_url', image_url: { url: beforeUrl } },
              { type: 'image_url', image_url: { url: afterUrl } },
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

    const content = response.data.choices[0]?.message?.content;

    if (!content) throw new Error('No response from GPT.');

    // 🔍 Clean up markdown like ```json
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // ✅ Try parsing cleaned content
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse JSON:', cleaned);
      return res.status(500).json({ error: 'Invalid JSON from GPT. Try clearer images.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;

