#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// Get the module ID from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
const packageJson = JSON.parse(packageJsonContent);
const moduleId = packageJson.name;

// Get the Foundry user data path (standard locations)
const username = os.userInfo().username;
const appDataLocal = path.join(os.homedir(), 'AppData', 'Local');
const foundryPath = path.join(
  appDataLocal,
  'FoundryVTT',
  'Data',
  'modules',
  moduleId
);

// Get the dist directory of the current project
const distPath = path.join(__dirname, 'dist');

// Check for --clean flag
const isClean = process.argv.includes('--clean');

try {
  if (isClean) {
    // Remove the symlink
    if (fs.existsSync(foundryPath)) {
      // Check if it's a junction/symlink
      const stats = fs.lstatSync(foundryPath);
      if (stats.isSymbolicLink() || stats.isDirectory()) {
        fs.rmSync(foundryPath, { recursive: true, force: true });
        console.log(`✓ Removed symlink: ${foundryPath}`);
      }
    }
  } else {
    // Create the symlink
    // First, ensure the modules directory exists
    const modulesDir = path.dirname(foundryPath);
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir, { recursive: true });
      console.log(`✓ Created modules directory: ${modulesDir}`);
    }

    // Remove existing symlink if it exists
    if (fs.existsSync(foundryPath)) {
      fs.rmSync(foundryPath, { recursive: true, force: true });
      console.log(`✓ Removed existing symlink/directory: ${foundryPath}`);
    }

    // Create the symlink (junction for Windows compatibility)
    fs.symlinkSync(distPath, foundryPath, 'junction');
    console.log(`✓ Created symlink:`);
    console.log(`  From: ${distPath}`);
    console.log(`  To:   ${foundryPath}`);
    console.log(`\n✓ Your module is now linked to Foundry!`);
    console.log(`✓ Restart your Foundry instance to see it in the module list.`);
  }
} catch (error) {
  console.error(`✗ Error: ${error.message}`);
  process.exit(1);
}
