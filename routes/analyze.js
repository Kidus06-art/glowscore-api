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
You are an AI beauty and confidence evaluator. Based on the two photos provided (before and after), analyze the subject's visual glow-up and provide scores from 1 to 100 for the following five categories:

1. Skin quality
2. Facial symmetry
3. Grooming (hairstyle, facial hair, cleanliness)
4. Style and aesthetics
5. Confidence and expression

Be strict with scoring — a score above 90 should reflect an exceptional glow-up. Use the following response format:

{
  "score": [overall average score],
  "skin": [score],
  "symmetry": [score],
  "grooming": [score],
  "aesthetic": [score],
  "confidence": [score],
  "summary": "[1 sentence summary]",
  "suggestions": "[short improvement suggestions if any]"
}

Respond only in raw JSON format.
    `.trim();

    const apiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: beforeUrl } },
              { type: 'image_url', image_url: { url: afterUrl } }
            ]
          }
        ],
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = apiResponse.data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid JSON format from AI response');
    }

    const jsonString = content.slice(jsonStart, jsonEnd + 1);

    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('Error parsing JSON from AI:', parseErr);
      console.error('Raw content:', content);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;

