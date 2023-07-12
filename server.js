const express = require('express');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

router.get('/aboutus', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'aboutus.html'));
});

app.use('/.netlify/functions/server', router);
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
module.exports.handler = serverless(app);