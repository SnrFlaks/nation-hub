const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/aboutus', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'aboutus.html'));
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(5500, '127.0.0.1', () => {
    console.log('Server running on http://127.0.0.1:5500');
});