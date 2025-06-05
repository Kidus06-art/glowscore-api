const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ error: 'Missing image URLs' });
  }

  const prompt = `
You are an AI glow-up evaluator. Based on the two provided images (before and after), analyze the subject's visual transformation and return a JSON object with:

- Score (overall average) from 1 to 100 (be strict: 90+ means exceptional)
- Skin: score (1–100)
- Symmetry: score (1–100)
- Grooming: score (1–100)
- Aesthetic/Style: score (1–100)
- Confidence: score (1–100)
- Summary (1 sentence max)
- Suggestions (short recommendations for further improvement)

Respond **only** with raw JSON. No commentary or explanation. Example format:

{
  "score": 84,
  "skin": 80,
  "symmetry": 82,
  "grooming": 85,
  "aesthetic": 88,
  "confidence": 83,
  "summary": "A solid glow-up with improved grooming and presence.",
  "suggestions": "Try different lighting and experiment with bolder styling."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
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
      max_tokens: 800,
    });

    const rawResponse = completion.choices[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (jsonError) {
      console.error('Failed to parse JSON from AI response:', rawResponse);
      return res.status(500).json({ error: 'AI response is not in expected format' });
    }

    return res.json({ result });
  } catch (err) {
    console.error('GPT Vision error:', err);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
