import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'backend')
const distDir = path.join(rootDir, 'dist')
const distBackendDir = path.join(distDir, 'backend')
const distApiDir = path.join(distDir, 'api')

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src)
  if (!exists) return

  const stats = fs.statSync(src)
  const isDirectory = stats.isDirectory()

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    fs.readdirSync(src).forEach((childItemName) => {
      // Skip .git or system junk
      if (childItemName === '.git' || childItemName === '.DS_Store') return
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      )
    })
  } else {
    // Ensure parent dir exists
    const parentDir = path.dirname(dest)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }
    fs.copyFileSync(src, dest)
  }
}

console.log('\n🚀 [Build Setup] Integrating Backend into dist folder...')

if (!fs.existsSync(distDir)) {
  console.error('❌ Error: dist/ directory not found! Run vite build first.')
  process.exit(1)
}

// 1. Copy backend into dist/backend
console.log('📦 Copying backend/ to dist/backend/ ...')
copyRecursiveSync(backendDir, distBackendDir)

// Ensure uploads directory exists in dist/backend
const distUploads = path.join(distBackendDir, 'uploads')
if (!fs.existsSync(distUploads)) {
  fs.mkdirSync(distUploads, { recursive: true })
}

// 2. Create dist/api/ fallback bridge for Apache/cPanel setups
if (!fs.existsSync(distApiDir)) {
  fs.mkdirSync(distApiDir, { recursive: true })
}

const apiBridgePhp = `<?php
// Fallback bridge for hosts where /api/ is resolved as a physical directory
require_once __DIR__ . '/../backend/index.php';
`
fs.writeFileSync(path.join(distApiDir, 'index.php'), apiBridgePhp)

const apiHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [QSA,L]
</IfModule>
`
fs.writeFileSync(path.join(distApiDir, '.htaccess'), apiHtaccess)

// 3. Verify SQLite DB presence in dist/backend
const dbPath = path.join(distBackendDir, 'database.db')
const dbStatus = fs.existsSync(dbPath) ? '✅ Present' : '⚡ Will auto-create on first request'

console.log('✅ Backend setup successfully bundled into dist!')
console.log(`   - Frontend: dist/index.html & dist/assets/`)
console.log(`   - Backend API: dist/backend/`)
console.log(`   - Fallback Bridge: dist/api/`)
console.log(`   - SQLite Database: dist/backend/database.db (${dbStatus})`)
console.log(`   - Apache Config: dist/.htaccess (SPA & /api routing configured)`)
console.log('\n🎉 Ready to deploy! Upload the entire contents of "dist" directly to public_html or your web root.\n')
