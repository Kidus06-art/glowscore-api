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
            { type: 'text', text: `Rate this outfit based on these categories: 
- Style (out of 20) 
- Coordination (out of 20) 
- Confidence (out of 20) 
- Uniqueness (out of 20) 
- Presentation (out of 20)

Then give one short paragraph of recommendations to improve fashion sense. Return only JSON in this format:
{
  "style": 18,
  "coordination": 17,
  "confidence": 19,
  "uniqueness": 15,
  "presentation": 16,
  "recommendations": "Consider wearing accessories or layering to enhance visual interest."
}` },
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

    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonString = raw.slice(jsonStart, jsonEnd + 1);
    const result = JSON.parse(jsonString);

    res.json({ result });
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).json({ error: 'Analysis failed. Please try again later.' });
  }
});

export default router;
