import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Serve the VPS package directly without any authentication
app.get('/vps-package.zip', (req, res) => {
  const filePath = path.join(__dirname, 'menuisland-vps-ready.zip');
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="menuisland-vps-ready.zip"');
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    res.status(404).send('Package not found');
  }
});

// Simple download page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>MenuIsland VPS Package Download</title></head>
      <body style="font-family: Arial; padding: 40px; text-align: center;">
        <h1>MenuIsland VPS Package</h1>
        <p>Click the link below to download the complete VPS deployment package:</p>
        <a href="/vps-package.zip" style="display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px;">
          Download menuisland-vps-ready.zip
        </a>
        <p style="margin-top: 40px; color: #666;">
          Package includes: Complete application, SQLite database, all API keys configured, deployment guide
        </p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Download server running on port ${PORT}`);
  console.log(`Download link: http://localhost:${PORT}/vps-package.zip`);
});