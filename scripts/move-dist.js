const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'dist');
const sourceDir = path.join(__dirname, '..', 'dist', 'web');
const tempApiDir = path.join(__dirname, '..', '.temp-api');
const apiDir = path.join(targetDir, 'api');

// Restore api folder from temp location if it exists
if (fs.existsSync(tempApiDir)) {
  // Remove existing api folder if it exists
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
  }
  // Copy api folder back from temp
  fs.cpSync(tempApiDir, apiDir, { recursive: true });
  console.log('Restored dist/api from .temp-api');
  // Clean up temp dir
  fs.rmSync(tempApiDir, { recursive: true, force: true });
}

// If dist/web exists, move its contents to dist
if (fs.existsSync(sourceDir)) {
  // Remove old dist content except web and api folders
  const files = fs.readdirSync(targetDir);
  for (const file of files) {
    if (file !== 'web' && file !== 'api') {
      const filePath = path.join(targetDir, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }

  // Move web content to root of dist
  const webFiles = fs.readdirSync(sourceDir);
  for (const file of webFiles) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    fs.renameSync(sourcePath, targetPath);
  }

  // Remove empty web folder
  fs.rmdirSync(sourceDir);
  console.log('? Moved dist/web to dist');
} else {
  // expo export put files directly in dist, api folder already restored
  console.log('? Web files already in dist, api folder restored');
}
