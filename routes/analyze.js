import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/analyze-outfit', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a professional fashion stylist.
Please evaluate this person's outfit and give each of the following 5 criteria a score out of 20:

- Style
- Coordination
- Confidence
- Uniqueness
- Presentation

After the scores, provide one short fashion recommendation to help them improve.

Return only this JSON format:
{
  "style": <number>,
  "coordination": <number>,
  "confidence": <number>,
  "uniqueness": <number>,
  "presentation": <number>,
  "recommendations": "<short tip>"
}`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const raw = completion.choices[0].message.content;
    console.log('GPT RAW OUTPUT:', raw); // 👀 Output to Render logs for debugging

    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    res.json({ result });
  } catch (err) {
    console.error('Analyze route error:', err);
    res.status(500).json({ error: 'Failed to analyze the outfit.' });
  }
});

export default router;
