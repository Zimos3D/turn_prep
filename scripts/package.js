import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releasesDir = path.resolve(rootDir, 'releases');
const moduleJsonPath = path.resolve(distDir, 'module.json');

async function packageRelease() {
  console.log('Starting release packaging...');

  // 1. Check if dist exists
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // 2. Read module.json to get ID
  if (!fs.existsSync(moduleJsonPath)) {
    console.error('Error: module.json not found in dist.');
    process.exit(1);
  }
  
  const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
  const moduleId = moduleJson.id;

  console.log(`Packaging module: ${moduleId} v${moduleJson.version}`);

  // 3. Create releases directory
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir, { recursive: true });
  }

  // 4. Copy module.json to releases
  // This is the file you link to in your "Latest Release" on GitHub
  const destModuleJson = path.resolve(releasesDir, 'module.json');
  fs.copyFileSync(moduleJsonPath, destModuleJson);
  console.log(`Generated: ${path.relative(rootDir, destModuleJson)}`);

  // 5. Create Zip
  const zipName = `${moduleId}.zip`; 
  const zipPath = path.join(releasesDir, zipName);
  const output = fs.createWriteStream(zipPath);
  
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  output.on('close', function() {
    console.log(`Generated: ${path.relative(rootDir, zipPath)} (${(archive.pointer() / 1024).toFixed(2)} KB)`);
    console.log('----------------------------------------');
    console.log('Build & Package Complete!');
    console.log('Upload these files to your GitHub Release:');
    console.log(`1. ${path.relative(rootDir, zipPath)}`);
    console.log(`2. ${path.relative(rootDir, destModuleJson)}`);
  });

  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // Append files from dist, putting them inside a folder named after the module ID
  // This creates the required structure: turn-prep.zip -> turn-prep/ -> files...
  archive.directory(distDir, moduleId);

  await archive.finalize();
}

packageRelease().catch(err => console.error(err));
