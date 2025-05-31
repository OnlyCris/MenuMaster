import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'menuisland-vps-ready.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('MenuIsland VPS package created: ' + archive.pointer() + ' total bytes');
  console.log('Package ready for deployment at: menuisland-vps-ready.zip');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files and directories
const filesToInclude = [
  'client/',
  'server/',
  'shared/',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'components.json',
  'drizzle.config.sqlite.ts',
  '.env.production',
  'deployment-guide.md'
];

filesToInclude.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      archive.directory(fullPath, file);
    } else {
      archive.file(fullPath, { name: file });
    }
  }
});

// Finalize the archive
archive.finalize();