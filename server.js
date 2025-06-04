const express = require('express');
const cors = require('cors');
const analyzeRoute = require('./routes/analyze');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/analyze', analyzeRoute);

app.get('/', (req, res) => {
  res.send('GlowScore API is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
