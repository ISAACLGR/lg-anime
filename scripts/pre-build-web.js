const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const apiDir = path.join(distDir, 'api');
const tempApiDir = path.join(__dirname, '..', '.temp-api');

// Save api folder to temp location if it exists
if (fs.existsSync(apiDir)) {
  // Remove temp dir if exists
  if (fs.existsSync(tempApiDir)) {
    fs.rmSync(tempApiDir, { recursive: true, force: true });
  }
  // Copy api folder to temp location
  fs.cpSync(apiDir, tempApiDir, { recursive: true });
  console.log('Saved dist/api to .temp-api');
}
