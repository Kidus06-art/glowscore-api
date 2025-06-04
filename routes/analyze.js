const express = require('express');
const router = express.Router();
const axios = require('axios');

require('dotenv').config(); // Make sure this is at the top if not already

router.post('/', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ error: 'Both before and after image URLs are required.' });
  }

  try {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'your-model-version-id-here', // Replace this with the actual model version ID
        input: {
          before: beforeUrl,
          after: afterUrl,
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const output = response.data;

    // ✅ Check if the model returned a valid score/result
    if (!output || !output.result || !output.result.score) {
      return res.status(400).json({
        error: 'Face not detected in one or both photos. Please try uploading clearer, front-facing pictures.',
      });
    }

    res.json({ result: output.result });

  } catch (err) {
    console.error('Error analyzing images:', err.message);
    res.status(500).json({ error: 'Something went wrong during analysis. Please try again later.' });
  }
});

module.exports = router;
