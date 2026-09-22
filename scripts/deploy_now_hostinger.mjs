import * as ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. If directory exists, serve index.html inside it directly (e.g., /privacy-policy/)
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 2. If a corresponding .html file exists, rewrite to it directly
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f [OR]
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # 3. If exact file exists, serve it
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # 4. SPA fallback for dynamic app routes
  RewriteRule ^index\\.html$ - [L]
  RewriteRule . /index.html [L]
</IfModule>

# Caching & MIME types
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|json)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
`;

async function deployWithRetry(maxRetries = 3) {
  console.log('=== Starting Hostinger FTP Deployment ===\n');

  if (!fs.existsSync(distDir)) {
    console.error('❌ Error: dist/ directory not found. Please build first.');
    process.exit(1);
  }

  // Inject .htaccess
  const htaccessPath = path.join(distDir, '.htaccess');
  fs.writeFileSync(htaccessPath, htaccessContent, 'utf-8');
  console.log('✓ Injected clean-URL SPA .htaccess into dist/');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = new ftp.Client();
    client.ftp.verbose = false; // cleaner log
    client.ftp.timeout = 120000;

    try {
      console.log(`[Attempt ${attempt}/${maxRetries}] Connecting to Hostinger (187.124.193.92)...`);
      await client.access({
        host: '187.124.193.92',
        user: 'u460407084.zeeprep',
        password: '3S@EaVDHk79jmDP',
        port: 21,
        secure: false,
      });

      console.log('✓ Connected & Logged in successfully.');
      console.log('Uploading all files from dist/ to remote root / ...');

      // Upload dist directory contents to /
      await client.uploadFromDir(distDir);
      console.log('✓ File sync completed.');

      // Remove default.php if present so index.html is loaded directly
      try {
        await client.remove('default.php');
        console.log('✓ Cleaned up initial Hostinger default.php');
      } catch (e) {}

      console.log('\n====================================================');
      console.log('🎉 HOSTINGER DEPLOYMENT 100% COMPLETE & LIVE!');
      console.log('====================================================');
      client.close();
      return;
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} encountered error:`, err.message);
      client.close();
      if (attempt === maxRetries) {
        console.error('❌ Max retries reached. Deployment failed.');
        process.exit(1);
      }
      console.log('Waiting 3 seconds before retry...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

deployWithRetry();
