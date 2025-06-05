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
You are an AI trained to analyze visual differences between two photos.

Look at both images and evaluate any **visual improvement** in the following 5 categories:
1. Skin clarity (more even, less blemished)
2. Smile confidence (more expressive or visible)
3. Hair presentation (more styled or neat)
4. Clothing coordination or style upgrade
5. Posture or expression (more open, energetic)

Give a score out of 20 for each category based on visible improvement (not beauty or judgment).

Respond ONLY with a list of 5 numbers in this order:
[skin_clarity, smile_confidence, hair_presentation, clothing_upgrade, posture_expression]

Return only the bracketed numbers. No text, no explanation.
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const resultText = response.data.choices[0].message.content.trim();
    console.log('RAW GPT OUTPUT:', resultText);

    const cleanedText = resultText
      .replace(/```/g, '')
      .replace(/\n/g, '')
      .trim();

    let scores;
    try {
      scores = JSON.parse(cleanedText);
    } catch (err) {
      console.error('❌ JSON parsing failed:', cleanedText);
      return res.status(500).json({
        error: 'Failed to parse GPT output.',
        raw: cleanedText
      });
    }

    if (!Array.isArray(scores) || scores.length !== 5 || scores.some(n => typeof n !== 'number')) {
      return res.status(500).json({ error: 'Invalid score format.', raw: scores });
    }

    const total_score = scores.reduce((sum, val) => sum + val, 0);

    console.log('✅ Scores:', scores);
    console.log('✅ Total Score:', total_score);

    return res.json({
      total_score,
      skin_clarity: scores[0],
      smile_confidence: scores[1],
      hair_presentation: scores[2],
      clothing_upgrade: scores[3],
      posture_expression: scores[4]
    });

  } catch (err) {
    console.error('🔥 Error:', err.stack || err.response?.data || err.message);
    return res.status(500).json({
      error: 'AI analysis failed.',
      details: err.stack || err.response?.data || err.message
    });
  }
});

module.exports = router;
