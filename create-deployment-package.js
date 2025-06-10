import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const output = fs.createWriteStream('menuisland-complete.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('Archive created: ' + archive.pointer() + ' total bytes');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add all files except excluded ones
const excludePatterns = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.env.local',
  '.env.production',
  '*.log',
  '.upm',
  '.breakpoints',
  'vite.config.ts.timestamp*',
  '.replit',
  'replit.nix',
  'menuisland-complete.zip',
  'create-deployment-package.js'
];

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function addDirectory(dirPath, archivePath = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const archiveItemPath = path.join(archivePath, item);
    
    if (shouldExclude(fullPath)) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      addDirectory(fullPath, archiveItemPath);
    } else {
      archive.file(fullPath, { name: archiveItemPath });
    }
  }
}

// Add the deployment guide
archive.file('DEPLOYMENT_GUIDE.md', { name: 'DEPLOYMENT_GUIDE.md' });

// Add all project files
addDirectory('.', '');

archive.finalize();