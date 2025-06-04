const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const analyzeRoute = require('./routes/analyze');

dotenv.config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 👇 Route for AI analysis
app.use('/analyze', analyzeRoute);

// Optional: Basic home route
app.get('/', (req, res) => {
  res.send('GlowScore API is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
