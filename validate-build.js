#!/usr/bin/env node

/**
 * Build validation script to check for common Next.js standalone build issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Next.js standalone build configuration...\n');

// Check next.config.js
const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes("output: 'standalone'")) {
    console.log('✅ Next.js standalone output configured');
  } else {
    console.log('❌ Missing standalone output configuration');
  }
  
  if (nextConfig.includes('serverComponentsExternalPackages')) {
    console.log('✅ Server components external packages configured');
  } else {
    console.log('⚠️  No server components external packages configured');
  }
} else {
  console.log('❌ next.config.js not found');
}

// Check for 'use client' directives in hook files
const hookFiles = [
  'hooks/useFlutterwaveInline.ts',
  'hooks/useReadingSession.ts',
  'hooks/useCheckoutFlow.ts',
  'hooks/useCheckout.ts',
  'hooks/useCheckoutError.ts',
  'hooks/useBooks.ts',
  'hooks/useReadingProgress.ts',
  'hooks/useCheckoutService.ts',
  'lib/hooks/useApi.ts'
];

let missingUseClient = [];
hookFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("'use client'")) {
      missingUseClient.push(file);
    }
  }
});

if (missingUseClient.length === 0) {
  console.log('✅ All hook files have "use client" directive');
} else {
  console.log('❌ Missing "use client" directive in:', missingUseClient.join(', '));
}

// Check for browser API usage without 'use client'
const checkBrowserAPIs = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
      checkBrowserAPIs(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasBrowserAPI = /localStorage|sessionStorage|window\.|document\.|navigator\./.test(content);
      const hasUseClient = content.includes("'use client'");
      
      if (hasBrowserAPI && !hasUseClient) {
        files.push(fullPath.replace(__dirname + '/', ''));
      }
    }
  }
  
  return files;
};

const browserAPIFiles = checkBrowserAPIs(__dirname);
if (browserAPIFiles.length === 0) {
  console.log('✅ All files using browser APIs have "use client" directive');
} else {
  console.log('⚠️  Files using browser APIs without "use client":', browserAPIFiles.slice(0, 5).join(', '));
  if (browserAPIFiles.length > 5) {
    console.log(`   ... and ${browserAPIFiles.length - 5} more files`);
  }
}

// Check package.json for build script
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ Build script found in package.json');
  } else {
    console.log('❌ No build script in package.json');
  }
}

// Check for environment variables
const envProdPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envProdPath)) {
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  if (envContent.includes('NEXT_PUBLIC_API_URL')) {
    console.log('✅ Production environment variables configured');
  } else {
    console.log('❌ Missing NEXT_PUBLIC_API_URL in .env.production');
  }
} else {
  console.log('⚠️  No .env.production file found');
}

console.log('\n🏁 Validation complete!');
console.log('\nTo test the build locally:');
console.log('1. Run: npm run build');
console.log('2. Run: node .next/standalone/server.js');
console.log('3. Check for any React errors in the console');