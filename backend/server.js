const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

let requestCount = 0;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/message', (req, res) => {
  requestCount += 1;
  res.json({
    message: 'Hello from the backend',
    timestamp: new Date().toISOString(),
    requestCount
  });
});

// Reads a Docker secret mounted as a file, not an env var
app.get('/api/secret', (req, res) => {
  const secretPath = '/run/secrets/app_secret';
  try {
    const secretValue = fs.readFileSync(secretPath, 'utf8').trim();
    res.json({ secretPreview: secretValue });
  } catch (err) {
    console.error('Secret read error:', err.message); // TEMP: reveals real cause
    res.status(500).json({ error: 'Secret not found or unreadable' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});