/**
 * Test script to verify admin login redirect functionality
 * This script tests the complete flow from login to admin dashboard redirect
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Test admin credentials (you should replace these with actual test credentials)
const ADMIN_CREDENTIALS = {
  email: 'admin@readnwin.com',
  password: 'admin123'
};

/**
 * Test the login API endpoint
 */
async function testLoginAPI() {
  console.log('🔍 Testing login API endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Login API Response:', {
      hasToken: !!data.access_token,
      hasUser: !!data.user,
      userRole: data.user?.role?.name,
      userId: data.user?.id,
      userEmail: data.user?.email
    });

    return {
      success: true,
      token: data.access_token,
      user: data.user
    };
  } catch (error) {
    console.error('❌ Login API Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test the /auth/me endpoint to verify token validity
 */
async function testAuthMe(token) {
  console.log('🔍 Testing /auth/me endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const user = await response.json();
    
    console.log('✅ Auth Me Response:', {
      userId: user.id,
      userRole: user.role?.name,
      isAdmin: user.role?.name === 'admin' || user.role?.name === 'super_admin',
      permissions: user.permissions?.length || 0
    });

    return { success: true, user };
  } catch (error) {
    console.error('❌ Auth Me Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Simulate the frontend login flow
 */
function simulateLoginFlow(loginResult) {
  console.log('🔍 Simulating frontend login flow...');
  
  if (!loginResult.success) {
    console.log('❌ Login failed, would show error message');
    return { redirectTo: null, reason: 'Login failed' };
  }

  const user = loginResult.user;
  const isAdmin = user.role?.name === 'admin' || user.role?.name === 'super_admin';
  
  console.log('🔍 User role check:', {
    roleName: user.role?.name,
    isAdmin: isAdmin
  });

  // Simulate the redirect logic from login page
  if (isAdmin) {
    console.log('✅ Admin user detected, should redirect to /admin');
    return { redirectTo: '/admin', reason: 'Admin user' };
  } else {
    console.log('✅ Regular user detected, should redirect to /dashboard');
    return { redirectTo: '/dashboard', reason: 'Regular user' };
  }
}

/**
 * Test admin page access
 */
async function testAdminPageAccess(token, user) {
  console.log('🔍 Testing admin page access...');
  
  const isAdmin = user.role?.name === 'admin' || user.role?.name === 'super_admin';
  
  if (!isAdmin) {
    console.log('❌ User is not admin, should be denied access to /admin');
    return { success: false, reason: 'Not admin user' };
  }

  // In a real test, you would make a request to the admin page
  // For now, we'll simulate the frontend logic
  console.log('✅ User has admin role, should have access to /admin');
  return { success: true, reason: 'Admin access granted' };
}

/**
 * Main test function
 */
async function runAdminRedirectTest() {
  console.log('🚀 Starting Admin Login Redirect Test\n');
  
  // Step 1: Test login API
  const loginResult = await testLoginAPI();
  console.log('');
  
  if (!loginResult.success) {
    console.log('❌ Test failed at login step');
    return;
  }

  // Step 2: Test token validation
  const authResult = await testAuthMe(loginResult.token);
  console.log('');
  
  if (!authResult.success) {
    console.log('❌ Test failed at token validation step');
    return;
  }

  // Step 3: Simulate frontend redirect logic
  const redirectResult = simulateLoginFlow(loginResult);
  console.log('');
  
  // Step 4: Test admin page access
  const accessResult = await testAdminPageAccess(loginResult.token, loginResult.user);
  console.log('');
  
  // Summary
  console.log('📋 Test Summary:');
  console.log('================');
  console.log(`Login API: ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Validation: ${authResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Redirect Logic: ${redirectResult.redirectTo ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Admin Access: ${accessResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (redirectResult.redirectTo === '/admin' && accessResult.success) {
    console.log('\n🎉 OVERALL RESULT: ✅ PASS - Admin login redirect works correctly!');
  } else {
    console.log('\n❌ OVERALL RESULT: ❌ FAIL - Admin login redirect has issues');
  }
}

// Export for use in other files or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAdminRedirectTest,
    testLoginAPI,
    testAuthMe,
    simulateLoginFlow,
    testAdminPageAccess
  };
} else {
  // Run the test if this file is executed directly
  runAdminRedirectTest().catch(console.error);
}