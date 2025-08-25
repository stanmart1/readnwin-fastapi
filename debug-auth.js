// Debug script to help identify authentication issues
// Run this in your browser console on the login page

console.log('🔍 Authentication Debug Information');
console.log('=====================================');

// Check environment variables
console.log('1. Environment Configuration:');
console.log('   API URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set');
console.log('   Current URL:', window.location.href);

// Check local storage
console.log('\n2. Local Storage:');
console.log('   Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
console.log('   User:', localStorage.getItem('user') ? 'Present' : 'Missing');

// Check cookies
console.log('\n3. Cookies:');
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=');
  acc[key] = value;
  return acc;
}, {});
console.log('   Token cookie:', cookies.token ? 'Present' : 'Missing');

// Test API connectivity
console.log('\n4. Testing API Connectivity:');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

fetch(`${apiUrl}/auth/me`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  }
})
.then(response => {
  console.log('   API Response Status:', response.status);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`HTTP ${response.status}`);
  }
})
.then(data => {
  console.log('   API Response Data:', data);
})
.catch(error => {
  console.log('   API Error:', error.message);
});

// Check if backend is running
fetch(`${apiUrl}/docs`)
.then(response => {
  console.log('   Backend Status:', response.ok ? 'Running' : 'Not responding');
})
.catch(error => {
  console.log('   Backend Status: Not reachable');
});

console.log('\n5. Recommendations:');
console.log('   - Check if backend is running on port 9000');
console.log('   - Verify API_URL matches backend port');
console.log('   - Clear localStorage and cookies if needed');
console.log('   - Check network tab for failed requests');