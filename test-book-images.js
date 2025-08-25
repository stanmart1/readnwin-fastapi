// Test script to verify book cover images are working correctly
// Run this in your browser console on any page with book cards

console.log('🖼️ Testing Book Cover Images');
console.log('============================');

// Test the utility function
const testImageUrl = (imagePath, description) => {
  console.log(`\n${description}:`);
  console.log(`Input: ${imagePath}`);
  
  // Simulate the constructImageUrl function
  const constructImageUrl = (imagePath, apiUrl) => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return '';
    }

    const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `${baseUrl}${imagePath}`;
    }

    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }

    return `${baseUrl}/uploads/covers/${imagePath}`;
  };
  
  const result = constructImageUrl(imagePath);
  console.log(`Output: ${result}`);
  return result;
};

// Test various image path formats
testImageUrl('/uploads/covers/book1.jpg', 'Backend API path');
testImageUrl('book2.jpg', 'Filename only');
testImageUrl('https://example.com/book3.jpg', 'Full URL');
testImageUrl('/book4.jpg', 'Absolute path');
testImageUrl('', 'Empty string');
testImageUrl(null, 'Null value');
testImageUrl(undefined, 'Undefined value');

// Test API connectivity
console.log('\n🔗 Testing API Connectivity:');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

fetch(`${apiUrl}/books/?limit=3&is_featured=true`)
  .then(response => response.json())
  .then(data => {
    console.log('\n📚 Sample Books from API:');
    const books = data.books || [];
    books.forEach((book, index) => {
      console.log(`\nBook ${index + 1}: ${book.title}`);
      console.log(`  Author: ${book.author_name || book.author}`);
      console.log(`  Cover Image: ${book.cover_image}`);
      console.log(`  Cover URL: ${book.cover_image_url}`);
      
      if (book.cover_image_url) {
        const fullUrl = book.cover_image_url.startsWith('http') 
          ? book.cover_image_url 
          : `${apiUrl}${book.cover_image_url}`;
        console.log(`  Full URL: ${fullUrl}`);
        
        // Test if image is accessible
        const img = new Image();
        img.onload = () => console.log(`  ✅ Image loads successfully`);
        img.onerror = () => console.log(`  ❌ Image failed to load`);
        img.src = fullUrl;
      } else {
        console.log(`  ⚠️ No cover image available`);
      }
    });
  })
  .catch(error => {
    console.log(`❌ API Error: ${error.message}`);
  });

console.log('\n💡 Tips:');
console.log('- Check that your backend is running on the correct port');
console.log('- Verify that book cover images exist in uploads/covers/ directory');
console.log('- Ensure NEXT_PUBLIC_API_URL matches your backend URL');
console.log('- Look for any 404 errors in the Network tab for missing images');