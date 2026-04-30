const fs = require('fs');
const path = require('path');

// Move dist/web to dist for Vercel
const sourceDir = path.join(__dirname, '..', 'dist', 'web');
const targetDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(sourceDir)) {
  // Remove old dist content except web folder
  const files = fs.readdirSync(targetDir);
  for (const file of files) {
    if (file !== 'web') {
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
  console.log('?? dist/web not found');
}
