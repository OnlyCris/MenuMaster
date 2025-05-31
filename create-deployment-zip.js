import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create optimized ZIP for VPS deployment
const excludePatterns = [
  'node_modules',
  '.git',
  'uploads',
  '*.sqlite*',
  'dist',
  '.replit',
  'replit.nix',
  '*.log',
  '.env',
  'create-deployment-zip.js'
];

const excludeArgs = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');

try {
  console.log('Creating deployment ZIP...');
  execSync(`zip -r menuisland-vps-deploy.zip . ${excludeArgs}`, { stdio: 'inherit' });
  console.log('✅ menuisland-vps-deploy.zip created successfully!');
  
  // Get file size
  const stats = fs.statSync('menuisland-vps-deploy.zip');
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 File size: ${fileSizeInMB} MB`);
  
} catch (error) {
  console.error('❌ Error creating ZIP:', error.message);
}