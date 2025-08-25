// Debug script to test frontend login
// Run this in browser console on the login page

async function debugLogin() {
    console.log('🔍 Starting frontend login debug...');
    
    // Test 1: Direct fetch to backend
    console.log('\n1️⃣ Testing direct fetch to backend...');
    try {
        const directResponse = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@readnwin.com',
                password: 'admin123'
            })
        });
        
        console.log('Direct fetch status:', directResponse.status);
        
        if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ Direct fetch successful:', {
                hasToken: !!directData.access_token,
                userId: directData.user?.id,
                userRole: directData.user?.role?.name
            });
        } else {
            const errorText = await directResponse.text();
            console.log('❌ Direct fetch failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Direct fetch error:', error);
    }
    
    // Test 2: Check API base URL
    console.log('\n2️⃣ Checking API configuration...');
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('Current origin:', window.location.origin);
    
    // Test 3: Check localStorage and cookies
    console.log('\n3️⃣ Checking current auth state...');
    console.log('localStorage token:', localStorage.getItem('token'));
    console.log('localStorage user:', localStorage.getItem('user'));
    console.log('Document cookies:', document.cookie);
    
    // Test 4: Test with auth service
    console.log('\n4️⃣ Testing with auth service...');
    try {
        // Import auth service (this might not work in console, but worth trying)
        const { authService } = await import('/lib/auth-service.ts');
        const response = await authService.login('admin@readnwin.com', 'admin123');
        console.log('✅ Auth service login successful:', response);
    } catch (error) {
        console.log('❌ Auth service error:', error);
    }
    
    console.log('\n🔍 Debug complete!');
}

// Run the debug
debugLogin();