const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'DeployForge',
    runtime: 'Node.js ' + process.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    message: 'Hello from DeployForge Node.js microservice!',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Node app listening on port ${PORT}`);
});
