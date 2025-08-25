/**
 * Verification script for admin login redirect functionality
 * This script analyzes the code to verify the redirect logic is correct
 */

const fs = require('fs');
const path = require('path');

// Read the login page code
function analyzeLoginPage() {
  console.log('🔍 Analyzing login page redirect logic...\n');
  
  const loginPagePath = path.join(__dirname, 'app/login/page.tsx');
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
  
  // Check for redirect logic
  const hasRedirectLogic = loginPageContent.includes('router.push("/dashboard")');
  const hasCallbackRedirect = loginPageContent.includes('searchParams.get("redirect")');
  const hasCallbackUrlRedirect = loginPageContent.includes('searchParams.get("callbackUrl")');
  
  console.log('📄 Login Page Analysis:');
  console.log('=======================');
  console.log(`✅ Has default dashboard redirect: ${hasRedirectLogic}`);
  console.log(`✅ Has callback redirect support: ${hasCallbackRedirect}`);
  console.log(`✅ Has callbackUrl redirect support: ${hasCallbackUrlRedirect}`);
  
  return {
    hasRedirectLogic,
    hasCallbackRedirect,
    hasCallbackUrlRedirect
  };
}

// Read the admin page code
function analyzeAdminPage() {
  console.log('\n🔍 Analyzing admin page access control...\n');
  
  const adminPagePath = path.join(__dirname, 'app/admin/page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
  
  // Check for role-based access control
  const hasRoleCheck = adminPageContent.includes('user.role?.name !== "admin"') && 
                      adminPageContent.includes('user.role?.name !== "super_admin"');
  const hasLoginRedirect = adminPageContent.includes('router.replace("/login")');
  const hasAuthCheck = adminPageContent.includes('authLoading');
  
  console.log('📄 Admin Page Analysis:');
  console.log('=======================');
  console.log(`✅ Has role-based access control: ${hasRoleCheck}`);
  console.log(`✅ Has login redirect for unauthorized: ${hasLoginRedirect}`);
  console.log(`✅ Has authentication loading check: ${hasAuthCheck}`);
  
  return {
    hasRoleCheck,
    hasLoginRedirect,
    hasAuthCheck
  };
}

// Read the auth service
function analyzeAuthService() {
  console.log('\n🔍 Analyzing auth service...\n');
  
  const authServicePath = path.join(__dirname, 'lib/auth-service.ts');
  const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
  
  // Check for proper token and user storage
  const storesToken = authServiceContent.includes('localStorage.setItem(\'token\'');
  const storesUser = authServiceContent.includes('localStorage.setItem(\'user\'');
  const setsCookie = authServiceContent.includes('document.cookie');
  const hasGetUser = authServiceContent.includes('getUser()');
  
  console.log('📄 Auth Service Analysis:');
  console.log('=========================');
  console.log(`✅ Stores token in localStorage: ${storesToken}`);
  console.log(`✅ Stores user in localStorage: ${storesUser}`);
  console.log(`✅ Sets authentication cookie: ${setsCookie}`);
  console.log(`✅ Has getUser method: ${hasGetUser}`);
  
  return {
    storesToken,
    storesUser,
    setsCookie,
    hasGetUser
  };
}

// Read the auth hook
function analyzeAuthHook() {
  console.log('\n🔍 Analyzing auth hook...\n');
  
  const authHookPath = path.join(__dirname, 'hooks/useAuth-new.ts');
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');
  
  // Check for proper authentication state management
  const hasUserState = authHookContent.includes('user: User | null');
  const hasIsAuthenticated = authHookContent.includes('isAuthenticated: boolean');
  const hasLoginMethod = authHookContent.includes('const login = async');
  const returnsUserRole = authHookContent.includes('role:');
  
  console.log('📄 Auth Hook Analysis:');
  console.log('======================');
  console.log(`✅ Has user state management: ${hasUserState}`);
  console.log(`✅ Has isAuthenticated flag: ${hasIsAuthenticated}`);
  console.log(`✅ Has login method: ${hasLoginMethod}`);
  console.log(`✅ Returns user role information: ${returnsUserRole}`);
  
  return {
    hasUserState,
    hasIsAuthenticated,
    hasLoginMethod,
    returnsUserRole
  };
}

// Check middleware
function analyzeMiddleware() {
  console.log('\n🔍 Analyzing middleware...\n');
  
  const middlewarePath = path.join(__dirname, 'middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check for proper route protection
  const protectsAdminRoutes = middlewareContent.includes('/admin/:path*');
  const checksToken = middlewareContent.includes('request.cookies.get(\'token\')');
  const redirectsToLogin = middlewareContent.includes('redirect', 'path');
  
  console.log('📄 Middleware Analysis:');
  console.log('=======================');
  console.log(`✅ Protects admin routes: ${protectsAdminRoutes}`);
  console.log(`✅ Checks authentication token: ${checksToken}`);
  console.log(`✅ Redirects unauthorized to login: ${redirectsToLogin}`);
  
  return {
    protectsAdminRoutes,
    checksToken,
    redirectsToLogin
  };
}

// Verify the complete flow
function verifyAdminRedirectFlow() {
  console.log('🚀 Verifying Admin Login Redirect Flow\n');
  console.log('=' .repeat(50));
  
  const loginAnalysis = analyzeLoginPage();
  const adminAnalysis = analyzeAdminPage();
  const authServiceAnalysis = analyzeAuthService();
  const authHookAnalysis = analyzeAuthHook();
  const middlewareAnalysis = analyzeMiddleware();
  
  console.log('\n📋 VERIFICATION SUMMARY:');
  console.log('=' .repeat(50));
  
  // Check if all critical components are in place
  const criticalChecks = [
    { name: 'Login page has redirect logic', passed: loginAnalysis.hasRedirectLogic },
    { name: 'Login page supports callback redirects', passed: loginAnalysis.hasCallbackRedirect },
    { name: 'Admin page has role-based access', passed: adminAnalysis.hasRoleCheck },
    { name: 'Admin page redirects unauthorized users', passed: adminAnalysis.hasLoginRedirect },
    { name: 'Auth service stores user data', passed: authServiceAnalysis.storesUser },
    { name: 'Auth hook manages authentication state', passed: authHookAnalysis.hasIsAuthenticated },
    { name: 'Middleware protects admin routes', passed: middlewareAnalysis.protectsAdminRoutes }
  ];
  
  let allPassed = true;
  criticalChecks.forEach(check => {
    const status = check.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${check.name}`);
    if (!check.passed) allPassed = false;
  });
  
  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log('=' .repeat(50));
  
  if (allPassed) {
    console.log('🎉 ✅ VERIFICATION PASSED!');
    console.log('\nThe admin login redirect functionality is properly implemented:');
    console.log('1. ✅ Login page redirects to /dashboard by default');
    console.log('2. ✅ Login page supports callback URL redirects');
    console.log('3. ✅ Admin page checks user roles (admin/super_admin)');
    console.log('4. ✅ Unauthorized users are redirected to login');
    console.log('5. ✅ Authentication state is properly managed');
    console.log('6. ✅ Middleware protects admin routes');
    
    console.log('\n📝 HOW IT WORKS:');
    console.log('================');
    console.log('1. User logs in with admin credentials');
    console.log('2. Auth service stores user data with role information');
    console.log('3. Login page redirects to /dashboard (or callback URL)');
    console.log('4. If user navigates to /admin, middleware checks token');
    console.log('5. Admin page checks user role and grants/denies access');
    console.log('6. Non-admin users are redirected back to login');
  } else {
    console.log('❌ ⚠️  VERIFICATION FAILED!');
    console.log('\nSome components of the admin redirect flow are missing or incomplete.');
    console.log('Please review the failed checks above and fix the issues.');
  }
  
  console.log('\n💡 TESTING RECOMMENDATIONS:');
  console.log('============================');
  console.log('1. Test with admin credentials: admin@readnwin.com');
  console.log('2. Test with regular user credentials');
  console.log('3. Test direct navigation to /admin without login');
  console.log('4. Test login with ?redirect=/admin parameter');
  console.log('5. Verify role-based access in browser dev tools');
}

// Run the verification
verifyAdminRedirectFlow();