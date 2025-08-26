#!/usr/bin/env node

/**
 * Build readiness check for Next.js standalone deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Checking Next.js standalone build readiness...\n');

// Key configuration checks
const checks = [
  {
    name: 'Next.js standalone configuration',
    check: () => {
      const configPath = path.join(__dirname, 'next.config.js');
      if (!fs.existsSync(configPath)) return false;
      const config = fs.readFileSync(configPath, 'utf8');
      return config.includes("output: 'standalone'");
    }
  },
  {
    name: 'Server components external packages',
    check: () => {
      const configPath = path.join(__dirname, 'next.config.js');
      if (!fs.existsSync(configPath)) return false;
      const config = fs.readFileSync(configPath, 'utf8');
      return config.includes('serverComponentsExternalPackages');
    }
  },
  {
    name: 'Production environment variables',
    check: () => {
      const envPath = path.join(__dirname, '.env.production');
      if (!fs.existsSync(envPath)) return false;
      const env = fs.readFileSync(envPath, 'utf8');
      return env.includes('NEXT_PUBLIC_API_URL');
    }
  },
  {
    name: 'Client providers wrapper',
    check: () => {
      const providersPath = path.join(__dirname, 'app/components/Providers.tsx');
      if (!fs.existsSync(providersPath)) return false;
      const providers = fs.readFileSync(providersPath, 'utf8');
      return providers.includes("'use client'") || providers.includes('"use client"');
    }
  },
  {
    name: 'Layout uses client providers',
    check: () => {
      const layoutPath = path.join(__dirname, 'app/layout.tsx');
      if (!fs.existsSync(layoutPath)) return false;
      const layout = fs.readFileSync(layoutPath, 'utf8');
      return layout.includes('Providers');
    }
  }
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  const passed = check();
  console.log(`${passed ? '✅' : '❌'} ${name}`);
  if (!passed) allPassed = false;
});

console.log('\n📋 Critical hook files with "use client":');
const criticalHooks = [
  'hooks/useAdminPageState.ts',
  'hooks/useAuth.ts',
  'hooks/useFlutterwaveInline.ts',
  'hooks/useReadingSession.ts'
];

criticalHooks.forEach(hookFile => {
  const hookPath = path.join(__dirname, hookFile);
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8');
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    console.log(`${hasUseClient ? '✅' : '❌'} ${hookFile}`);
    if (!hasUseClient) allPassed = false;
  } else {
    console.log(`⚠️  ${hookFile} (not found)`);
  }
});

console.log('\n🔧 Docker configuration:');
const dockerPath = path.join(__dirname, 'Dockerfile');
if (fs.existsSync(dockerPath)) {
  const dockerfile = fs.readFileSync(dockerPath, 'utf8');
  const hasStandalone = dockerfile.includes('.next/standalone');
  const hasStatic = dockerfile.includes('.next/static');
  const hasPublic = dockerfile.includes('public');
  
  console.log(`${hasStandalone ? '✅' : '❌'} Copies .next/standalone`);
  console.log(`${hasStatic ? '✅' : '❌'} Copies .next/static`);
  console.log(`${hasPublic ? '✅' : '❌'} Copies public directory`);
  
  if (!hasStandalone || !hasStatic || !hasPublic) allPassed = false;
} else {
  console.log('❌ Dockerfile not found');
  allPassed = false;
}

console.log(`\n${allPassed ? '🎉' : '⚠️ '} Build readiness: ${allPassed ? 'READY' : 'NEEDS ATTENTION'}`);

if (allPassed) {
  console.log('\n✨ Your Next.js app is configured for standalone deployment!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test: node .next/standalone/server.js');
  console.log('3. Deploy with Docker or copy .next/standalone to production');
} else {
  console.log('\n🔧 Please fix the issues above before deploying.');
}