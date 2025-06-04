// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.post('/analyze', async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  // Sample fake scoring logic
  const score = Math.floor(Math.random() * 21) + 80; // 80–100
  const description = 'Massive glow-up! Skin, smile, and aura leveled up. ✨';

  return res.json({ result: { score, description } });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
