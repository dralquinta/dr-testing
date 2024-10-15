// Import required modules
const express = require('express');
const os = require('os');

// Initialize the Express app
const app = express();

// Define the port to listen on (default: 8080)
const PORT = process.env.PORT || 8080;

// Root route handler
app.get('/', (req, res) => {
  const region = process.env.GKE_REGION || 'Unknown region';
  const nodeName = os.hostname();
  
  const message = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #333;">Hello from Node.js!</h1>
      <p style="font-size: 1.2em;">Running on node: <strong>${nodeName}</strong></p>
      <p style="font-size: 1.2em;">In region: <strong>${region}</strong></p>
    </div>
  `;

  res.send(message);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
