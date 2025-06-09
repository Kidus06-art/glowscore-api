const express = require('express');
const app = express();
const analyzeRoute = require('./routes/analyze');

app.use(express.json());
app.use('/api', analyzeRoute); // or just `app.use(analyzeRoute);`

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
