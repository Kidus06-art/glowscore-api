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
You are an AI that analyzes glow-ups using two images: before and after.

Evaluate the following categories (each out of 20):
1. Skin Clarity
2. Smile Confidence
3. Hair Style Impact
4. Style Upgrade
5. Facial Expression & Presence

Add these up for a total glow score out of 100 (first value).

Return ONLY the list of 6 numbers, in this order:
[total_glow_score, skin_clarity, smile_confidence, hair_style_impact, style_upgrade, facial_expression_presence]

No text, no keys, no explanation. Only the array.
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
              { type: 'image_url', image_url: { url: afterUrl } }
            ]
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Now GPT should respond with a raw list: [85, 18, 17, 19,]()
