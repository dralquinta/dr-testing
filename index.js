const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  const region = process.env.GKE_REGION || 'Unknown region';
  const nodeName = os.hostname();
  res.send(`Hello from Node.js running on node: ${nodeName}, in region: ${region}`);
});

app.listen(8080, '0.0.0.0', () => {
  console.log('Server is running on http://0.0.0.0:8080');
});
