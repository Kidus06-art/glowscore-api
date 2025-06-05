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
You are a beauty and confidence AI evaluator. Compare the 'before' and 'after' photos and rate the glow-up based on the following 5 categories (1-100 scale):

1. Skin quality  
2. Facial symmetry  
3. Grooming (hair, facial hair, hygiene)  
4. Style and aesthetics  
5. Confidence and expression

Be strict — a score above 90 means exceptional transformation. Return a strict JSON object only with the following structure:

{
  "score": [overall average score],
  "skin": [score],
  "symmetry": [score],
  "grooming": [score],
  "aesthetic": [score],
  "confidence": [score],
  "summary": "[1-line summary]",
  "suggestions": "[short improvement suggestions]"
}

Reply with only valid JSON. No explanation. No formatting. Just the JSON.
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

    if (!content) {
      throw new Error('No response from GPT.');
    }

    // Extract only the JSON portion from the content
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON in response');
    }

    const jsonString = content.slice(jsonStart, jsonEnd + 1);

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      console.error('GPT response:', content);
      return res.status(500).json({ error: 'Invalid JSON from GPT. Try uploading clearer photos.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
