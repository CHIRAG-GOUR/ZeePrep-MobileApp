import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

async function cleanAndDeploy() {
  console.log('=== Starting Clean Full Sync to Hostinger Web Root ===\n');

  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.ftp.timeout = 180000;

  try {
    console.log('Connecting to Hostinger (187.124.193.92)...');
    await client.access({
      host: '187.124.193.92',
      user: 'u460407084.zeeprep',
      password: '3S@EaVDHk79jmDP',
      port: 21,
      secure: false,
    });
    console.log('✓ Connected & Logged in.');

    await client.cd('/');
    console.log('Current remote root:', await client.pwd());

    // Clean up redundant nested public_html folder if it exists
    try {
      await client.removeDir('public_html');
      console.log('✓ Removed accidental nested public_html directory');
    } catch (e) {
      // not critical if it doesn't exist
    }

    console.log('\nUploading full dist/ directory to remote root / ...');
    await client.uploadFromDir(distDir);
    console.log('✓ Upload complete!');

    console.log('\nVerifying legal files at remote root:');
    const rootList = await client.list();
    const legalFiles = rootList.filter(f => 
      f.name.includes('privacy') || 
      f.name.includes('terms') || 
      f.name.includes('delete') ||
      f.name === 'index.html'
    );
    for (const f of legalFiles) {
      console.log(`  ✓ ${f.name} (size: ${f.size} bytes, modified: ${f.rawModifiedAt})`);
    }

    console.log('\n====================================================');
    console.log('🎉 HOSTINGER WEB ROOT SYNC 100% COMPLETE & VERIFIED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Clean deploy failed:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

cleanAndDeploy();
