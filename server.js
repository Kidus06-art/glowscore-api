const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const glowRoute = require('./server'); // or replace with your route filename

app.use(bodyParser.json());
app.use('/api', glowRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
