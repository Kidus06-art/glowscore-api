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
You are a beauty and confidence evaluator AI. You will be given two images of the same person: a before and an after photo.

Your task is to evaluate how much the person's appearance improved in the following five categories. For each, assign a score between 1 and 100:

1. Skin quality
2. Facial symmetry
3. Grooming (hairstyle, facial hair, cleanliness)
4. Aesthetic (style, vibe, fashion)
5. Confidence and expression

Then, summarize the overall glow-up in one sentence, and suggest one or two areas the user can still improve.

⚠️ Very important: 
👉 **Your entire response must be a valid JSON object.**
👉 **Do not include any extra explanation.**
👉 **Do not wrap the JSON in triple backticks or markdown.**
👉 Be strict. A score above 90 should be rare and exceptional.

Use this format exactly:

{
  "skin": [number],
  "symmetry": [number],
  "grooming": [number],
  "aesthetic": [number],
  "confidence": [number],
  "summary": "Your summary here.",
  "suggestions": "Your improvement suggestions here."
}
`;

    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: 600,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = gptResponse.data.choices[0].message.content;

    // Try to extract a JSON object from the response text using RegEx
    const match = resultText.match(/{[\s\S]*}/);
    if (!match) {
      throw new Error('No valid JSON in response');
    }

    const jsonString = match[0];
    const result = JSON.parse(jsonString);

    res.json({ result });

  } catch (err) {
    console.error('GPT Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
